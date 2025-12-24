import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Send, Download, RefreshCw, QrCode, Copy, Camera, X, Shield, ArrowDownCircle, ExternalLink, Info, Code, Wallet as WalletIcon, Key, LogOut } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useLocation } from '../contexts/LocationContext';
import DepositOverlay from '../components/DepositOverlay';
import ImportWalletModal from '../components/ImportWalletModal';
import SendOverlay from '../components/SendOverlay';
import ReceiveOverlay from '../components/ReceiveOverlay';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const WalletContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (max-width: 768px) {
    padding: 0 0.5rem;
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border-radius: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
    margin-bottom: 1rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
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
  width: 100%;
  font-size: 0.9rem;
  
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
  
  @media (max-width: 768px) {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }
  
  @media (min-width: 768px) {
    width: auto;
    font-size: 0.9rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    justify-content: center;
    flex: 1;
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const QRCodeImage = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const AddressDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
  max-width: 100%;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
`;

const CopyButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;


const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4a4a4a;
    box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.3);
  }
`;

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4a4a4a;
    box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.3);
  }
`;

const BalanceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BalanceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const AssetInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const AssetCode = styled.span`
  font-weight: 600;
  font-size: 1.1rem;
`;

const AssetType = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`;

const AssetBalance = styled.span`
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: 600;
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

const TransactionInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const TransactionHash = styled.a`
  font-family: monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  word-break: break-all;
  overflow-wrap: break-word;
  hyphens: auto;
  
  &:hover {
    color: #4ade80;
    text-decoration: underline;
  }
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    line-height: 1.4;
  }
`;

const TransactionDate = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
`;

const TransactionStatus = styled.span<{ $successful: boolean }>`
  color: ${props => props.$successful ? '#4ade80' : '#f87171'};
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    align-self: flex-start;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
`;

const NFTCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
`;

const NFTImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
`;

const NFTInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const NFTName = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
`;

const NFTCollection = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`;

const NFTDistance = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
`;

const TopRightIcons = styled.div`
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  gap: 0.5rem;
  z-index: 100;
  
  @media (max-width: 768px) {
    top: 1rem;
    right: 5rem;
    z-index: 9998;
    pointer-events: auto;
  }
  
  @media (max-width: 480px) {
    right: 4.5rem;
    gap: 0.25rem;
  }
`;

const IconButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #FFFFFF;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: scale(1.1);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
  }
`;

const ReceiveIcon = styled(IconButton)`
  &:hover {
    color: #00FF00;
  }
`;

const SendIcon = styled(IconButton)`
  &:hover {
    color: #FFD700;
  }
`;

const Wallet: React.FC = () => {
  const { 
    isConnected, 
    publicKey, 
    balances, 
    transactions, 
    sendPayment,
    fundAccount,
    refreshBalance,
    refreshTransactions,
    isLoading,
    // connectWithPasskey, // Reserved for future use
    createWalletWithPasskey,
    createWalletWithZKProof, // Added ZK proof wallet creation
    importWalletFromSecretKey, // Import existing wallet from secret key
    disconnectAccount, // Disconnect current wallet
    contractBalance,
    userStake,
    getContractBalance,
    depositToContract
  } = useWallet();

  const { userNFTs, refreshUserNFTs } = useLocation();

  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [showDepositOverlay, setShowDepositOverlay] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Generate QR code for wallet address
  const generateQRCode = async () => {
    if (publicKey) {
      try {
        const qrDataURL = await QRCode.toDataURL(publicKey, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataURL(qrDataURL);
        setShowQRCode(true);
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast.error('Failed to generate QR code');
      }
    }
  };

  // Load contract balance when wallet is connected
  useEffect(() => {
    if (publicKey && isConnected) {
      getContractBalance();
    }
  }, [publicKey, isConnected]);

  // Note: We don't automatically fetch userNFTs on mount since the API call
  // may fail with 400 (expected when GeoLink auth isn't configured).
  // Users can manually refresh using the "Refresh" button in the NFT section.

  // Listen for passkey setup events
  // Passkey setup is now handled automatically in the wallet context

  // Passkey functions are now handled in the wallet context

  if (!isConnected) {
    return (
      <>
        <WalletContainer>
        <Section>
          <SectionHeader>
            <SectionTitle>Connect Your Wallet</SectionTitle>
          </SectionHeader>
          
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>XYZ-Wallet</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem' }}>
              Secure wallet with passkey and zero-knowledge proof authentication.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
              <Button onClick={createWalletWithPasskey} disabled={isLoading} style={{ background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' }}>
                <Shield size={20} />
                {isLoading ? 'Creating...' : 'Create Passkey Wallet'}
              </Button>
              
              <Button onClick={createWalletWithZKProof} disabled={isLoading} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <Shield size={20} />
                {isLoading ? 'Creating...' : 'Create ZK Proof Wallet'}
              </Button>
              
              <Button onClick={() => setShowImportModal(true)} disabled={isLoading} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Key size={20} />
                {isLoading ? 'Importing...' : 'Import Existing Wallet'}
              </Button>
            </div>
          </div>
        </Section>
      </WalletContainer>
      
      {/* Import Wallet Modal - must be here to render when not connected */}
      <ImportWalletModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importWalletFromSecretKey}
      />
      </>
    );
  }

  return (
    <>
      {/* Top Right Icons - Send/Receive */}
      {isConnected && (
        <TopRightIcons>
          <ReceiveIcon onClick={() => setIsReceiveOpen(true)} title="Receive XLM">
            <QrCode size={20} />
          </ReceiveIcon>
          <SendIcon onClick={() => setIsSendOpen(true)} title="Send Payment">
            <Send size={20} />
          </SendIcon>
        </TopRightIcons>
      )}

      <WalletContainer>
      {/* Wallet Info */}
      <Section>
        <SectionHeader>
          <SectionTitle>Wallet Information</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={fundAccount} disabled={isLoading} style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}>
              <Plus size={20} />
              Fund Account
            </Button>
            <Button onClick={refreshBalance} disabled={isLoading}>
              <RefreshCw size={20} />
              Refresh
            </Button>
            <Button 
              onClick={() => {
                if (window.confirm('This will disconnect your current wallet. You can then import or create a different wallet. Continue?')) {
                  disconnectAccount();
                }
              }} 
              disabled={isLoading}
              style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
              title="Disconnect current wallet"
            >
              <LogOut size={20} />
              Disconnect
            </Button>
          </div>
        </SectionHeader>
        
        <div style={{ marginBottom: '1rem' }}>
          <Label>Public Key</Label>
          <AddressDisplay>
            <span style={{ flex: 1, wordBreak: 'break-all' }}>{publicKey}</span>
            <Button 
              onClick={() => copyToClipboard(publicKey || '')}
              style={{ padding: '0.5rem', minWidth: 'auto' }}
            >
              <Download size={16} />
            </Button>
          </AddressDisplay>
        </div>
        
        {/* QR Code Section */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Button onClick={generateQRCode}>
              <QrCode size={20} />
              Generate QR Code
            </Button>
          </div>
          
          {showQRCode && qrCodeDataURL && (
            <QRCodeContainer>
              <h3 style={{ margin: 0, textAlign: 'center' }}>Your Wallet Address</h3>
              <QRCodeImage>
                <img src={qrCodeDataURL} alt="Wallet QR Code" style={{ display: 'block' }} />
              </QRCodeImage>
              <AddressDisplay>
                <span style={{ flex: 1 }}>{publicKey}</span>
                <CopyButton onClick={() => copyToClipboard(publicKey || '')}>
                  <Copy size={16} />
                </CopyButton>
              </AddressDisplay>
              <p style={{ 
                textAlign: 'center', 
                fontSize: '0.9rem', 
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0 
              }}>
                Scan this QR code to get your wallet address for receiving payments
              </p>
            </QRCodeContainer>
          )}
        </div>
      </Section>

      {/* Balances & Smart Wallet */}
      <Section>
        <SectionHeader>
          <SectionTitle>Balances & Smart Wallet</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={() => setShowDepositOverlay(true)} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              <ArrowDownCircle size={20} />
              Deposit
            </Button>
            <Button onClick={() => setIsReceiveOpen(true)} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <QrCode size={20} />
              Receive
            </Button>
            <Button onClick={() => setIsSendOpen(true)}>
              <Send size={20} />
              Send
            </Button>
          </div>
        </SectionHeader>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Wallet Balances */}
          {balances.length > 0 ? (
            <div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontWeight: '500',
                marginBottom: '0.75rem'
              }}>
                Wallet Balances
              </div>
              <BalanceList>
                {balances.map((balance, index) => (
                  <BalanceItem key={index}>
                    <AssetInfo>
                      <AssetCode>{balance.asset}</AssetCode>
                      <AssetType>{balance.assetType}</AssetType>
                    </AssetInfo>
                    <AssetBalance>{balance.balance}</AssetBalance>
                  </BalanceItem>
                ))}
              </BalanceList>
            </div>
          ) : (
            <div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontWeight: '500',
                marginBottom: '0.75rem'
              }}>
                Wallet Balances
              </div>
              <EmptyState>
                No balances found. Your wallet might be new or not funded.
              </EmptyState>
            </div>
          )}

          {/* Smart Wallet Vault & Stake */}
          {(contractBalance !== null || userStake !== null) && (
            <div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontWeight: '500',
                marginBottom: '0.75rem'
              }}>
                Smart Wallet
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* User's Personal Stake */}
                {userStake !== null && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(59, 130, 246, 0.4)'
                      }}>
                        <WalletIcon size={20} style={{ color: '#60a5fa' }} />
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: '500'
                        }}>
                          Your Stake
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}>
                          Your total deposits in the contract
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      color: '#60a5fa',
                      letterSpacing: '0.5px'
                    }}>
                      {parseFloat(userStake).toFixed(7)} XLM
                    </div>
                  </div>
                )}

                {/* Total Vault Balance */}
                {contractBalance !== null && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
                    border: '2px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(16, 185, 129, 0.4)'
                      }}>
                        <WalletIcon size={20} style={{ color: '#10b981' }} />
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: '500'
                        }}>
                          Total Vault Balance
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}>
                          Sum of all deposits from all users
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      color: '#10b981',
                      letterSpacing: '0.5px'
                    }}>
                      {parseFloat(contractBalance).toFixed(7)} XLM
                    </div>
                    {userStake !== null && contractBalance !== null && (
                      <div style={{
                        marginTop: '0.5rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}>
                        Other users' stake: {(parseFloat(contractBalance) - parseFloat(userStake)).toFixed(7)} XLM
                      </div>
                    )}
                    <Button 
                      onClick={() => setShowDepositOverlay(true)} 
                      disabled={isLoading}
                      style={{ 
                        marginTop: '1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        fontSize: '0.875rem',
                        padding: '0.625rem 1.25rem'
                      }}
                    >
                      <ArrowDownCircle size={16} style={{ marginRight: '0.5rem' }} />
                      Deposit
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Smart Wallet Contract Information */}
      {contractBalance !== null && (
        <Section>
          <SectionHeader>
            <SectionTitle>Smart Wallet Contract</SectionTitle>
          </SectionHeader>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Contract Address */}
            <div>
              <Label style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={16} />
                Contract Address
              </Label>
              <AddressDisplay>
                <span style={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {process.env.REACT_APP_SMART_WALLET_CONTRACT_ID || 'Not configured'}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    onClick={() => {
                      const contractId = process.env.REACT_APP_SMART_WALLET_CONTRACT_ID;
                      if (contractId) {
                        // Stellar Lab URL with proper query parameters
                        const labUrl = `https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=${contractId};;`;
                        window.open(labUrl, '_blank');
                      }
                    }}
                    style={{ padding: '0.5rem', minWidth: 'auto', fontSize: '0.8rem' }}
                    title="View on Stellar Laboratory"
                  >
                    <ExternalLink size={14} />
                    Lab
                  </Button>
                  <Button
                    onClick={() => {
                      const contractId = process.env.REACT_APP_SMART_WALLET_CONTRACT_ID;
                      if (contractId) {
                        window.open(`https://stellar.expert/explorer/testnet/contract/${contractId}`, '_blank');
                      }
                    }}
                    style={{ padding: '0.5rem', minWidth: 'auto', fontSize: '0.8rem' }}
                    title="View on Stellar Expert"
                  >
                    <ExternalLink size={14} />
                    Expert
                  </Button>
                </div>
              </AddressDisplay>
            </div>

            {/* Contract Description */}
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#93c5fd' }}>
                <Info size={16} />
                <strong style={{ fontSize: '0.9rem' }}>About This Contract</strong>
              </div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                This smart wallet contract enables secure, passkey-authenticated transactions on the Stellar network. 
                Tokens are held in the contract and can be transferred using WebAuthn passkey authentication, providing 
                enhanced security without requiring traditional private key management.
              </p>
            </div>

            {/* Available Contract Functions */}
            <div>
              <Label style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={16} />
                Available Contract Functions
              </Label>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '1rem' }}>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem', lineHeight: '1.8' }}>
                  <li>
                    <code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>execute_payment</code>
                    {' '}- Send payment from smart wallet (requires passkey authentication)
                  </li>
                  <li>
                    <code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>get_balance</code>
                    {' '}- Get user's balance in the contract
                  </li>
                  <li>
                    <code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>deposit</code>
                    {' '}- Deposit tokens to smart wallet
                  </li>
                  <li>
                    <code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>register_signer</code>
                    {' '}- Register passkey signer (automatically called on first use)
                  </li>
                  <li>
                    <code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>is_signer_registered</code>
                    {' '}- Check if a signer is registered for an address
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Recent Transactions */}
      <Section>
        <SectionHeader>
          <SectionTitle>Recent Transactions</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={refreshTransactions} disabled={isLoading}>
              <RefreshCw size={20} />
              Refresh
            </Button>
          </div>
        </SectionHeader>
        
        {transactions.length > 0 ? (
          <TransactionList>
            {transactions.slice(0, 10).map((tx) => (
              <TransactionItem key={tx.id}>
                <TransactionInfo>
                  <TransactionHash 
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Stellar Expert"
                  >
                    {tx.hash}
                  </TransactionHash>
                  <TransactionDate>
                    {new Date(tx.createdAt).toLocaleString()}
                  </TransactionDate>
                </TransactionInfo>
                <TransactionStatus $successful={tx.successful}>
                  {tx.successful ? 'Success' : 'Failed'}
                </TransactionStatus>
              </TransactionItem>
            ))}
          </TransactionList>
        ) : (
          <EmptyState>
            No transactions found.
          </EmptyState>
        )}
      </Section>

      {/* NFT Collection */}
      <Section>
        <SectionHeader>
          <SectionTitle>My NFT Collection</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={refreshUserNFTs} disabled={isLoading}>
              <RefreshCw size={20} />
              Refresh
            </Button>
          </div>
        </SectionHeader>
        
        {userNFTs.length > 0 ? (
          <div>
            {userNFTs.map((nft, index) => (
              <NFTCard key={nft.id || index}>
                <NFTImage 
                  src={nft.image_url} 
                  alt={nft.name}
                  onError={(e) => {
                    e.currentTarget.src = '/stellar-location.png';
                  }}
                />
                <NFTInfo>
                  <NFTName>{nft.name}</NFTName>
                  <NFTCollection>{nft.collection?.name || 'Unknown Collection'}</NFTCollection>
                  <NFTDistance>Collected at {nft.distance}m from location</NFTDistance>
                </NFTInfo>
              </NFTCard>
            ))}
          </div>
        ) : (
          <EmptyState>
            No NFTs collected yet. Explore the map to discover and collect nearby NFTs!
          </EmptyState>
        )}
      </Section>

      {/* Authentication Modal - Removed: Email/password SRP authentication no longer needed */}

      {/* Deposit Overlay */}
      <DepositOverlay
        isOpen={showDepositOverlay}
        onClose={() => {
          setShowDepositOverlay(false);
          getContractBalance(); // Refresh balance when closing
        }}
      />

      {/* Receive Overlay */}
      <ReceiveOverlay
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
      />

      {/* Send Overlay */}
      <SendOverlay
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
      />

    </WalletContainer>
    
    {/* Import Wallet Modal - rendered outside container for proper z-index */}
      <ImportWalletModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importWalletFromSecretKey}
      />
    </>
  );
};

export default Wallet;
