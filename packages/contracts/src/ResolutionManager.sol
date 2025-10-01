// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FeeConfig.sol";
import "./EventFactory.sol";
import "./MarketAMM.sol";

/**
 * @title ResolutionManager
 * @notice Optimistic oracle for resolving prediction markets
 */
contract ResolutionManager is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    enum ResolutionState {
        PENDING,      // Before resolveAt
        REPORTABLE,   // After resolveAt, can report
        REPORTED,     // Report submitted, in dispute window
        DISPUTED,     // Disputed, awaiting arbiter
        RESOLVED      // Final resolution
    }
    
    struct Report {
        address reporter;
        bool outcome; // true = YES, false = NO
        string evidenceURI;
        uint256 reportedAt;
        uint256 bondAmount;
    }
    
    struct Dispute {
        address disputer;
        string reasonURI;
        uint256 disputedAt;
        uint256 bondAmount;
    }
    
    struct Resolution {
        bytes32 marketId;
        ResolutionState state;
        Report report;
        Dispute dispute;
        bool finalOutcome;
        bool isInvalid;
        uint256 settlementFees;
    }
    
    FeeConfig public immutable feeConfig;
    EventFactory public immutable eventFactory;
    IERC20 public immutable usdcToken;
    
    mapping(bytes32 => Resolution) public resolutions;
    
    event Reported(bytes32 indexed marketId, address indexed reporter, bool outcome, string evidenceURI);
    event Disputed(bytes32 indexed marketId, address indexed disputer, string reasonURI);
    event ArbiterResolved(bytes32 indexed marketId, bool finalOutcome, bool isInvalid);
    event BondSlashed(bytes32 indexed marketId, address indexed loser, uint256 amount);
    event BondReturned(bytes32 indexed marketId, address indexed winner, uint256 amount);
    
    modifier onlyArbiter() {
        require(msg.sender == feeConfig.arbiterAddress(), "Not arbiter");
        _;
    }
    
    constructor(address _feeConfig, address _eventFactory, address _usdcToken) {
        feeConfig = FeeConfig(_feeConfig);
        eventFactory = EventFactory(_eventFactory);
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @notice Report outcome after resolveAt
     */
    function report(bytes32 marketId, bool outcome, string calldata evidenceURI) external nonReentrant {
        Resolution storage resolution = resolutions[marketId];
        EventFactory.EventInfo memory eventInfo = eventFactory.getEventInfo(marketId);
        
        require(eventInfo.creator != address(0), "Market not found");
        require(block.timestamp >= eventInfo.resolveAt, "Not yet reportable");
        require(resolution.state == ResolutionState.PENDING || resolution.state == ResolutionState.REPORTABLE, "Already reported");
        require(bytes(evidenceURI).length > 0, "Evidence required");
        
        uint256 bondAmount = feeConfig.reportBond();
        usdcToken.safeTransferFrom(msg.sender, address(this), bondAmount);
        
        resolution.marketId = marketId;
        resolution.state = ResolutionState.REPORTED;
        resolution.report = Report({
            reporter: msg.sender,
            outcome: outcome,
            evidenceURI: evidenceURI,
            reportedAt: block.timestamp,
            bondAmount: bondAmount
        });
        
        emit Reported(marketId, msg.sender, outcome, evidenceURI);
    }
    
    /**
     * @notice Dispute a report within dispute window
     */
    function dispute(bytes32 marketId, string calldata reasonURI) external nonReentrant {
        Resolution storage resolution = resolutions[marketId];
        require(resolution.state == ResolutionState.REPORTED, "Nothing to dispute");
        
        uint256 disputeWindowEnd = resolution.report.reportedAt + feeConfig.disputeWindow();
        require(block.timestamp <= disputeWindowEnd, "Dispute window closed");
        require(bytes(reasonURI).length > 0, "Reason required");
        
        // Calculate dispute bond based on open interest
        MarketAMM amm = MarketAMM(eventFactory.getEventInfo(marketId).ammAddress);
        uint256 openInterest = amm.liquidityUsd(); // Using liquidity as proxy for OI
        uint256 bondAmount = feeConfig.calculateDisputeBond(openInterest);
        
        usdcToken.safeTransferFrom(msg.sender, address(this), bondAmount);
        
        resolution.state = ResolutionState.DISPUTED;
        resolution.dispute = Dispute({
            disputer: msg.sender,
            reasonURI: reasonURI,
            disputedAt: block.timestamp,
            bondAmount: bondAmount
        });
        
        emit Disputed(marketId, msg.sender, reasonURI);
    }
    
    /**
     * @notice Arbiter resolves disputed market
     */
    function arbiterResolve(bytes32 marketId, bool finalOutcome) external onlyArbiter {
        Resolution storage resolution = resolutions[marketId];
        require(resolution.state == ResolutionState.DISPUTED || resolution.state == ResolutionState.REPORTED, "Invalid state");
        
        resolution.state = ResolutionState.RESOLVED;
        resolution.finalOutcome = finalOutcome;
        resolution.isInvalid = false;
        
        _settleMarket(marketId, finalOutcome, false);
        _handleBonds(marketId, finalOutcome);
        
        emit ArbiterResolved(marketId, finalOutcome, false);
    }
    
    /**
     * @notice Arbiter invalidates market
     */
    function invalidate(bytes32 marketId) external onlyArbiter {
        Resolution storage resolution = resolutions[marketId];
        require(resolution.state == ResolutionState.DISPUTED || resolution.state == ResolutionState.REPORTED, "Invalid state");
        
        resolution.state = ResolutionState.RESOLVED;
        resolution.isInvalid = true;
        
        _settleMarket(marketId, false, true);
        
        // Return all bonds when invalidated
        if (resolution.report.bondAmount > 0) {
            usdcToken.safeTransfer(resolution.report.reporter, resolution.report.bondAmount);
            emit BondReturned(marketId, resolution.report.reporter, resolution.report.bondAmount);
        }
        
        if (resolution.dispute.bondAmount > 0) {
            usdcToken.safeTransfer(resolution.dispute.disputer, resolution.dispute.bondAmount);
            emit BondReturned(marketId, resolution.dispute.disputer, resolution.dispute.bondAmount);
        }
        
        emit ArbiterResolved(marketId, false, true);
    }
    
    /**
     * @notice Auto-resolve if no dispute within window
     */
    function autoResolve(bytes32 marketId) external {
        Resolution storage resolution = resolutions[marketId];
        require(resolution.state == ResolutionState.REPORTED, "Not in reported state");
        
        uint256 disputeWindowEnd = resolution.report.reportedAt + feeConfig.disputeWindow();
        require(block.timestamp > disputeWindowEnd, "Dispute window still open");
        
        resolution.state = ResolutionState.RESOLVED;
        resolution.finalOutcome = resolution.report.outcome;
        resolution.isInvalid = false;
        
        _settleMarket(marketId, resolution.report.outcome, false);
        
        // Return reporter bond
        usdcToken.safeTransfer(resolution.report.reporter, resolution.report.bondAmount);
        emit BondReturned(marketId, resolution.report.reporter, resolution.report.bondAmount);
    }
    
    /**
     * @notice Get resolution state for a market
     */
    function getResolutionState(bytes32 marketId) external view returns (ResolutionState) {
        Resolution storage resolution = resolutions[marketId];
        if (resolution.state != ResolutionState.PENDING) {
            return resolution.state;
        }
        
        EventFactory.EventInfo memory eventInfo = eventFactory.getEventInfo(marketId);
        if (eventInfo.creator == address(0)) {
            return ResolutionState.PENDING;
        }
        
        if (block.timestamp >= eventInfo.resolveAt) {
            return ResolutionState.REPORTABLE;
        }
        
        return ResolutionState.PENDING;
    }
    
    /**
     * @notice Get full resolution info
     */
    function getResolution(bytes32 marketId) external view returns (Resolution memory) {
        return resolutions[marketId];
    }
    
    function _settleMarket(bytes32 marketId, bool finalOutcome, bool isInvalid) internal {
        EventFactory.EventInfo memory eventInfo = eventFactory.getEventInfo(marketId);
        MarketAMM amm = MarketAMM(eventInfo.ammAddress);
        
        // Calculate and collect settlement fees
        uint256 totalValue = amm.liquidityUsd();
        uint256 settlementFee = (totalValue * feeConfig.settlementFeeRate()) / 10000;
        
        resolutions[marketId].settlementFees = settlementFee;
        
        // Distribute settlement fees
        uint256 protocolFee = (settlementFee * feeConfig.settlementFeeProtocol()) / 10000;
        uint256 creatorFee = (settlementFee * feeConfig.settlementFeeCreator()) / 10000;
        uint256 disputeFee = settlementFee - protocolFee - creatorFee;
        
        // Transfer fees (simplified - in practice would need proper accounting)
        address treasuryAddress = feeConfig.treasuryAddress();
        usdcToken.safeTransfer(treasuryAddress, protocolFee);
        usdcToken.safeTransfer(eventInfo.creator, creatorFee);
        
        // Call AMM settle
        amm.settle(finalOutcome, isInvalid);
    }
    
    function _handleBonds(bytes32 marketId, bool finalOutcome) internal {
        Resolution storage resolution = resolutions[marketId];
        
        if (resolution.state != ResolutionState.DISPUTED) {
            // No dispute, return reporter bond
            usdcToken.safeTransfer(resolution.report.reporter, resolution.report.bondAmount);
            emit BondReturned(marketId, resolution.report.reporter, resolution.report.bondAmount);
            return;
        }
        
        // Disputed case - loser pays winner
        bool reporterWon = (resolution.report.outcome == finalOutcome);
        
        if (reporterWon) {
            // Reporter was correct, gets both bonds
            uint256 totalBond = resolution.report.bondAmount + resolution.dispute.bondAmount;
            usdcToken.safeTransfer(resolution.report.reporter, totalBond);
            emit BondReturned(marketId, resolution.report.reporter, totalBond);
            emit BondSlashed(marketId, resolution.dispute.disputer, resolution.dispute.bondAmount);
        } else {
            // Disputer was correct, gets both bonds
            uint256 totalBond = resolution.report.bondAmount + resolution.dispute.bondAmount;
            usdcToken.safeTransfer(resolution.dispute.disputer, totalBond);
            emit BondReturned(marketId, resolution.dispute.disputer, totalBond);
            emit BondSlashed(marketId, resolution.report.reporter, resolution.report.bondAmount);
        }
    }
}
