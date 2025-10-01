// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FeeConfig.sol";

/**
 * @title TernaryMarketAMM
 * @notice Ternary CPMM for HOME/DRAW/AWAY prediction markets (sports with draws)
 * @dev Uses a 3-asset AMM model where x*y*z = k
 */
contract TernaryMarketAMM is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    enum Outcome {
        HOME,    // 0
        DRAW,    // 1
        AWAY     // 2
    }
    
    // Market state
    bytes32 public immutable marketId;
    address public immutable creator;
    IERC20 public immutable usdcToken;
    FeeConfig public immutable feeConfig;
    
    // AMM reserves (in USDC) for each outcome
    uint256 public homeReserve;
    uint256 public drawReserve;
    uint256 public awayReserve;
    
    // LP tokens (ERC20-like)
    uint256 public totalLPSupply;
    mapping(address => uint256) public lpBalance;
    
    // Fee tracking
    uint256 public protocolFees;
    uint256 public creatorFees;
    mapping(address => uint256) public lpFees;
    
    // Volume and OI tracking
    uint256 public volumeUsd;
    uint256 public openInterestUsd;
    
    // Settlement
    bool public isSettled;
    Outcome public finalOutcome;
    bool public isInvalid;
    
    // LP fee debt tracking
    uint256 public totalLPFeeDebt;
    mapping(address => uint256) public lpFeeDebt;
    
    event Trade(address indexed trader, Outcome outcome, uint256 amountIn, uint256 tokensOut, uint256 fee);
    event LiquidityAdded(address indexed provider, uint256 usdcAmount, uint256 lpTokens);
    event LiquidityRemoved(address indexed provider, uint256 lpTokens, uint256 usdcAmount);
    event FeesDistributed(uint256 lpFees, uint256 creatorFees, uint256 protocolFees);
    event Settled(Outcome finalOutcome, bool isInvalid);
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
        
        // Initialize with equal 33.33% split for each outcome
        if (_initialLiquidity > 0) {
            uint256 thirdLiquidity = _initialLiquidity / 3;
            homeReserve = thirdLiquidity;
            drawReserve = thirdLiquidity;
            awayReserve = _initialLiquidity - (thirdLiquidity * 2); // Handle rounding
            
            totalLPSupply = _initialLiquidity;
            lpBalance[_creator] = _initialLiquidity;
            
            emit LiquidityAdded(_creator, _initialLiquidity, _initialLiquidity);
        }
    }
    
    /**
     * @notice Buy HOME outcome tokens
     */
    function buyHome(uint256 amountUSDC) external nonReentrant onlyUnsettled {
        _executeTrade(Outcome.HOME, amountUSDC);
    }
    
    /**
     * @notice Buy DRAW outcome tokens
     */
    function buyDraw(uint256 amountUSDC) external nonReentrant onlyUnsettled {
        _executeTrade(Outcome.DRAW, amountUSDC);
    }
    
    /**
     * @notice Buy AWAY outcome tokens
     */
    function buyAway(uint256 amountUSDC) external nonReentrant onlyUnsettled {
        _executeTrade(Outcome.AWAY, amountUSDC);
    }
    
    /**
     * @notice Add liquidity to the pool
     */
    function provideLiquidity(uint256 amountUSDC) external nonReentrant onlyUnsettled {
        require(amountUSDC > 0, "Invalid amount");
        
        uint256 lpTokens;
        if (totalLPSupply == 0) {
            lpTokens = amountUSDC;
        } else {
            uint256 totalReserve = homeReserve + drawReserve + awayReserve;
            lpTokens = (amountUSDC * totalLPSupply) / totalReserve;
        }
        
        // Add liquidity proportionally to current reserves
        uint256 totalReserve = homeReserve + drawReserve + awayReserve;
        if (totalReserve > 0) {
            homeReserve += (amountUSDC * homeReserve) / totalReserve;
            drawReserve += (amountUSDC * drawReserve) / totalReserve;
            awayReserve += (amountUSDC * awayReserve) / totalReserve;
        } else {
            // Initial liquidity - equal split
            uint256 third = amountUSDC / 3;
            homeReserve = third;
            drawReserve = third;
            awayReserve = amountUSDC - (third * 2);
        }
        
        totalLPSupply += lpTokens;
        lpBalance[msg.sender] += lpTokens;
        
        usdcToken.safeTransferFrom(msg.sender, address(this), amountUSDC);
        
        emit LiquidityAdded(msg.sender, amountUSDC, lpTokens);
    }
    
    /**
     * @notice Remove liquidity from the pool
     */
    function removeLiquidity(uint256 lpTokens) external nonReentrant onlyUnsettled {
        require(lpTokens > 0, "Invalid amount");
        require(lpBalance[msg.sender] >= lpTokens, "Insufficient LP tokens");
        
        uint256 totalReserve = homeReserve + drawReserve + awayReserve;
        uint256 usdcAmount = (lpTokens * totalReserve) / totalLPSupply;
        
        // Remove liquidity proportionally
        homeReserve -= (lpTokens * homeReserve) / totalLPSupply;
        drawReserve -= (lpTokens * drawReserve) / totalLPSupply;
        awayReserve -= (lpTokens * awayReserve) / totalLPSupply;
        
        totalLPSupply -= lpTokens;
        lpBalance[msg.sender] -= lpTokens;
        
        usdcToken.safeTransfer(msg.sender, usdcAmount);
        
        emit LiquidityRemoved(msg.sender, lpTokens, usdcAmount);
    }
    
    /**
     * @notice Settle the market (only callable by ResolutionManager)
     */
    function settle(Outcome _finalOutcome, bool _isInvalid) external {
        require(msg.sender == address(feeConfig), "Only resolution manager"); // Temp, should be ResolutionManager
        require(!isSettled, "Already settled");
        
        isSettled = true;
        finalOutcome = _finalOutcome;
        isInvalid = _isInvalid;
        
        emit Settled(_finalOutcome, _isInvalid);
    }
    
    /**
     * @notice Get current probabilities for all outcomes in basis points
     */
    function getProbabilities() external view returns (uint256 homeProb, uint256 drawProb, uint256 awayProb) {
        uint256 totalReserve = homeReserve + drawReserve + awayReserve;
        if (totalReserve == 0) {
            return (3333, 3333, 3334); // Equal 33.33% split
        }
        
        // Probabilities are inverse of reserves (less reserve = higher probability)
        uint256 homeInverse = totalReserve - homeReserve;
        uint256 drawInverse = totalReserve - drawReserve;
        uint256 awayInverse = totalReserve - awayReserve;
        uint256 totalInverse = homeInverse + drawInverse + awayInverse;
        
        if (totalInverse == 0) {
            return (3333, 3333, 3334);
        }
        
        homeProb = (homeInverse * 10000) / totalInverse;
        drawProb = (drawInverse * 10000) / totalInverse;
        awayProb = (awayInverse * 10000) / totalInverse;
    }
    
    /**
     * @notice Get total liquidity in USD
     */
    function liquidityUsd() external view returns (uint256) {
        return homeReserve + drawReserve + awayReserve;
    }
    
    /**
     * @notice Get quote for buying outcome tokens
     */
    function getQuote(Outcome outcome, uint256 amountIn) external view returns (uint256 tokensOut, uint256 fee) {
        uint256 feeAmount = (amountIn * feeConfig.tradeFeeRate()) / 10000;
        uint256 amountAfterFee = amountIn - feeAmount;
        
        // Calculate tokens out using simplified ternary AMM formula
        if (outcome == Outcome.HOME) {
            tokensOut = _getAmountOut(amountAfterFee, drawReserve + awayReserve, homeReserve);
        } else if (outcome == Outcome.DRAW) {
            tokensOut = _getAmountOut(amountAfterFee, homeReserve + awayReserve, drawReserve);
        } else {
            tokensOut = _getAmountOut(amountAfterFee, homeReserve + drawReserve, awayReserve);
        }
        
        fee = feeAmount;
    }
    
    function _executeTrade(Outcome outcome, uint256 amountIn) internal {
        require(amountIn > 0, "Invalid amount");
        
        uint256 feeAmount = (amountIn * feeConfig.tradeFeeRate()) / 10000;
        uint256 amountAfterFee = amountIn - feeAmount;
        
        uint256 tokensOut;
        
        // Execute trade using simplified ternary AMM
        // When buying an outcome, we increase its reserve and decrease others proportionally
        if (outcome == Outcome.HOME) {
            tokensOut = _getAmountOut(amountAfterFee, drawReserve + awayReserve, homeReserve);
            homeReserve += amountAfterFee;
            // Distribute reduction across other outcomes
            uint256 reduction = tokensOut / 2;
            drawReserve -= reduction;
            awayReserve -= (tokensOut - reduction);
        } else if (outcome == Outcome.DRAW) {
            tokensOut = _getAmountOut(amountAfterFee, homeReserve + awayReserve, drawReserve);
            drawReserve += amountAfterFee;
            uint256 reduction = tokensOut / 2;
            homeReserve -= reduction;
            awayReserve -= (tokensOut - reduction);
        } else {
            tokensOut = _getAmountOut(amountAfterFee, homeReserve + drawReserve, awayReserve);
            awayReserve += amountAfterFee;
            uint256 reduction = tokensOut / 2;
            homeReserve -= reduction;
            drawReserve -= (tokensOut - reduction);
        }
        
        // Distribute fees
        _distributeTradeFees(feeAmount);
        
        // Update metrics
        volumeUsd += amountIn;
        openInterestUsd = homeReserve + drawReserve + awayReserve;
        
        usdcToken.safeTransferFrom(msg.sender, address(this), amountIn);
        
        emit Trade(msg.sender, outcome, amountIn, tokensOut, feeAmount);
    }
    
    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        require(amountIn > 0, "Insufficient input");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        return numerator / denominator;
    }
    
    function _distributeTradeFees(uint256 feeAmount) internal {
        uint256 protocolFee = (feeAmount * feeConfig.protocolFeeRate()) / 10000;
        uint256 creatorFee = (feeAmount * feeConfig.creatorFeeRate()) / 10000;
        uint256 lpFee = feeAmount - protocolFee - creatorFee;
        
        protocolFees += protocolFee;
        creatorFees += creatorFee;
        totalLPFeeDebt += lpFee;
    }
}
