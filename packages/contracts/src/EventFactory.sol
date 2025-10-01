// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FeeConfig.sol";
import "./MarketAMM.sol";

/**
 * @title EventFactory
 * @notice Factory for creating prediction market events with duplicate detection
 */
contract EventFactory is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct EventParams {
        string category;
        string title;
        string description;
        uint256 resolveAt;
        string primarySource;
        bytes ruleBytes;
        uint256 initialLiquidity;
    }
    
    struct EventInfo {
        bytes32 marketId;
        address creator;
        address ammAddress;
        uint256 createdAt;
        uint256 resolveAt;
        string category;
        string title;
        string description;
        string primarySource;
        bytes ruleBytes;
        uint256 createBondAmount;
        bool bondRefunded;
        bool finalized;
    }
    
    FeeConfig public immutable feeConfig;
    IERC20 public immutable usdcToken;
    
    // Market tracking
    mapping(bytes32 => EventInfo) public events;
    mapping(address => bytes32[]) public creatorEvents;
    bytes32[] public allMarketIds;
    
    // Bond tracking
    mapping(bytes32 => uint256) public bondEscrow;
    
    event EventCreated(
        bytes32 indexed marketId,
        address indexed creator,
        address indexed ammAddress,
        string category,
        string title,
        uint256 resolveAt
    );
    
    event EventFinalized(bytes32 indexed marketId, address indexed creator);
    event BondRefunded(bytes32 indexed marketId, address indexed creator, uint256 amount);
    
    constructor(address _feeConfig, address _usdcToken) {
        feeConfig = FeeConfig(_feeConfig);
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @notice Create a new prediction market event
     */
    function createEvent(EventParams calldata params) external nonReentrant returns (bytes32 marketId) {
        require(params.resolveAt > block.timestamp, "Invalid resolve time");
        require(bytes(params.title).length > 0, "Title required");
        require(bytes(params.category).length > 0, "Category required");
        
        // Generate market ID for duplicate detection
        marketId = _generateMarketId(
            params.category,
            params.title,
            params.resolveAt,
            params.primarySource,
            params.ruleBytes
        );
        
        require(events[marketId].creator == address(0), "Market already exists");
        
        // Collect create bond
        uint256 bondAmount = feeConfig.createBond();
        usdcToken.safeTransferFrom(msg.sender, address(this), bondAmount);
        bondEscrow[marketId] = bondAmount;
        
        // Deploy AMM
        address ammAddress = address(new MarketAMM(
            marketId,
            msg.sender,
            address(usdcToken),
            address(feeConfig),
            params.initialLiquidity
        ));
        
        // If initial liquidity provided, transfer it to AMM
        if (params.initialLiquidity > 0) {
            usdcToken.safeTransferFrom(msg.sender, ammAddress, params.initialLiquidity);
        }
        
        // Store event info
        events[marketId] = EventInfo({
            marketId: marketId,
            creator: msg.sender,
            ammAddress: ammAddress,
            createdAt: block.timestamp,
            resolveAt: params.resolveAt,
            category: params.category,
            title: params.title,
            description: params.description,
            primarySource: params.primarySource,
            ruleBytes: params.ruleBytes,
            createBondAmount: bondAmount,
            bondRefunded: false,
            finalized: false
        });
        
        creatorEvents[msg.sender].push(marketId);
        allMarketIds.push(marketId);
        
        emit EventCreated(marketId, msg.sender, ammAddress, params.category, params.title, params.resolveAt);
        
        return marketId;
    }
    
    /**
     * @notice Finalize event creation (for any additional setup)
     */
    function finalizeCreation(bytes32 marketId) external {
        EventInfo storage eventInfo = events[marketId];
        require(eventInfo.creator == msg.sender, "Not creator");
        require(!eventInfo.finalized, "Already finalized");
        
        eventInfo.finalized = true;
        
        emit EventFinalized(marketId, msg.sender);
    }
    
    /**
     * @notice Refund create bond (partial after window, full remainder at resolution)
     */
    function refundCreateBond(bytes32 marketId) external {
        EventInfo storage eventInfo = events[marketId];
        require(eventInfo.creator == msg.sender, "Not creator");
        require(!eventInfo.bondRefunded, "Already refunded");
        
        uint256 bondAmount = bondEscrow[marketId];
        require(bondAmount > 0, "No bond to refund");
        
        uint256 refundAmount;
        uint256 currentTime = block.timestamp;
        uint256 refundWindow = eventInfo.createdAt + feeConfig.createBondRefundWindow();
        uint256 resolveTime = eventInfo.resolveAt;
        
        if (currentTime >= min(refundWindow, resolveTime)) {
            // After refund window or at resolve time
            uint256 refundPercent = feeConfig.createBondRefundPercent();
            refundAmount = (bondAmount * refundPercent) / 10000;
            
            bondEscrow[marketId] = bondAmount - refundAmount;
            eventInfo.bondRefunded = true;
            
            usdcToken.safeTransfer(msg.sender, refundAmount);
            
            emit BondRefunded(marketId, msg.sender, refundAmount);
        } else {
            revert("Refund not available yet");
        }
    }
    
    /**
     * @notice Get all market IDs
     */
    function getAllMarketIds() external view returns (bytes32[] memory) {
        return allMarketIds;
    }
    
    /**
     * @notice Get markets created by a specific creator
     */
    function getCreatorEvents(address creator) external view returns (bytes32[] memory) {
        return creatorEvents[creator];
    }
    
    /**
     * @notice Get event info by market ID
     */
    function getEventInfo(bytes32 marketId) external view returns (EventInfo memory) {
        return events[marketId];
    }
    
    /**
     * @notice Check if a market already exists for given parameters
     */
    function marketExists(
        string calldata category,
        string calldata title,
        uint256 resolveAt,
        string calldata primarySource,
        bytes calldata ruleBytes
    ) external view returns (bool, bytes32) {
        bytes32 marketId = _generateMarketId(category, title, resolveAt, primarySource, ruleBytes);
        return (events[marketId].creator != address(0), marketId);
    }
    
    /**
     * @notice Generate deterministic market ID for duplicate detection
     */
    function _generateMarketId(
        string memory category,
        string memory title,
        uint256 resolveAt,
        string memory primarySource,
        bytes memory ruleBytes
    ) internal pure returns (bytes32) {
        // Normalize title (lowercase, trim spaces)
        string memory normalizedTitle = _normalizeString(title);
        
        return keccak256(abi.encodePacked(
            category,
            normalizedTitle,
            resolveAt,
            primarySource,
            ruleBytes
        ));
    }
    
    /**
     * @notice Normalize string for consistent comparison
     */
    function _normalizeString(string memory str) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(strBytes.length);
        
        for (uint256 i = 0; i < strBytes.length; i++) {
            bytes1 char = strBytes[i];
            // Convert to lowercase if uppercase letter
            if (char >= 0x41 && char <= 0x5A) {
                result[i] = bytes1(uint8(char) + 32);
            } else {
                result[i] = char;
            }
        }
        
        return string(result);
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
