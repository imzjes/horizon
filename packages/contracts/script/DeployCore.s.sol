// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FeeConfig.sol";
import "../src/EventFactory.sol";
import "../src/ResolutionManager.sol";

contract DeployCore is Script {
    // Non-secret addresses
    address constant TREASURY_ADDRESS = 0xfeE3Bb04a2c41591789dDeE2E5a104666062aB78;
    address constant ARBITER_ADDRESS = 0xfeE3Bb04a2c41591789dDeE2E5a104666062aB78;
    address constant DEMO_USDC_ADDRESS = 0xD04431DcFe94E99e7399668B60BBe0a350D475E4;
    address constant REAL_USDC_ADDRESS = 0x29219dd400f2Bf60E5a23d13Be72B486D4038894;
    
    function run() external {
        // Read environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        bool useDemoToken = vm.envOr("USE_DEMO_TOKEN", true);
        
        address usdcAddress = useDemoToken ? DEMO_USDC_ADDRESS : REAL_USDC_ADDRESS;
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy FeeConfig
        FeeConfig feeConfig = new FeeConfig(TREASURY_ADDRESS, ARBITER_ADDRESS);
        console.log("FeeConfig deployed at:", address(feeConfig));
        
        // Deploy EventFactory
        EventFactory eventFactory = new EventFactory(address(feeConfig), usdcAddress);
        console.log("EventFactory deployed at:", address(eventFactory));
        
        // Deploy ResolutionManager
        ResolutionManager resolutionManager = new ResolutionManager(
            address(feeConfig),
            address(eventFactory),
            usdcAddress
        );
        console.log("ResolutionManager deployed at:", address(resolutionManager));
        
        vm.stopBroadcast();
        
        // Print deployment info
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Network: Sonic Mainnet (Chain ID: 146)");
        console.log("USDC Token:", usdcAddress);
        console.log("Treasury Address:", TREASURY_ADDRESS);
        console.log("Arbiter Address:", ARBITER_ADDRESS);
        console.log("");
        console.log("Deployed Contracts:");
        console.log("- FeeConfig:", address(feeConfig));
        console.log("- EventFactory:", address(eventFactory));
        console.log("- ResolutionManager:", address(resolutionManager));
        
        // Generate addresses.ts content
        _generateAddressesFile(address(feeConfig), address(eventFactory), address(resolutionManager), usdcAddress);
        
        // Generate .env.local content
        _generateEnvLocal(address(feeConfig), address(eventFactory), address(resolutionManager), usdcAddress);
    }
    
    function _generateAddressesFile(
        address feeConfig,
        address eventFactory,
        address resolutionManager,
        address usdcToken
    ) internal view {
        console.log("");
        console.log("=== Copy this to packages/shared/src/addresses.ts ===");
        console.log("export const SONIC_MAINNET_ADDRESSES = {");
        console.log("  FeeConfig: '", vm.toString(feeConfig), "',");
        console.log("  EventFactory: '", vm.toString(eventFactory), "',");
        console.log("  ResolutionManager: '", vm.toString(resolutionManager), "',");
        console.log("  USDCToken: '", vm.toString(usdcToken), "',");
        console.log("  TreasuryAddress: '", vm.toString(TREASURY_ADDRESS), "',");
        console.log("  ArbiterAddress: '", vm.toString(ARBITER_ADDRESS), "',");
        console.log("} as const;");
        console.log("");
        console.log("export const CHAIN_ID = 146;");
        console.log("export const RPC_URL = 'https://rpc.soniclabs.com';");
    }
    
    function _generateEnvLocal(
        address feeConfig,
        address eventFactory,
        address resolutionManager,
        address usdcToken
    ) internal view {
        console.log("");
        console.log("=== Copy this to apps/web/.env.local ===");
        console.log("NEXT_PUBLIC_CHAIN_ID=146");
        console.log("NEXT_PUBLIC_RPC_URL=https://rpc.soniclabs.com");
        console.log("NEXT_PUBLIC_FEE_CONFIG_ADDRESS=", vm.toString(feeConfig));
        console.log("NEXT_PUBLIC_EVENT_FACTORY_ADDRESS=", vm.toString(eventFactory));
        console.log("NEXT_PUBLIC_RESOLUTION_MANAGER_ADDRESS=", vm.toString(resolutionManager));
        console.log("NEXT_PUBLIC_USDC_TOKEN_ADDRESS=", vm.toString(usdcToken));
        console.log("NEXT_PUBLIC_TREASURY_ADDRESS=", vm.toString(TREASURY_ADDRESS));
        console.log("NEXT_PUBLIC_ARBITER_ADDRESS=", vm.toString(ARBITER_ADDRESS));
        console.log("# Add your Web3.Storage token:");
        console.log("NEXT_PUBLIC_WEB3_STORAGE_TOKEN=your_token_here");
        console.log("# Optional: Enable dev mode for admin panel");
        console.log("NEXT_PUBLIC_DEV=1");
    }
}
