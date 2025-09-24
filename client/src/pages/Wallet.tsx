import React, { useState } from 'react';
import styled from 'styled-components';
import { Plus, Send, Download, Upload, RefreshCw } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

const WalletContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  
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
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const TransactionInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const TransactionHash = styled.span`
  font-family: monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const TransactionDate = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
`;

const TransactionStatus = styled.span<{ $successful: boolean }>`
  color: ${props => props.$successful ? '#4ade80' : '#f87171'};
  font-weight: 600;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
`;

const Wallet: React.FC = () => {
  const { 
    isConnected, 
    publicKey, 
    balances, 
    transactions, 
    createAccount, 
    connectAccount, 
    sendPayment,
    fundAccount,
    refreshBalance,
    refreshTransactions,
    isLoading 
  } = useWallet();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  
  const [connectSecret, setConnectSecret] = useState('');
  const [sendDestination, setSendDestination] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendMemo, setSendMemo] = useState('');

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (connectSecret.trim()) {
      connectAccount(connectSecret.trim());
      setConnectSecret('');
      setShowConnectForm(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendDestination.trim() && sendAmount.trim()) {
      const success = await sendPayment(sendDestination.trim(), sendAmount.trim(), 'XLM', sendMemo.trim() || undefined);
      if (success) {
        setSendDestination('');
        setSendAmount('');
        setSendMemo('');
        setShowSendForm(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!isConnected) {
    return (
      <WalletContainer>
        <Section>
          <SectionHeader>
            <SectionTitle>Connect Your Wallet</SectionTitle>
          </SectionHeader>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus size={20} />
              Create New Wallet
            </Button>
            <SecondaryButton onClick={() => setShowConnectForm(true)}>
              <Upload size={20} />
              Connect Existing Wallet
            </SecondaryButton>
          </div>

          {showCreateForm && (
            <div style={{ marginTop: '2rem' }}>
              <h3>Create New Wallet</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
                This will generate a new Stellar wallet. Make sure to save your secret key securely!
              </p>
              <Button onClick={createAccount} disabled={isLoading}>
                Generate New Wallet
              </Button>
            </div>
          )}

          {showConnectForm && (
            <Form onSubmit={handleConnect} style={{ marginTop: '2rem' }}>
              <h3>Connect Existing Wallet</h3>
              <FormGroup>
                <Label>Secret Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your secret key"
                  value={connectSecret}
                  onChange={(e) => setConnectSecret(e.target.value)}
                  required
                />
              </FormGroup>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button type="submit" disabled={isLoading}>
                  Connect Wallet
                </Button>
                <SecondaryButton onClick={() => setShowConnectForm(false)}>
                  Cancel
                </SecondaryButton>
              </div>
            </Form>
          )}
        </Section>
      </WalletContainer>
    );
  }

  return (
    <WalletContainer>
      {/* Wallet Info */}
      <Section>
        <SectionHeader>
          <SectionTitle>Wallet Information</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={fundAccount} disabled={isLoading} style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}>
              <Plus size={20} />
              Fund Account
            </Button>
            <Button onClick={refreshBalance} disabled={isLoading}>
              <RefreshCw size={20} />
              Refresh
            </Button>
          </div>
        </SectionHeader>
        
        <div style={{ marginBottom: '1rem' }}>
          <Label>Public Key</Label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '0.75rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <span style={{ flex: 1, wordBreak: 'break-all' }}>{publicKey}</span>
            <Button 
              onClick={() => copyToClipboard(publicKey || '')}
              style={{ padding: '0.5rem', minWidth: 'auto' }}
            >
              <Download size={16} />
            </Button>
          </div>
        </div>
      </Section>

      {/* Balances */}
      <Section>
        <SectionHeader>
          <SectionTitle>Balances</SectionTitle>
          <Button onClick={() => setShowSendForm(true)}>
            <Send size={20} />
            Send Payment
          </Button>
        </SectionHeader>
        
        {balances.length > 0 ? (
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
        ) : (
          <EmptyState>
            No balances found. Your wallet might be new or not funded.
          </EmptyState>
        )}
      </Section>

      {/* Send Payment Form */}
      {showSendForm && (
        <Section>
          <SectionHeader>
            <SectionTitle>Send Payment</SectionTitle>
          </SectionHeader>
          
          <Form onSubmit={handleSend}>
            <FormGroup>
              <Label>Destination Address</Label>
              <Input
                type="text"
                placeholder="Enter Stellar address"
                value={sendDestination}
                onChange={(e) => setSendDestination(e.target.value)}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Amount (XLM)</Label>
              <Input
                type="number"
                step="0.0000001"
                placeholder="Enter amount"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Memo (Optional)</Label>
              <TextArea
                placeholder="Enter memo"
                value={sendMemo}
                onChange={(e) => setSendMemo(e.target.value)}
              />
            </FormGroup>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button type="submit" disabled={isLoading}>
                Send Payment
              </Button>
              <SecondaryButton onClick={() => setShowSendForm(false)}>
                Cancel
              </SecondaryButton>
            </div>
          </Form>
        </Section>
      )}

      {/* Recent Transactions */}
      <Section>
        <SectionHeader>
          <SectionTitle>Recent Transactions</SectionTitle>
          <Button onClick={refreshTransactions} disabled={isLoading}>
            <RefreshCw size={20} />
            Refresh
          </Button>
        </SectionHeader>
        
        {transactions.length > 0 ? (
          <TransactionList>
            {transactions.slice(0, 10).map((tx) => (
              <TransactionItem key={tx.id}>
                <TransactionInfo>
                  <TransactionHash>{tx.hash}</TransactionHash>
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
    </WalletContainer>
  );
};

export default Wallet;
