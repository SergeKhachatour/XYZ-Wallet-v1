import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import styled from 'styled-components';
import { WalletProvider } from './contexts/WalletContext';
import { LocationProvider } from './contexts/LocationContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import Swap from './pages/Swap';
import Location from './pages/Location';
import Settings from './pages/Settings';
import TransactionComplete from './pages/TransactionComplete';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

function App() {
  return (
    <WalletProvider>
      <LocationProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AppContainer>
            <Header />
            <MainContent>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/location" element={<Location />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/transaction-complete" element={<TransactionComplete />} />
              </Routes>
            </MainContent>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </AppContainer>
        </Router>
      </LocationProvider>
    </WalletProvider>
  );
}

export default App;
