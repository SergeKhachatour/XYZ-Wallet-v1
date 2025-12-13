import React from 'react';
import styled from 'styled-components';
import { CheckCircle, ExternalLink, ArrowLeft, Copy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 2rem;
  color: white;
  text-align: center;
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

const SuccessIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  
  svg {
    width: 64px;
    height: 64px;
    color: #28a745;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #28a745;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
`;

const DetailsCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
`;

const DetailValue = styled.span`
  font-weight: 600;
  font-family: monospace;
  color: white;
  word-break: break-all;
  text-align: right;
  max-width: 60%;
`;

const StellarLink = styled.a`
  color: #4ade80;
  text-decoration: none;
  word-break: break-all;
  max-width: 60%;
  display: inline-block;
  text-align: right;
  
  &:hover {
    text-decoration: underline;
    color: #22c55e;
  }
`;

const HashContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
`;

const HashText = styled.span`
  font-family: monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  flex: 1;
  word-break: break-all;
`;

const CopyButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.5rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
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
  
  @media (max-width: 768px) {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }
  
  @media (min-width: 768px) {
    width: auto;
    font-size: 0.9rem;
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TransactionComplete: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get transaction data from route state
  const { transactionHash, swapDetails, paymentDetails, note, isDemo } = location.state || {};
  
  // If no transaction data, redirect to dashboard
  if (!transactionHash) {
    navigate('/dashboard');
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const openInStellarExpert = () => {
    const url = `https://stellar.expert/explorer/testnet/tx/${transactionHash}`;
    window.open(url, '_blank');
  };

  return (
    <Container>
      <Card>
        <SuccessIcon>
          <CheckCircle />
        </SuccessIcon>
        
        <Title>{paymentDetails ? 'Payment Sent!' : 'Swap Completed!'}</Title>
        <Subtitle>
          {paymentDetails 
            ? 'Your payment has been successfully sent on the Stellar network.'
            : isDemo 
              ? 'Your swap transaction has been executed (Demo mode).' 
              : 'Your token swap has been successfully executed on the Stellar network.'
          }
        </Subtitle>
        
        {paymentDetails && (
          <DetailsCard>
            <DetailRow>
              <DetailLabel>Recipient</DetailLabel>
              <StellarLink 
                href={`https://stellar.expert/explorer/testnet/account/${paymentDetails.recipient}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {paymentDetails.recipient}
                <ExternalLink size={14} style={{ marginLeft: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
              </StellarLink>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Amount</DetailLabel>
              <DetailValue>{paymentDetails.amount} {paymentDetails.asset}</DetailValue>
            </DetailRow>
            {paymentDetails.memo && (
              <DetailRow>
                <DetailLabel>Memo</DetailLabel>
                <DetailValue>{paymentDetails.memo}</DetailValue>
              </DetailRow>
            )}
          </DetailsCard>
        )}
        
        {swapDetails && (
          <DetailsCard>
            <DetailRow>
              <DetailLabel>Amount In</DetailLabel>
              <DetailValue>{swapDetails.amountIn} {swapDetails.assetIn || 'XLM'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Amount Out</DetailLabel>
              <DetailValue>{swapDetails.amountOut} {swapDetails.assetOut || 'XLM'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Exchange Rate</DetailLabel>
              <DetailValue>
                1 {swapDetails.assetIn || 'XLM'} = {(parseFloat(swapDetails.amountOut) / parseFloat(swapDetails.amountIn)).toFixed(6)} {swapDetails.assetOut || 'XLM'}
              </DetailValue>
            </DetailRow>
          </DetailsCard>
        )}
        
        <HashContainer>
          <HashText>{transactionHash}</HashText>
          <CopyButton onClick={() => copyToClipboard(transactionHash)}>
            <Copy size={16} />
          </CopyButton>
        </HashContainer>
        
        {note && (
          <div style={{ 
            background: 'rgba(40, 167, 69, 0.1)', 
            border: '1px solid rgba(40, 167, 69, 0.3)', 
            borderRadius: '8px', 
            padding: '1rem', 
            marginBottom: '2rem',
            color: '#28a745',
            fontSize: '0.9rem'
          }}>
            {note}
          </div>
        )}
        
        <ButtonGroup>
          <Button onClick={openInStellarExpert}>
            <ExternalLink size={20} />
            View on Stellar Expert
          </Button>
          <SecondaryButton onClick={() => navigate(paymentDetails ? '/wallet' : '/swap')}>
            <ArrowLeft size={20} />
            Back to {paymentDetails ? 'Wallet' : 'Swap'}
          </SecondaryButton>
        </ButtonGroup>
      </Card>
    </Container>
  );
};

export default TransactionComplete;
