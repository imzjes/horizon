// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FeeConfig
 * @notice Centralized configuration for fees, bonds, and time windows
 */
contract FeeConfig is Ownable {
    // Fee rates in basis points (10000 = 100%)
    uint256 public tradeFeeRate = 30; // 0.3%
    uint256 public settlementFeeRate = 100; // 1.0%
    
    // Fee distribution in basis points (must sum to 10000)
    uint256 public tradeFeeLP = 6500; // 65%
    uint256 public tradeFeeCreator = 2000; // 20%
    uint256 public tradeFeeProtocol = 1500; // 15%
    
    uint256 public settlementFeeProtocol = 8000; // 80%
    uint256 public settlementFeeCreator = 1000; // 10%
    uint256 public settlementFeeDispute = 1000; // 10%
    
    // Bond amounts in USDC (6 decimals)
    uint256 public createBond = 10e6; // 10 USDC
    uint256 public reportBond = 25e6; // 25 USDC
    uint256 public createBondRefundPercent = 8500; // 85%
    
    // Time windows in seconds
    uint256 public createBondRefundWindow = 24 hours;
    uint256 public disputeWindow = 24 hours;
    
    // Dispute bond calculation
    uint256 public minDisputeBond = 25e6; // 25 USDC
    uint256 public disputeBondPercent = 50; // 0.5% of open interest
    
    // Protocol addresses
    address public treasuryAddress;
    address public arbiterAddress;
    
    event FeeConfigUpdated(string parameter, uint256 oldValue, uint256 newValue);
    event AddressUpdated(string role, address oldAddress, address newAddress);
    
    constructor(address _treasuryAddress, address _arbiterAddress) Ownable(msg.sender) {
        treasuryAddress = _treasuryAddress;
        arbiterAddress = _arbiterAddress;
    }
    
    function setTradeFeeRate(uint256 _rate) external onlyOwner {
        require(_rate <= 1000, "Fee too high"); // Max 10%
        emit FeeConfigUpdated("tradeFeeRate", tradeFeeRate, _rate);
        tradeFeeRate = _rate;
    }
    
    function setSettlementFeeRate(uint256 _rate) external onlyOwner {
        require(_rate <= 1000, "Fee too high"); // Max 10%
        emit FeeConfigUpdated("settlementFeeRate", settlementFeeRate, _rate);
        settlementFeeRate = _rate;
    }
    
    function setTradeFeeDistribution(
        uint256 _lpPercent,
        uint256 _creatorPercent,
        uint256 _protocolPercent
    ) external onlyOwner {
        require(_lpPercent + _creatorPercent + _protocolPercent == 10000, "Must sum to 100%");
        tradeFeeLP = _lpPercent;
        tradeFeeCreator = _creatorPercent;
        tradeFeeProtocol = _protocolPercent;
    }
    
    function setSettlementFeeDistribution(
        uint256 _protocolPercent,
        uint256 _creatorPercent,
        uint256 _disputePercent
    ) external onlyOwner {
        require(_protocolPercent + _creatorPercent + _disputePercent == 10000, "Must sum to 100%");
        settlementFeeProtocol = _protocolPercent;
        settlementFeeCreator = _creatorPercent;
        settlementFeeDispute = _disputePercent;
    }
    
    function setCreateBond(uint256 _amount) external onlyOwner {
        emit FeeConfigUpdated("createBond", createBond, _amount);
        createBond = _amount;
    }
    
    function setReportBond(uint256 _amount) external onlyOwner {
        emit FeeConfigUpdated("reportBond", reportBond, _amount);
        reportBond = _amount;
    }
    
    function setCreateBondRefundPercent(uint256 _percent) external onlyOwner {
        require(_percent <= 10000, "Cannot exceed 100%");
        emit FeeConfigUpdated("createBondRefundPercent", createBondRefundPercent, _percent);
        createBondRefundPercent = _percent;
    }
    
    function setCreateBondRefundWindow(uint256 _window) external onlyOwner {
        emit FeeConfigUpdated("createBondRefundWindow", createBondRefundWindow, _window);
        createBondRefundWindow = _window;
    }
    
    function setDisputeWindow(uint256 _window) external onlyOwner {
        emit FeeConfigUpdated("disputeWindow", disputeWindow, _window);
        disputeWindow = _window;
    }
    
    function setDisputeBondConfig(uint256 _minBond, uint256 _percent) external onlyOwner {
        minDisputeBond = _minBond;
        disputeBondPercent = _percent;
    }
    
    function setTreasuryAddress(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        emit AddressUpdated("treasury", treasuryAddress, _treasury);
        treasuryAddress = _treasury;
    }
    
    function setArbiterAddress(address _arbiter) external onlyOwner {
        require(_arbiter != address(0), "Invalid address");
        emit AddressUpdated("arbiter", arbiterAddress, _arbiter);
        arbiterAddress = _arbiter;
    }
    
    function calculateDisputeBond(uint256 openInterestUSD) external view returns (uint256) {
        uint256 percentBond = (openInterestUSD * disputeBondPercent) / 10000;
        return percentBond > minDisputeBond ? percentBond : minDisputeBond;
    }
}
