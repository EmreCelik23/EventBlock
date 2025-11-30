import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { shortenAddress } from '../utils';
import { CHAIN_ID, CHAIN_HEX_ID, CHAIN_NAME, SEPOLIA_RPC_URL, BLOCK_EXPLORER_URL } from '../config';

// --- SENİN ORİJİNAL RENKLERİN ---
const PRIMARY_COLOR = '#a29bfe'; 
const SECONDARY_COLOR = '#6c5ce7'; 
const ACCENT_RED = '#ff6b6b';

// --- İKONLAR ---
const ScanIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{marginRight:'6px'}}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>;

interface NavbarProps {
    onVerifyClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onVerifyClick }) => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHoveringConnect, setIsHoveringConnect] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    checkWallet();
    if ((window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', () => window.location.reload());
      (window as any).ethereum.on('accountsChanged', checkWallet);
    }
  }, []);

  const checkWallet = async () => {
    if ((window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      setIsWrongNetwork(network.chainId !== BigInt(CHAIN_ID));
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) setWalletAddress(accounts[0].address);
    }
  };

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        checkWallet();
      } catch (error) { console.error(error); }
    } else { alert("MetaMask yükleyin!"); }
  };

  const switchNetwork = async () => {
  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_HEX_ID }],
    });
  } catch (e: any) {
    if (e.code === 4902) {
      await (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: CHAIN_HEX_ID,
            chainName: CHAIN_NAME,
            rpcUrls: [SEPOLIA_RPC_URL],
            nativeCurrency: {
              name: 'SepoliaETH',
              symbol: 'SepoliaETH',
              decimals: 18,
            },
            blockExplorerUrls: [BLOCK_EXPLORER_URL],
          },
        ],
      });
    } else {
      console.error(e);
    }
  }
};

  // Link stil fonksiyonu
  const getLinkStyle = (path: string): React.CSSProperties => {
    const isActive = location.pathname === path;
    return { 
        ...linkStyle, 
        color: isActive ? 'white' : '#888',
        borderBottom: isActive ? `2px solid ${PRIMARY_COLOR}` : '2px solid transparent',
        textShadow: isActive ? `0 0 10px ${PRIMARY_COLOR}33` : 'none',
        paddingBottom: '4px'
    };
  };

  // 🔥 GÜNCELLENMİŞ GRADİENT AYARI
  // Solda tam siyah (#000000) başlayıp, sağa doğru eski hafif şeffaf yapıya geçiyor.
  const dynamicNavStyle: React.CSSProperties = {
    ...navStyle,
    background: scrolled 
        ? 'rgba(0, 0, 0, 0.95)' // Scroll edildiğinde neredeyse tam siyah
        : 'linear-gradient(to right, #000000 0%, rgba(5, 5, 5, 0.9) 30%, rgba(10, 10, 10, 0.7) 100%)', // Sayfa başındayken soldan sağa açılan gradient
    backdropFilter: scrolled ? 'blur(20px)' : 'blur(12px)',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
  };

  return (
    <nav style={dynamicNavStyle}>
      <div style={containerStyle}>
        
        {/* 1. LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <h2 style={brandStyle}>Event<span style={{color:PRIMARY_COLOR}}>Block</span></h2>
          </Link>
        </div>
        
        {/* 2. ORTA MENÜ */}
        <div style={menuStyle}>
          <Link to="/" style={getLinkStyle('/')}>Ana Sayfa</Link>
          <Link to="/create" style={getLinkStyle('/create')}>Etkinlik Oluştur</Link>
          <Link to="/my-tickets" style={getLinkStyle('/my-tickets')}>Biletlerim</Link>
          <Link to="/dashboard" style={getLinkStyle('/dashboard')}>Panelim</Link>
        </div>

        {/* 3. SAĞ TARAF (Kontrol & Cüzdan) */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            
            {/* Kontrol Butonu */}
            <button onClick={onVerifyClick} style={verifyBtnStyle}>
                <ScanIcon /> Kontrol
            </button>

            {/* Cüzdan Butonu */}
            {isWrongNetwork ? (
            <button onClick={switchNetwork} style={wrongNetworkBtnStyle}>
                <span style={{marginRight:'5px'}}>⚠️</span> Yanlış Ağ
            </button>
            ) : (
            <button 
                onClick={connectWallet}
                onMouseEnter={() => setIsHoveringConnect(true)}
                onMouseLeave={() => setIsHoveringConnect(false)}
                style={walletAddress 
                    ? connectedBtnStyle 
                    : { 
                        ...connectBtnStyle, 
                        transform: isHoveringConnect ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isHoveringConnect ? '0 8px 25px rgba(108, 92, 231, 0.6)' : '0 6px 20px rgba(108, 92, 231, 0.4)'
                      }}
            >
                {walletAddress ? (
                    <>
                        <div style={onlineDot}></div>
                        {shortenAddress(walletAddress)}
                    </>
                ) : (
                    <>Cüzdan Bağla <span style={{marginLeft:'5px'}}>🦊</span></>
                )}
            </button>
            )}
        </div>
      </div>
    </nav>
  );
};

// -----------------------------------------------------------------------------------------
// --- STYLES ---
// -----------------------------------------------------------------------------------------

const navStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 1000,
  width: '100%', transition: 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)', // Geçiş süresini biraz artırdım daha yumuşak olsun
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

const containerStyle: React.CSSProperties = {
    maxWidth: '1400px', margin: '0 auto', padding: '14px 30px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const brandStyle: React.CSSProperties = {
    margin: 0, fontSize: '26px', fontWeight: '900', letterSpacing: '-0.8px', color: 'white',
    fontFamily: '"Inter", sans-serif'
};

const menuStyle: React.CSSProperties = {
    display: 'flex', gap: '35px', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)', 
    padding: '10px 30px', 
    borderRadius: '50px',
    boxShadow: `0 0 1px ${PRIMARY_COLOR}88, inset 0 0 1px ${PRIMARY_COLOR}88`,
    border: '1px solid transparent', 
    transition: 'all 0.3s'
};

const linkStyle: React.CSSProperties = {
    textDecoration: 'none', fontWeight: '600', fontSize: '15px',
    letterSpacing: '0.2px', transition: 'color 0.3s, border-bottom 0.3s'
};

// Kontrol Butonu
const verifyBtnStyle: React.CSSProperties = {
    background: 'rgba(255, 107, 107, 0.1)', 
    border: `1px solid ${ACCENT_RED}44`,
    cursor: 'pointer',
    color: ACCENT_RED, 
    fontWeight: '700', fontSize: '13px',
    padding: '8px 16px', borderRadius: '20px',
    display: 'flex', alignItems: 'center',
    transition: 'all 0.2s',
};

// Cüzdan Butonları
const connectBtnStyle: React.CSSProperties = {
    padding: '10px 24px', border: 'none', borderRadius: '25px',
    background: `linear-gradient(105deg, ${SECONDARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`,
    color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
    boxShadow: '0 6px 20px rgba(108, 92, 231, 0.4)', 
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    display: 'flex', alignItems: 'center'
};

const connectedBtnStyle: React.CSSProperties = {
    padding: '10px 18px', 
    border: `1px solid ${PRIMARY_COLOR}`, 
    borderRadius: '25px',
    backgroundColor: `${PRIMARY_COLOR}15`,
    color: 'white', 
    fontWeight: '600', fontSize: '14px',
    display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: `0 0 15px ${PRIMARY_COLOR}55`
};

const wrongNetworkBtnStyle: React.CSSProperties = {
    padding: '10px 20px', border: 'none', borderRadius: '25px',
    backgroundColor: ACCENT_RED, color: 'white', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center',
    boxShadow: '0 4px 15px rgba(255, 71, 87, 0.4)',
    animation: 'pulse 1.5s infinite'
};

const onlineDot: React.CSSProperties = {
    width: '8px', height: '8px', backgroundColor: '#00b894', borderRadius: '50%',
    boxShadow: '0 0 8px #00b894'
};

export default Navbar;