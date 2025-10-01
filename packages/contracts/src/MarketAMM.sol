// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FeeConfig.sol";

/**
 * @title MarketAMM
 * @notice Binary CPMM (x*y=k) for YES/NO prediction markets
 */
contract MarketAMM is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Market state
    bytes32 public immutable marketId;
    address public immutable creator;
    IERC20 public immutable usdcToken;
    FeeConfig public immutable feeConfig;
    
    // AMM reserves (in USDC)
    uint256 public yesReserve;
    uint256 public noReserve;
    
    // LP tokens (ERC20-like)
    uint256 public totalLPSupply;
    mapping(address => uint256) public lpBalance;
    
    // Fee tracking
    uint256 public protocolFees;
    uint256 public creatorFees;
    mapping(address => uint256) public lpFees; // Accumulated per LP
    
    // Volume and OI tracking
    uint256 public volumeUsd;
    uint256 public openInterestUsd;
    
    // Settlement
    bool public isSettled;
    bool public finalOutcome; // true = YES, false = NO
    bool public isInvalid;
    
    // LP fee debt tracking for pro-rata distribution
    uint256 public totalLPFeeDebt;
    mapping(address => uint256) public lpFeeDebt;
    
    event Trade(address indexed trader, bool isYes, uint256 amountIn, uint256 tokensOut, uint256 fee);
    event LiquidityAdded(address indexed provider, uint256 usdcAmount, uint256 lpTokens);
    event LiquidityRemoved(address indexed provider, uint256 lpTokens, uint256 usdcAmount);
    event FeesDistributed(uint256 lpFees, uint256 creatorFees, uint256 protocolFees);
    event Settled(bool finalOutcome, bool isInvalid);
    event Redeemed(address indexed user, uint256 amount);
    
    modifier onlyUnsettled() {
        require(!isSettled, "Market settled");
        _;
    }
    
    modifier onlySettled() {
        require(isSettled, "Market not settled");
        _;
    }
    
    constructor(
        bytes32 _marketId,
        address _creator,
        address _usdcToken,
        address _feeConfig,
        uint256 _initialLiquidity
    ) {
        marketId = _marketId;
        creator = _creator;
        usdcToken = IERC20(_usdcToken);
        feeConfig = FeeConfig(_feeConfig);
        
        // Initialize with 50/50 split
        if (_initialLiquidity > 0) {
            uint256 halfLiquidity = _initialLiquidity / 2;
            yesReserve = halfLiquidity;
            noReserve = halfLiquidity;
            totalLPSupply = _initialLiquidity;
            lpBalance[_creator] = _initialLiquidity;
            
            emit LiquidityAdded(_creator, _initialLiquidity, _initialLiquidity);
        }
    }
    
    /**
     * @notice Buy YES tokens
     */
    function buyYes(uint256 amountUSDC) external nonReentrant onlyUnsettled {
        _executeTrade(true, amountUSDC);
    }
    
    /**
     * @notice Buy NO tokens
     */
    function buyNo(uint256 amountUSDC) external nonReentrant onlyUnsettled {
        _executeTrade(false, amountUSDC);
    }
    
    /**
     * @notice Add liquidity to the pool
     */
    function provideLiquidity(uint256 amountUSDC) external nonReentrant onlyUnsettled {
        require(amountUSDC > 0, "Invalid amount");
        
        uint256 lpTokens;
        if (totalLPSupply == 0) {
            // First liquidity
            lpTokens = amountUSDC;
            uint256 halfAmount = amountUSDC / 2;
            yesReserve = halfAmount;
            noReserve = halfAmount;
        } else {
            // Proportional liquidity
            uint256 totalReserve = yesReserve + noReserve;
            lpTokens = (amountUSDC * totalLPSupply) / totalReserve;
            
            uint256 yesAdd = (amountUSDC * yesReserve) / totalReserve;
            uint256 noAdd = amountUSDC - yesAdd;
            
            yesReserve += yesAdd;
            noReserve += noAdd;
        }
        
        // Update LP fee debt to maintain pro-rata distribution
        if (totalLPSupply > 0) {
            lpFeeDebt[msg.sender] += (totalLPFeeDebt * lpTokens) / totalLPSupply;
        }
        
        totalLPSupply += lpTokens;
        lpBalance[msg.sender] += lpTokens;
        
        usdcToken.safeTransferFrom(msg.sender, address(this), amountUSDC);
        
        emit LiquidityAdded(msg.sender, amountUSDC, lpTokens);
    }
    
    /**
     * @notice Remove liquidity from the pool
     */
    function removeLiquidity(uint256 lpTokens) external nonReentrant {
        require(lpTokens > 0 && lpTokens <= lpBalance[msg.sender], "Invalid amount");
        
        uint256 totalReserve = yesReserve + noReserve;
        uint256 usdcAmount = (lpTokens * totalReserve) / totalLPSupply;
        
        // Calculate and pay accumulated LP fees
        uint256 accruedFees = _getAccruedLPFees(msg.sender, lpTokens);
        if (accruedFees > 0) {
            lpFees[msg.sender] += accruedFees;
            lpFeeDebt[msg.sender] += accruedFees;
        }
        
        // Update reserves proportionally
        uint256 yesRemove = (lpTokens * yesReserve) / totalLPSupply;
        uint256 noRemove = (lpTokens * noReserve) / totalLPSupply;
        
        yesReserve -= yesRemove;
        noReserve -= noRemove;
        totalLPSupply -= lpTokens;
        lpBalance[msg.sender] -= lpTokens;
        
        usdcToken.safeTransfer(msg.sender, usdcAmount);
        
        emit LiquidityRemoved(msg.sender, lpTokens, usdcAmount);
    }
    
    /**
     * @notice Claim accumulated LP fees
     */
    function claimLPFees() external nonReentrant {
        uint256 fees = lpFees[msg.sender] + _getAccruedLPFees(msg.sender, lpBalance[msg.sender]);
        require(fees > 0, "No fees to claim");
        
        lpFees[msg.sender] = 0;
        lpFeeDebt[msg.sender] = (totalLPFeeDebt * lpBalance[msg.sender]) / totalLPSupply;
        
        usdcToken.safeTransfer(msg.sender, fees);
    }
    
    /**
     * @notice Settle the market (called by ResolutionManager)
     */
    function settle(bool _finalOutcome, bool _isInvalid) external {
        require(msg.sender == address(feeConfig) || msg.sender == owner(), "Unauthorized");
        require(!isSettled, "Already settled");
        
        isSettled = true;
        finalOutcome = _finalOutcome;
        isInvalid = _isInvalid;
        
        emit Settled(_finalOutcome, _isInvalid);
    }
    
    /**
     * @notice Redeem winning tokens or get refund if invalid
     */
    function redeem() external nonReentrant onlySettled {
        // Implementation depends on how positions are tracked
        // For MVP, we'll implement a simple version
        revert("Redeem not implemented in MVP");
    }
    
    /**
     * @notice Get current YES probability in basis points
     */
    function yesProbability() external view returns (uint256) {
        if (yesReserve == 0 || noReserve == 0) return 5000; // 50%
        
        uint256 totalReserve = yesReserve + noReserve;
        return (noReserve * 10000) / totalReserve;
    }
    
    /**
     * @notice Get total liquidity in USD
     */
    function liquidityUsd() external view returns (uint256) {
        return yesReserve + noReserve;
    }
    
    /**
     * @notice Get quote for buying YES/NO tokens
     */
    function getQuote(bool isYes, uint256 amountIn) external view returns (uint256 tokensOut, uint256 fee) {
        uint256 feeAmount = (amountIn * feeConfig.tradeFeeRate()) / 10000;
        uint256 amountAfterFee = amountIn - feeAmount;
        
        if (isYes) {
            tokensOut = _getAmountOut(amountAfterFee, noReserve, yesReserve);
        } else {
            tokensOut = _getAmountOut(amountAfterFee, yesReserve, noReserve);
        }
        
        fee = feeAmount;
    }
    
    function _executeTrade(bool isYes, uint256 amountIn) internal {
        require(amountIn > 0, "Invalid amount");
        
        uint256 feeAmount = (amountIn * feeConfig.tradeFeeRate()) / 10000;
        uint256 amountAfterFee = amountIn - feeAmount;
        
        uint256 tokensOut;
        if (isYes) {
            tokensOut = _getAmountOut(amountAfterFee, noReserve, yesReserve);
            yesReserve += amountAfterFee;
            noReserve -= tokensOut;
        } else {
            tokensOut = _getAmountOut(amountAfterFee, yesReserve, noReserve);
            noReserve += amountAfterFee;
            yesReserve -= tokensOut;
        }
        
        // Distribute fees
        _distributeTradeFees(feeAmount);
        
        // Update metrics
        volumeUsd += amountIn;
        openInterestUsd = yesReserve + noReserve;
        
        usdcToken.safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Note: In MVP, we're not actually minting YES/NO tokens to users
        // Instead, positions would be tracked separately
        
        emit Trade(msg.sender, isYes, amountIn, tokensOut, feeAmount);
    }
    
    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        require(amountIn > 0, "Insufficient input");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        return numerator / denominator;
    }
    
    function _distributeTradeFees(uint256 feeAmount) internal {
        uint256 lpFee = (feeAmount * feeConfig.tradeFeeLP()) / 10000;
        uint256 creatorFee = (feeAmount * feeConfig.tradeFeeCreator()) / 10000;
        uint256 protocolFee = feeAmount - lpFee - creatorFee;
        
        // Add to LP fee pool (distributed pro-rata)
        totalLPFeeDebt += lpFee;
        
        creatorFees += creatorFee;
        protocolFees += protocolFee;
        
        emit FeesDistributed(lpFee, creatorFee, protocolFee);
    }
    
    function _getAccruedLPFees(address user, uint256 lpTokens) internal view returns (uint256) {
        if (totalLPSupply == 0) return 0;
        
        uint256 totalAccrued = (totalLPFeeDebt * lpTokens) / totalLPSupply;
        uint256 alreadyPaid = lpFeeDebt[user];
        
        return totalAccrued > alreadyPaid ? totalAccrued - alreadyPaid : 0;
    }
    
    // Placeholder for owner() - in practice this would come from a proper access control
    function owner() internal view returns (address) {
        return creator; // Simplified for MVP
    }
}
