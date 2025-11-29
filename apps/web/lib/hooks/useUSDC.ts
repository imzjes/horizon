import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { ERC20ABI } from '@sonic-prediction-market/shared';
import { getContractAddresses } from '../config';
import { parseUnits, maxUint256 } from 'viem';

export function useUSDCs() {
  const { address } = useAccount();
  const contracts = getContractAddresses();

  // Read user's USDCs balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: contracts.usdc,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Check allowance for various contracts
  const { data: allowanceEventFactory } = useReadContract({
    address: contracts.usdc,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: address ? [address, contracts.eventFactory] : undefined,
    query: { enabled: !!address },
  });

  // Approval functions
  const { writeContract: approve, isPending: approvePending } = useWriteContract();

  const approveEventFactory = (amount?: string) => {
    const approvalAmount = amount ? parseUnits(amount, 6) : maxUint256;
    approve({
      address: contracts.usdc,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [contracts.eventFactory, approvalAmount],
    });
  };

  const approveAMM = (ammAddress: `0x${string}`, amount?: string) => {
    const approvalAmount = amount ? parseUnits(amount, 6) : maxUint256;
    approve({
      address: contracts.usdc,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [ammAddress, approvalAmount],
    });
  };

  const hasAllowance = (spender: `0x${string}`, requiredAmount: bigint) => {
    if (spender === contracts.eventFactory) {
      return allowanceEventFactory ? allowanceEventFactory >= requiredAmount : false;
    }
    // For AMMs, we'd need to check individually
    return false;
  };

  return {
    balance: balance || BigInt('0'),
    allowanceEventFactory: allowanceEventFactory || BigInt('0'),
    approveEventFactory,
    approveAMM,
    hasAllowance,
    isApproving: approvePending,
    refetchBalance,
  };
}
