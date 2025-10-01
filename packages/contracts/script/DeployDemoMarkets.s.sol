// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/EventFactory.sol";
import "../src/MarketAMM.sol";

contract DeployDemoMarkets is Script {
    // These should match the deployed addresses from DeployCore
    address eventFactoryAddress;
    address usdcTokenAddress;
    
    function run() external {
        // Read addresses from environment or use deployed addresses
        eventFactoryAddress = vm.envAddress("EVENT_FACTORY_ADDRESS");
        usdcTokenAddress = vm.envAddress("USDC_TOKEN_ADDRESS");
        
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        EventFactory eventFactory = EventFactory(eventFactoryAddress);
        IERC20 usdc = IERC20(usdcTokenAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Check USDC balance
        uint256 balance = usdc.balanceOf(vm.addr(deployerPrivateKey));
        console.log("Deployer USDC balance:", balance);
        require(balance >= 1000e6, "Insufficient USDC balance (need 1000+ USDC)");
        
        // Create demo market 1: NBA Finals outcome
        bytes32 market1Id = _createNBAMarket(eventFactory);
        
        // Create demo market 2: BTC price prediction  
        bytes32 market2Id = _createBTCMarket(eventFactory);
        
        // Seed liquidity and trades
        _seedMarket(market1Id, eventFactory);
        _seedMarket(market2Id, eventFactory);
        
        vm.stopBroadcast();
        
        console.log("=== DEMO MARKETS DEPLOYED ===");
        console.log("Market 1 (NBA Finals):", vm.toString(market1Id));
        console.log("Market 2 (BTC >= $70k):", vm.toString(market2Id));
    }
    
    function _createNBAMarket(EventFactory eventFactory) internal returns (bytes32) {
        // NBA Finals 2024 mock event (resolved in ~30 days for demo)
        uint256 resolveAt = block.timestamp + 30 days;
        
        EventFactory.EventParams memory params = EventFactory.EventParams({
            category: "Sports",
            title: "Will the Boston Celtics win the 2024 NBA Finals?",
            description: "Market resolves YES if Boston Celtics win the NBA Finals, NO otherwise. Based on official NBA results.",
            resolveAt: resolveAt,
            primarySource: "https://www.nba.com/finals",
            ruleBytes: abi.encode("NBA_FINALS_2024_CELTICS"),
            initialLiquidity: 500e6 // 500 USDC
        });
        
        // Approve USDC for create bond + liquidity
        IERC20(usdcTokenAddress).approve(address(eventFactory), 510e6);
        
        bytes32 marketId = eventFactory.createEvent(params);
        console.log("Created NBA market:", vm.toString(marketId));
        
        return marketId;
    }
    
    function _createBTCMarket(EventFactory eventFactory) internal returns (bytes32) {
        // BTC price prediction (resolved in ~7 days for demo)
        uint256 resolveAt = block.timestamp + 7 days;
        
        EventFactory.EventParams memory params = EventFactory.EventParams({
            category: "Crypto",
            title: "Will Bitcoin (BTC) trade at or above $70,000 by March 15, 2024?",
            description: "Market resolves YES if BTC trades at $70,000+ on any major exchange by the resolution date. Based on CoinGecko API data.",
            resolveAt: resolveAt,
            primarySource: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
            ruleBytes: abi.encode("BTC_70K_MARCH_2024"),
            initialLiquidity: 500e6 // 500 USDC
        });
        
        // Approve USDC for create bond + liquidity
        IERC20(usdcTokenAddress).approve(address(eventFactory), 510e6);
        
        bytes32 marketId = eventFactory.createEvent(params);
        console.log("Created BTC market:", vm.toString(marketId));
        
        return marketId;
    }
    
    function _seedMarket(bytes32 marketId, EventFactory eventFactory) internal {
        EventFactory.EventInfo memory eventInfo = eventFactory.getEventInfo(marketId);
        MarketAMM amm = MarketAMM(eventInfo.ammAddress);
        
        // Approve USDC for trades
        IERC20(usdcTokenAddress).approve(address(amm), 200e6);
        
        // Place some initial trades to create realistic odds
        // Trade 1: Buy YES for 50 USDC
        amm.buyYes(50e6);
        
        // Trade 2: Buy NO for 30 USDC
        amm.buyNo(30e6);
        
        // Trade 3: Buy YES for 40 USDC
        amm.buyYes(40e6);
        
        console.log("Seeded market with trades:", vm.toString(marketId));
        
        // Log final state
        uint256 probability = amm.yesProbability();
        uint256 liquidity = amm.liquidityUsd();
        uint256 volume = amm.volumeUsd();
        
        console.log("Final state - Probability:", probability);
        console.log("Liquidity:", liquidity);
        console.log("Volume:", volume);
    }
}
