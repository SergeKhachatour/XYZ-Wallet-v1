import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Wallet, MapPin, Settings, Home, ArrowLeftRight, Menu, X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 101;
`;

const Nav = styled.nav<{ $isOpen: boolean }>`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    transition: transform 0.3s ease;
    z-index: 1000;
    opacity: ${props => props.$isOpen ? 1 : 0};
    visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  z-index: 101;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 8px;
  display: none;
  transition: all 0.2s ease;
  z-index: 1001;
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: white;
  transition: all 0.2s ease;
  background: ${props => props.$isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    padding: 1rem 2rem;
    border-radius: 12px;
    background: ${props => props.$isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'};
    border: 1px solid rgba(255, 255, 255, 0.3);
    min-width: 200px;
    text-align: center;
    justify-content: center;
    color: white !important;
    font-weight: 500;
    
    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.4);
      transform: translateY(-2px);
    }
  }
`;

const WalletInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const WalletAddress = styled.div`
  font-family: monospace;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 6px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DisconnectButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Header: React.FC = () => {
  const location = useLocation();
  const { publicKey, isConnected, disconnectAccount } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/swap', label: 'Swap', icon: ArrowLeftRight },
    { path: '/location', label: 'Location', icon: MapPin },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo as={Link} to="/dashboard">
          <Wallet size={24} />
          XYZ Wallet
        </Logo>
        
        <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </MobileMenuButton>
        
        <Nav $isOpen={isMobileMenuOpen}>
          <CloseButton onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </CloseButton>
          
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              $isActive={location.pathname === path}
              onClick={handleNavClick}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </Nav>
        
        <WalletInfo>
          {isConnected && publicKey ? (
            <>
              <WalletAddress title={publicKey}>
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </WalletAddress>
              <DisconnectButton onClick={disconnectAccount}>
                Disconnect
              </DisconnectButton>
            </>
          ) : (
            <div>No wallet connected</div>
          )}
        </WalletInfo>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
