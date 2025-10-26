import React, { useState } from 'react';
import styled from 'styled-components';
import { Settings as SettingsIcon, Trash2, Download, Upload, Key, Globe } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useLocation } from '../contexts/LocationContext';
import PasskeyAuth from '../components/PasskeyAuth';
import toast from 'react-hot-toast';

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  width: 100%;
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    padding: 1rem;
    border-radius: 12px;
  }
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: none;
  color: #000000;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%);
  color: #FFFFFF;
  
  &:hover {
    background: linear-gradient(135deg, #CC0000 0%, #990000 100%);
    box-shadow: 0 8px 24px rgba(255, 0, 0, 0.4);
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(0, 0, 0, 0.8);
  border: none;
  color: #FFFFFF;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
  }
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const SettingLabel = styled.span`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const SettingDescription = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
`;

const InfoValue = styled.span`
  font-family: monospace;
  font-weight: 600;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
`;

const Settings: React.FC = () => {
  const { 
    isConnected, 
    publicKey, 
    secretKey, 
    disconnectAccount,
    balances,
    transactions 
  } = useWallet();
  
  const { 
    isLocationEnabled, 
    isVisible, 
    locationHistory,
    privacyEnabled,
    disableLocation,
    setPrivacyEnabled
  } = useLocation();

  const [showSecretKey, setShowSecretKey] = useState(false);

  const exportWalletData = () => {
    if (!isConnected || !publicKey || !secretKey) return;

    const walletData = {
      publicKey,
      secretKey,
      balances,
      transactions: transactions.slice(0, 10), // Export last 10 transactions
      locationSettings: {
        isLocationEnabled,
        isVisible,
        locationHistoryCount: locationHistory.length
      },
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(walletData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `xyz-wallet-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Wallet data exported successfully');
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      if (isLocationEnabled) {
        disableLocation();
      }
      disconnectAccount();
      toast.success('All data cleared');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (!isConnected) {
    return (
      <EmptyState>
        <SettingsIcon size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2>No Wallet Connected</h2>
        <p>Connect a wallet to access settings</p>
      </EmptyState>
    );
  }

  return (
    <SettingsContainer>
      {/* Wallet Information */}
      <Section>
        <SectionHeader>
          <Key size={24} />
          <SectionTitle>Wallet Information</SectionTitle>
        </SectionHeader>
        
        <InfoCard>
          <InfoRow>
            <InfoLabel>Public Key</InfoLabel>
            <InfoValue style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {publicKey}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Network</InfoLabel>
            <InfoValue>Testnet</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Assets</InfoLabel>
            <InfoValue>{balances.length}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Transactions</InfoLabel>
            <InfoValue>{transactions.length}</InfoValue>
          </InfoRow>
        </InfoCard>
      </Section>

      {/* Passkey Authentication */}
      <Section>
        <SectionHeader>
          <Key size={24} />
          <SectionTitle>Secure Authentication</SectionTitle>
        </SectionHeader>
        
        <PasskeyAuth 
          onPasskeyEnabled={(credentialId) => {
            console.log('Passkey enabled:', credentialId);
            toast.success('Passkey authentication enabled!');
          }}
          onPasskeyDisabled={() => {
            console.log('Passkey disabled');
            toast.success('Passkey authentication disabled');
          }}
          onAuthenticated={(credentialId) => {
            console.log('Passkey authenticated:', credentialId);
            toast.success('Authenticated with passkey!');
          }}
        />
      </Section>

      {/* Wallet Actions */}
      <Section>
        <SectionHeader>
          <Download size={24} />
          <SectionTitle>Wallet Actions</SectionTitle>
        </SectionHeader>
        
        <SettingItem>
          <SettingInfo>
            <SettingLabel>Export Wallet Data</SettingLabel>
            <SettingDescription>
              Download a backup of your wallet data including balances and recent transactions
            </SettingDescription>
          </SettingInfo>
          <Button onClick={exportWalletData}>
            <Download size={20} />
            Export
          </Button>
        </SettingItem>

        <SettingItem>
          <SettingInfo>
            <SettingLabel>Show Secret Key</SettingLabel>
            <SettingDescription>
              Display your secret key (keep this private and secure)
            </SettingDescription>
          </SettingInfo>
          <SecondaryButton onClick={() => setShowSecretKey(!showSecretKey)}>
            <Key size={20} />
            {showSecretKey ? 'Hide' : 'Show'}
          </SecondaryButton>
        </SettingItem>

        {showSecretKey && secretKey && (
          <InfoCard>
            <InfoRow>
              <InfoLabel>Secret Key</InfoLabel>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <InfoValue style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {secretKey}
                </InfoValue>
                <Button 
                  onClick={() => copyToClipboard(secretKey, 'Secret key')}
                  style={{ padding: '0.5rem', minWidth: 'auto' }}
                >
                  <Upload size={16} />
                </Button>
              </div>
            </InfoRow>
          </InfoCard>
        )}

        <SettingItem>
          <SettingInfo>
            <SettingLabel>Disconnect Wallet</SettingLabel>
            <SettingDescription>
              Disconnect your wallet and clear all local data
            </SettingDescription>
          </SettingInfo>
          <DangerButton onClick={disconnectAccount}>
            Disconnect
          </DangerButton>
        </SettingItem>
      </Section>

      {/* Location Settings */}
      <Section>
        <SectionHeader>
          <Globe size={24} />
          <SectionTitle>Location Settings</SectionTitle>
        </SectionHeader>
        
        <InfoCard>
          <InfoRow>
            <InfoLabel>Location Services</InfoLabel>
            <InfoValue style={{ color: isLocationEnabled ? '#4ade80' : '#f87171' }}>
              {isLocationEnabled ? 'Enabled' : 'Disabled'}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Visibility</InfoLabel>
            <InfoValue style={{ color: isVisible ? '#4ade80' : '#f87171' }}>
              {isVisible ? 'Visible' : 'Hidden'}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Location History</InfoLabel>
            <InfoValue>{locationHistory.length} entries</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Privacy Protection</InfoLabel>
            <InfoValue style={{ color: privacyEnabled ? '#4ade80' : '#f87171' }}>
              {privacyEnabled ? 'Enabled (Approximate Location)' : 'Disabled (Precise Location)'}
            </InfoValue>
          </InfoRow>
        </InfoCard>
        
        {/* Privacy Toggle */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                Location Privacy
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                {privacyEnabled 
                  ? 'Your location is shown approximately (within 100m radius) for privacy protection'
                  : 'Your exact location is shared with other users'
                }
              </div>
            </div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              position: 'relative'
            }}>
              <input
                type="checkbox"
                checked={privacyEnabled}
                onChange={(e) => setPrivacyEnabled(e.target.checked)}
                style={{ 
                  opacity: 0,
                  position: 'absolute',
                  width: 0,
                  height: 0
                }}
              />
              <div style={{
                width: '48px',
                height: '24px',
                background: privacyEnabled ? '#4ade80' : '#6b7280',
                borderRadius: '12px',
                position: 'relative',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: privacyEnabled ? '26px' : '2px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }} />
              </div>
            </label>
          </div>
        </div>
      </Section>

      {/* Application Settings */}
      <Section>
        <SectionHeader>
          <SettingsIcon size={24} />
          <SectionTitle>Application Settings</SectionTitle>
        </SectionHeader>
        
        <SettingItem>
          <SettingInfo>
            <SettingLabel>Network</SettingLabel>
            <SettingDescription>
              Currently connected to Stellar Testnet
            </SettingDescription>
          </SettingInfo>
          <InfoValue>Testnet</InfoValue>
        </SettingItem>

        <SettingItem>
          <SettingInfo>
            <SettingLabel>API Endpoint</SettingLabel>
            <SettingDescription>
              Backend server endpoint
            </SettingDescription>
          </SettingInfo>
          <InfoValue style={{ fontSize: '0.9rem' }}>
            {process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}
          </InfoValue>
        </SettingItem>
      </Section>

      {/* Danger Zone */}
      <Section>
        <SectionHeader>
          <Trash2 size={24} />
          <SectionTitle>Danger Zone</SectionTitle>
        </SectionHeader>
        
        <SettingItem>
          <SettingInfo>
            <SettingLabel>Clear All Data</SettingLabel>
            <SettingDescription>
              Permanently delete all wallet and location data from this device
            </SettingDescription>
          </SettingInfo>
          <DangerButton onClick={clearAllData}>
            <Trash2 size={20} />
            Clear All Data
          </DangerButton>
        </SettingItem>
      </Section>

      {/* About */}
      <Section>
        <SectionHeader>
          <SettingsIcon size={24} />
          <SectionTitle>About XYZ Wallet</SectionTitle>
        </SectionHeader>
        
        <InfoCard>
          <InfoRow>
            <InfoLabel>Version</InfoLabel>
            <InfoValue>1.0.0</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Network</InfoLabel>
            <InfoValue>Stellar Testnet</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Features</InfoLabel>
            <InfoValue>Wallet, Swap, Location Services</InfoValue>
          </InfoRow>
        </InfoCard>
      </Section>
    </SettingsContainer>
  );
};

export default Settings;
