import React from 'react';
import styled from 'styled-components';
import { constructImageUrl } from '../services/geoLinkService';

interface NFTCollectionOverlayProps {
  nft: any;
  onCollect: () => void;
  onClose: () => void;
  onZoomIn?: () => void;
}

export const NFTCollectionOverlay: React.FC<NFTCollectionOverlayProps> = ({
  nft,
  onCollect,
  onClose,
  onZoomIn
}) => {
  // Construct image URL using the new utility function that handles dynamic IPFS server URLs
  const imageUrl = constructImageUrl(nft.server_url, nft.ipfs_hash) || nft.image_url || 'https://via.placeholder.com/200x200?text=NFT';
  
  return (
    <Overlay>
      <NFTCard>
        <NFTHeader>
          <NFTImage src={imageUrl} alt={nft.collection_name || 'NFT'} />
          <NFTInfo>
            <NFTName>{nft.collection_name || 'Unknown NFT'}</NFTName>
            <NFTDescription>{nft.description || 'No description available'}</NFTDescription>
          </NFTInfo>
        </NFTHeader>
        
        <NFTDetails>
          <DetailRow>
            <DetailLabel>Distance:</DetailLabel>
            <DetailValue>{Math.round(nft.distance)}m away</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Collection Radius:</DetailLabel>
            <DetailValue>{nft.radius_meters}m</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Rarity Level:</DetailLabel>
            <DetailValue>{nft.rarity_level || 'Unknown'}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Status:</DetailLabel>
            <DetailValue>{nft.is_active ? 'Active' : 'Inactive'}</DetailValue>
          </DetailRow>
          {nft.id && (
            <DetailRow>
              <DetailLabel>NFT ID:</DetailLabel>
              <DetailValue>#{nft.id}</DetailValue>
            </DetailRow>
          )}
        </NFTDetails>
        
        <ButtonContainer>
          <CollectButton onClick={onCollect}>
            <CollectButtonText>🎯 Collect NFT</CollectButtonText>
          </CollectButton>
          {onZoomIn && (
            <ZoomButton onClick={onZoomIn}>
              <ZoomButtonText>🔍 Zoom In</ZoomButtonText>
            </ZoomButton>
          )}
          <CloseButton onClick={onClose}>
            <CloseButtonText>✕ Close</CloseButtonText>
          </CloseButton>
        </ButtonContainer>
      </NFTCard>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const NFTCard = styled.div`
  background-color: white;
  border-radius: 20px;
  padding: 30px;
  margin: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const NFTHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: flex-start;
`;

const NFTImage = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 15px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const NFTInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NFTName = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
`;

const NFTDescription = styled.div`
  font-size: 16px;
  color: #666;
  line-height: 1.4;
`;

const NFTDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #495057;
`;

const DetailValue = styled.div`
  font-size: 14px;
  color: #212529;
  font-weight: 500;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
`;

const CollectButton = styled.button`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  color: #000000;
  
  &:hover {
    background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
  }
`;

const CollectButtonText = styled.div`
  color: #000000;
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
