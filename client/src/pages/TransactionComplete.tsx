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
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  color: white;
  text-align: center;
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
  const { transactionHash, swapDetails, note, isDemo } = location.state || {};
  
  // If no transaction data, redirect to dashboard
  if (!transactionHash) {
    navigate('/dashboard');
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const openInStellarLab = () => {
    const url = `https://laboratory.stellar.org/#explorer?resource=transactions&endpoint=transactions&values=${encodeURIComponent(JSON.stringify({ tx: transactionHash }))}`;
    window.open(url, '_blank');
  };

  return (
    <Container>
      <Card>
        <SuccessIcon>
          <CheckCircle />
        </SuccessIcon>
        
        <Title>Swap Completed!</Title>
        <Subtitle>
          {isDemo 
            ? 'Your swap transaction has been executed (Demo mode).' 
            : 'Your token swap has been successfully executed on the Stellar network.'
          }
        </Subtitle>
        
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
          <Button onClick={openInStellarLab}>
            <ExternalLink size={20} />
            View on Stellar Lab
          </Button>
          <SecondaryButton onClick={() => navigate('/swap')}>
            <ArrowLeft size={20} />
            Back to Swap
          </SecondaryButton>
        </ButtonGroup>
      </Card>
    </Container>
  );
};

export default TransactionComplete;
