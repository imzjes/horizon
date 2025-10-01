// Auto-generated ABIs from compiled contracts

export const ERC20ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "account", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "spender", "type": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  }
] as const;

export const FeeConfigABI = [
  {
    "type": "constructor",
    "inputs": [
      {"name": "_treasuryAddress", "type": "address", "internalType": "address"},
      {"name": "_arbiterAddress", "type": "address", "internalType": "address"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "settlementFeeRate",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tradeFeeLP",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tradeFeeCreator",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tradeFeeProtocol",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createBond",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createBondRefundPercent",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createBondRefundWindow",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tradeFeeRate",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "treasuryAddress",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "arbiterAddress",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  }
] as const;

export const EventFactoryABI = [
  {
    "type": "function",
    "name": "createEvent",
    "inputs": [
      {"name": "category", "type": "string"},
      {"name": "title", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "resolveAt", "type": "uint256"},
      {"name": "primarySource", "type": "string"},
      {"name": "ruleBytes", "type": "bytes"},
      {"name": "initialLiquidity", "type": "uint256"}
    ],
    "outputs": [{"name": "marketId", "type": "bytes32"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getEvent",
    "inputs": [{"name": "marketId", "type": "bytes32"}],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {"name": "creator", "type": "address"},
          {"name": "ammAddress", "type": "address"},
          {"name": "createdAt", "type": "uint256"},
          {"name": "resolveAt", "type": "uint256"},
          {"name": "category", "type": "string"},
          {"name": "title", "type": "string"},
          {"name": "description", "type": "string"},
          {"name": "primarySource", "type": "string"},
          {"name": "ruleBytes", "type": "bytes"},
          {"name": "createBondAmount", "type": "uint256"},
          {"name": "bondRefunded", "type": "bool"},
          {"name": "finalized", "type": "bool"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCreatorEvents",
    "inputs": [{"name": "creator", "type": "address"}],
    "outputs": [{"name": "", "type": "bytes32[]"}],
    "stateMutability": "view"
  }
] as const;

export const MarketAMMABI = [
  {
    "type": "function",
    "name": "buyYes",
    "inputs": [
      {"name": "amountIn", "type": "uint256"},
      {"name": "minTokensOut", "type": "uint256"}
    ],
    "outputs": [{"name": "tokensOut", "type": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "buyNo",
    "inputs": [
      {"name": "amountIn", "type": "uint256"},
      {"name": "minTokensOut", "type": "uint256"}
    ],
    "outputs": [{"name": "tokensOut", "type": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "provideLiquidity",
    "inputs": [{"name": "amountIn", "type": "uint256"}],
    "outputs": [{"name": "lpTokens", "type": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getMarketData",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {"name": "yesReserve", "type": "uint256"},
          {"name": "noReserve", "type": "uint256"},
          {"name": "liquidityUsd", "type": "uint256"},
          {"name": "volumeUsd", "type": "uint256"},
          {"name": "totalLpSupply", "type": "uint256"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserPosition",
    "inputs": [{"name": "user", "type": "address"}],
    "outputs": [
      {"name": "yesTokens", "type": "uint256"},
      {"name": "noTokens", "type": "uint256"},
      {"name": "lpTokens", "type": "uint256"}
    ],
    "stateMutability": "view"
  }
] as const;

export const ResolutionManagerABI = [
  {
    "type": "function",
    "name": "report",
    "inputs": [
      {"name": "marketId", "type": "bytes32"},
      {"name": "outcome", "type": "bool"},
      {"name": "evidenceURI", "type": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "dispute",
    "inputs": [
      {"name": "marketId", "type": "bytes32"},
      {"name": "reasonURI", "type": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "arbiterResolve",
    "inputs": [
      {"name": "marketId", "type": "bytes32"},
      {"name": "finalOutcome", "type": "bool"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "invalidate",
    "inputs": [{"name": "marketId", "type": "bytes32"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getResolutionState",
    "inputs": [{"name": "marketId", "type": "bytes32"}],
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getResolution",
    "inputs": [{"name": "marketId", "type": "bytes32"}],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {"name": "state", "type": "uint8"},
          {"name": "reporter", "type": "address"},
          {"name": "reportedOutcome", "type": "bool"},
          {"name": "evidenceURI", "type": "string"},
          {"name": "disputer", "type": "address"},
          {"name": "disputeReason", "type": "string"},
          {"name": "finalOutcome", "type": "bool"},
          {"name": "isInvalid", "type": "bool"}
        ]
      }
    ],
    "stateMutability": "view"
  }
] as const;