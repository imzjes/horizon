import { EvidenceData, validateEvidenceData, PINATA_API_URL } from '@sonic-prediction-market/shared';

// IPFS upload using Pinata API
export async function uploadToIPFS(data: EvidenceData): Promise<string> {
  if (!validateEvidenceData(data)) {
    throw new Error('Invalid evidence data structure');
  }

  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!pinataJWT) {
    // Fallback to mock IPFS hash for demo
    console.warn('Pinata JWT not configured, using mock hash');
    return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  try {
    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pinataJWT}`,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: `Evidence-${data.eventId}`,
          keyvalues: {
            eventId: data.eventId,
            outcome: data.parsedOutcome,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash; // Return just the CID
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload evidence to IPFS');
  }
}

// Fetch evidence from IPFS using Pinata gateway
export async function fetchFromIPFS(ipfsUri: string): Promise<EvidenceData> {
  const hash = ipfsUri.replace('ipfs://', '');
  const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
  const gatewayUrl = `${pinataGateway}/${hash}`;
  
  try {
    const response = await fetch(gatewayUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!validateEvidenceData(data)) {
      throw new Error('Invalid evidence data format');
    }
    
    return data;
  } catch (error) {
    console.error('IPFS fetch error:', error);
    throw new Error('Failed to fetch evidence from IPFS');
  }
}

// Upload file to IPFS using Pinata API
export async function uploadFileToIPFS(file: File): Promise<string> {
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!pinataJWT) {
    console.warn('Pinata JWT not configured, using mock hash');
    return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', JSON.stringify({
      name: file.name,
    }));

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash; // Return just the CID
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

// Create evidence data from form input
export function createEvidenceData(
  eventId: string,
  sourceUrl: string,
  rawValue: string,
  parsedOutcome: 'YES' | 'NO' | 'VALUE',
  notes: string
): EvidenceData {
  return {
    eventId,
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    rawValue,
    parsedOutcome,
    notes,
  };
}
