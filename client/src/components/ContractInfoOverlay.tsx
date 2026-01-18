import React, { useState } from 'react';
import styled from 'styled-components';
import { useWallet } from '../contexts/WalletContext';
import { useLocation } from '../contexts/LocationContext';
import { passkeyService } from '../services/passkeyService';
import toast from 'react-hot-toast';
import { ExternalLink, Shield, Circle } from 'lucide-react';
import { DistanceMap } from './DistanceMap';

interface ContractInfoOverlayProps {
  contract: any;
  onClose: () => void;
  onZoomIn?: () => void;
}

export const ContractInfoOverlay: React.FC<ContractInfoOverlayProps> = ({
  contract,
  onClose,
  onZoomIn
}) => {
  const { publicKey } = useWallet();
  const { geoLink, currentLocation } = useLocation();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!geoLink || !publicKey || !currentLocation) {
      toast.error('Missing required information to execute contract');
      return;
    }

    setIsExecuting(true);
    try {
      // Check if WebAuthn is required
      let webauthnData = undefined;
      if (contract.requires_webauthn) {
        try {
          const passkeyData = await passkeyService.getStoredPasskeyData();
          if (!passkeyData) {
            throw new Error('No passkey found. Please set up passkey authentication first.');
          }

          // Generate a challenge for WebAuthn
          const challenge = new Uint8Array(32);
          crypto.getRandomValues(challenge);

          // Authenticate with passkey
          const authResult = await passkeyService.authenticatePasskey(passkeyData.id, challenge);

          // Create signature payload (contract address + function name + parameters)
          const signaturePayload = JSON.stringify({
            contract_address: contract.contract_address,
            function_name: contract.function_name,
            parameters: contract.function_mappings?.[contract.function_name] || {},
            timestamp: Date.now()
          });

          webauthnData = {
            signature: authResult.signature,
            authenticatorData: authResult.authenticatorData,
            clientData: authResult.clientDataJSON,
            signaturePayload: signaturePayload
          };
        } catch (error) {
          toast.error(`WebAuthn authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsExecuting(false);
          return;
        }
      }

      // Check if smart wallet routing is needed
      if (contract.use_smart_wallet) {
        const functionParams = contract.function_mappings?.[contract.function_name] || {};
        
        // Get secret key from localStorage (required for smart wallet execution)
        const secretKey = localStorage.getItem('wallet_secretKey');
        if (!secretKey) {
          toast.error('Secret key required for smart wallet execution. Please import your wallet.');
          setIsExecuting(false);
          return;
        }

        await geoLink.executeSmartWalletPayment(
          functionParams.destination || '',
          functionParams.amount || 0,
          functionParams.asset || 'native',
          publicKey,
          secretKey,
          contract.id,
          webauthnData
        );

        toast.success('Smart wallet payment executed successfully!');
      } else {
        // Regular contract execution
        const functionParams = contract.function_mappings?.[contract.function_name] || {};
        
        await geoLink.executeContract(
          contract.id,
          contract.function_name,
          functionParams,
          publicKey,
          webauthnData
        );

        toast.success(`Contract function "${contract.function_name}" executed successfully!`);
      }

      onClose();
    } catch (error) {
      console.error('Contract execution error:', error);
      toast.error(`Failed to execute contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStellarExplorerUrl = (address: string) => {
    const network = contract.network === 'mainnet' ? '' : 'testnet/';
    return `https://stellar.expert/explorer/${network}contract/${address}`;
  };

  return (
    <Overlay onClick={onClose}>
      <ContractCard onClick={(e) => e.stopPropagation()}>
        <ContractHeader>
          <ContractIcon>
            <AbacusIcon>🧮</AbacusIcon>
          </ContractIcon>
          <ContractInfo>
            <ContractName>Smart Contract</ContractName>
            <ContractDescription>{contract.rule_name || contract.contract_name || 'No description available'}</ContractDescription>
          </ContractInfo>
        </ContractHeader>
        
        <ContractDetails>
          <DetailRow>
            <DetailLabel>Contract Name:</DetailLabel>
            <DetailValue>{contract.contract_name || 'Unknown'}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Function:</DetailLabel>
            <DetailValue>{contract.function_name || 'Unknown'}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Contract Address:</DetailLabel>
            <DetailValue>
              <AddressLink 
                href={getStellarExplorerUrl(contract.contract_address)} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {contract.contract_address?.substring(0, 16)}...
                <ExternalLink size={14} style={{ marginLeft: '4px' }} />
              </AddressLink>
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Radius:</DetailLabel>
            <DetailValue>{contract.radius_meters ? `${contract.radius_meters}m` : 'Unknown'}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Distance:</DetailLabel>
            <DetailValue>{contract.distance ? `${Math.round(contract.distance)}m away` : 'Unknown'}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Trigger:</DetailLabel>
            <DetailValue>{contract.trigger_on || 'Unknown'}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Auto-execute:</DetailLabel>
            <DetailValue>
              {contract.auto_execute ? (
                <AutoExecuteBadge $auto={true}>Yes</AutoExecuteBadge>
              ) : (
                <AutoExecuteBadge $auto={false}>No</AutoExecuteBadge>
              )}
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>WebAuthn Required:</DetailLabel>
            <DetailValue>
              {contract.requires_webauthn ? (
                <Shield size={16} style={{ color: '#4ade80' }} />
              ) : (
                <span>No</span>
              )}
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Network:</DetailLabel>
            <DetailValue>{contract.network || 'Unknown'}</DetailValue>
          </DetailRow>
        </ContractDetails>

        {/* Distance Map */}
        {contract.latitude && contract.longitude && currentLocation && (
          <MapSection>
            <MapTitle>Distance to Contract</MapTitle>
            <DistanceMap
              targetLatitude={contract.latitude}
              targetLongitude={contract.longitude}
              radiusMeters={contract.radius_meters}
              showRadius={true}
              height="350px"
            />
          </MapSection>
        )}

        {/* Zoom In Button - separate from other buttons */}
        {onZoomIn && (
          <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
            <ZoomButton onClick={onZoomIn}>
              <ZoomButtonText>🔍 Zoom In</ZoomButtonText>
            </ZoomButton>
          </div>
        )}

        {contract.function_mappings && contract.function_mappings[contract.function_name] && (
          <FunctionParams>
            <ParamsTitle>Function Parameters:</ParamsTitle>
            <ParamsList>
              {(() => {
                let params: any = contract.function_mappings[contract.function_name];
                
                console.log('⚡ Raw params:', params, 'Type:', typeof params, 'IsArray:', Array.isArray(params));
                console.log('⚡ Full function_mappings:', contract.function_mappings);
                
                // Try to parse if it's a string (could be JSON string)
                if (typeof params === 'string') {
                  // Check if it looks like a JSON array or object
                  const trimmed = params.trim();
                  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                    try {
                      params = JSON.parse(params);
                      console.log('⚡ Parsed params:', params, 'IsArray after parse:', Array.isArray(params));
                    } catch (e) {
                      console.error('⚡ Failed to parse function parameters:', e);
                    }
                  }
                }
                
                // Check if params is an array of parameter objects
                if (Array.isArray(params)) {
                  console.log('⚡ Rendering as array with', params.length, 'items');
                  return params.map((param: any, index: number) => {
                    // Handle case where param might be a string that needs parsing
                    if (typeof param === 'string') {
                      try {
                        param = JSON.parse(param);
                      } catch (e) {
                        // If parsing fails, skip this param
                        return null;
                      }
                    }
                    
                    if (!param || typeof param !== 'object') {
                      return null;
                    }
                    
                    return (
                      <ParamItem key={index}>
                        <ParamHeader>
                          <ParamName>{param.name || `Parameter ${index + 1}`}</ParamName>
                          <ParamType>{param.type || 'Unknown'}</ParamType>
                        </ParamHeader>
                        {param.mapped_from && (
                          <ParamMapped>
                            <ParamMappedLabel>Mapped from:</ParamMappedLabel>
                            <ParamMappedValue>{param.mapped_from}</ParamMappedValue>
                          </ParamMapped>
                        )}
                      </ParamItem>
                    );
                  }).filter(Boolean);
                }
                
                // Check if params is an object that might contain an array
                if (typeof params === 'object' && params !== null) {
                  // Check if it has a 'parameters' key that's an array
                  if ('parameters' in params && Array.isArray((params as any).parameters)) {
                    return (params as any).parameters.map((param: any, index: number) => (
                      <ParamItem key={index}>
                        <ParamHeader>
                          <ParamName>{param.name || `Parameter ${index + 1}`}</ParamName>
                          <ParamType>{param.type || 'Unknown'}</ParamType>
                        </ParamHeader>
                        {param.mapped_from && (
                          <ParamMapped>
                            <ParamMappedLabel>Mapped from:</ParamMappedLabel>
                            <ParamMappedValue>{param.mapped_from}</ParamMappedValue>
                          </ParamMapped>
                        )}
                      </ParamItem>
                    ));
                  }
                  
                  // Check if any value in the object is an array
                  const entries = Object.entries(params);
                  for (const [key, value] of entries) {
                    if (Array.isArray(value)) {
                      // Render the array as parameters
                      return value.map((param: any, index: number) => {
                        // Handle case where param might be a string that needs parsing
                        let parsedParam = param;
                        if (typeof param === 'string') {
                          try {
                            parsedParam = JSON.parse(param);
                          } catch (e) {
                            return null;
                          }
                        }
                        
                        if (!parsedParam || typeof parsedParam !== 'object') {
                          return null;
                        }
                        
                        return (
                          <ParamItem key={`${key}-${index}`}>
                            <ParamHeader>
                              <ParamName>{parsedParam.name || parsedParam.key || key || `Parameter ${index + 1}`}</ParamName>
                              <ParamType>{parsedParam.type || 'Unknown'}</ParamType>
                            </ParamHeader>
                            {parsedParam.mapped_from && (
                              <ParamMapped>
                                <ParamMappedLabel>Mapped from:</ParamMappedLabel>
                                <ParamMappedValue>{parsedParam.mapped_from}</ParamMappedValue>
                              </ParamMapped>
                            )}
                          </ParamItem>
                        );
                      }).filter(Boolean);
                    }
                  }
                  
                  // Otherwise, treat as object with key-value pairs
                  return Object.entries(params).map(([key, value]) => {
                    // Properly format the value - handle objects, arrays, and primitives
                    let displayValue: string;
                    if (value === null || value === undefined) {
                      displayValue = 'null';
                    } else if (typeof value === 'object') {
                      // If it's an object, try to display it nicely
                      if (Array.isArray(value)) {
                        displayValue = `[${value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ')}]`;
                      } else {
                        // For objects, show key-value pairs or just the type
                        const keys = Object.keys(value);
                        if (keys.length === 0) {
                          displayValue = '{}';
                        } else if (keys.length === 1 && (keys[0] === 'type' || keys[0] === 'Type')) {
                          // If it's a type definition, show the type
                          displayValue = String((value as any)[keys[0]]);
                        } else {
                          // Show as JSON for complex objects
                          displayValue = JSON.stringify(value, null, 2);
                        }
                      }
                    } else {
                      displayValue = String(value);
                    }
                    
                    return (
                      <ParamItem key={key}>
                        <ParamKey>{key}:</ParamKey>
                        <ParamValue>{displayValue}</ParamValue>
                      </ParamItem>
                    );
                  });
                }
                
                // Fallback: display as string
                return (
                  <ParamItem>
                    <ParamValue>{String(params)}</ParamValue>
                  </ParamItem>
                );
              })()}
            </ParamsList>
          </FunctionParams>
        )}
        
        <ButtonContainer>
          {!contract.auto_execute && (
            <ExecuteButton onClick={handleExecute} disabled={isExecuting}>
              <ExecuteButtonText>
                {isExecuting ? '⏳ Executing...' : `⚡ Execute ${contract.function_name}`}
              </ExecuteButtonText>
            </ExecuteButton>
          )}
          <CloseButton onClick={onClose}>
            <CloseButtonText>✕ Close</CloseButtonText>
          </CloseButton>
        </ButtonContainer>
      </ContractCard>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ContractCard = styled.div`
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  padding: 30px;
  margin: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  color: white;
`;

const ContractHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: flex-start;
`;

const ContractIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  color: white;
`;

const AbacusIcon = styled.div`
  font-size: 48px;
  line-height: 1;
`;

const ContractInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ContractName = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: white;
  line-height: 1.2;
`;

const ContractDescription = styled.div`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
`;

const ContractDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
`;

const DetailValue = styled.div`
  font-size: 14px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AddressLink = styled.a`
  color: #8b5cf6;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;
  
  &:hover {
    color: #a78bfa;
    text-decoration: underline;
  }
`;

const AutoExecuteBadge = styled.span<{ $auto: boolean }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$auto ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  color: ${props => props.$auto ? '#4ade80' : '#ef4444'};
  border: 1px solid ${props => props.$auto ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
`;

const FunctionParams = styled.div`
  margin-bottom: 25px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ParamsTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
`;

const ParamsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ParamItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ParamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const ParamName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: white;
  flex: 1;
  min-width: 150px;
`;

const ParamType = styled.div`
  font-size: 12px;
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  border: 1px solid rgba(139, 92, 246, 0.3);
`;

const ParamMapped = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const ParamMappedLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
`;

const ParamMappedValue = styled.div`
  font-size: 12px;
  color: #4ade80;
  font-family: monospace;
  background: rgba(74, 222, 128, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
`;

const ParamKey = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
`;

const ParamValue = styled.div`
  font-size: 14px;
  color: white;
  font-family: monospace;
  word-break: break-all;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ExecuteButton = styled.button`
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  color: white;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ExecuteButtonText = styled.div`
  color: white;
  font-weight: bold;
`;

const ZoomButton = styled.button`
  background: linear-gradient(135deg, #00FF00 0%, #00CC00 100%);
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  color: #000000;
  
  &:hover {
    background: linear-gradient(135deg, #00CC00 0%, #009900 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 255, 0, 0.4);
  }
`;

const ZoomButtonText = styled.div`
  color: #000000;
  font-weight: bold;
`;

const CloseButton = styled.button`
  background: linear-gradient(135deg, #333333 0%, #1A1A1A 100%);
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  color: #FFFFFF;
  
  &:hover {
    background: linear-gradient(135deg, #1A1A1A 0%, #000000 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
`;

const CloseButtonText = styled.div`
  color: #FFFFFF;
  font-weight: bold;
`;

const MapSection = styled.div`
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MapTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
`;
