import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { ResolutionManagerABI, ResolutionState } from '@sonic-prediction-market/shared';
import { getContractAddresses } from '../config';
import { uploadToIPFS, createEvidenceData } from '../ipfs';

export function useResolution(marketId: string) {
  const { address } = useAccount();
  const contracts = getContractAddresses();

  // Get resolution state
  const { data: resolutionState, refetch: refetchState } = useReadContract({
    address: contracts.resolutionManager,
    abi: ResolutionManagerABI,
    functionName: 'getResolutionState',
    args: [marketId as `0x${string}`],
  });

  // Get full resolution info
  const { data: resolutionInfo, refetch: refetchInfo } = useReadContract({
    address: contracts.resolutionManager,
    abi: ResolutionManagerABI,
    functionName: 'getResolution',
    args: [marketId as `0x${string}`],
  });

  // Write functions
  const { writeContract: submitReport, isPending: reportPending } = useWriteContract();
  const { writeContract: submitDispute, isPending: disputePending } = useWriteContract();
  const { writeContract: arbiterResolveContract, isPending: arbiterResolvePending } = useWriteContract();
  const { writeContract: invalidateContract, isPending: invalidatePending } = useWriteContract();

  // Report with evidence
  const report = async (
    outcome: boolean,
    sourceUrl: string,
    rawValue: string,
    notes: string
  ) => {
    try {
      const evidenceData = createEvidenceData(
        marketId,
        sourceUrl,
        rawValue,
        outcome ? 'YES' : 'NO',
        notes
      );
      
      const evidenceURI = await uploadToIPFS(evidenceData);
      
      submitReport({
        address: contracts.resolutionManager,
        abi: ResolutionManagerABI,
        functionName: 'report',
        args: [marketId as `0x${string}`, outcome, evidenceURI],
      });
    } catch (error) {
      console.error('Report submission failed:', error);
      throw error;
    }
  };

  // Dispute a report
  const dispute = async (reasonUrl: string, counterEvidence: string, notes: string) => {
    try {
      const evidenceData = createEvidenceData(
        marketId,
        reasonUrl,
        counterEvidence,
        'VALUE', // Dispute evidence
        notes
      );
      
      const reasonURI = await uploadToIPFS(evidenceData);
      
      submitDispute({
        address: contracts.resolutionManager,
        abi: ResolutionManagerABI,
        functionName: 'dispute',
        args: [marketId as `0x${string}`, reasonURI],
      });
    } catch (error) {
      console.error('Dispute submission failed:', error);
      throw error;
    }
  };

  // Arbiter resolve (admin only)
  const arbiterResolve = (finalOutcome: boolean) => {
    arbiterResolveContract({
      address: contracts.resolutionManager,
      abi: ResolutionManagerABI,
      functionName: 'arbiterResolve',
      args: [marketId as `0x${string}`, finalOutcome],
    });
  };

  // Invalidate market (admin only)
  const invalidate = () => {
    invalidateContract({
      address: contracts.resolutionManager,
      abi: ResolutionManagerABI,
      functionName: 'invalidate',
      args: [marketId as `0x${string}`],
    });
  };

  // Helper functions
  const canReport = () => {
    return resolutionState === ResolutionState.REPORTABLE;
  };

  const canDispute = () => {
    return resolutionState === ResolutionState.REPORTED;
  };

  const isResolved = () => {
    return resolutionState === ResolutionState.RESOLVED;
  };

  const getStateLabel = () => {
    switch (resolutionState) {
      case ResolutionState.PENDING:
        return 'Pending';
      case ResolutionState.REPORTABLE:
        return 'Reportable';
      case ResolutionState.REPORTED:
        return 'Reported';
      case ResolutionState.DISPUTED:
        return 'Disputed';
      case ResolutionState.RESOLVED:
        return 'Resolved';
      default:
        return 'Unknown';
    }
  };

  return {
    // Data
    resolutionState: resolutionState ?? ResolutionState.PENDING,
    resolutionInfo,
    stateLabel: getStateLabel(),
    
    // Actions
    report,
    dispute,
    arbiterResolve,
    invalidate,
    
    // State checks
    canReport: canReport(),
    canDispute: canDispute(),
    isResolved: isResolved(),
    
    // Loading states
    isPending: reportPending || disputePending || arbiterResolvePending || invalidatePending,
    
    // Refresh
    refetch: () => {
      refetchState();
      refetchInfo();
    },
  };
}
