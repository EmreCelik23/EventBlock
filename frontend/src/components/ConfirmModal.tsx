import React, { useEffect, useState } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

// İkonlar
const WarningIcon = ({ size = 48 }: { size?: number }) => (
    <svg width={size} height={size} fill="none" stroke="#ef4444" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

export default function ConfirmModal({ isOpen, title, message, onClose, onConfirm, isLoading }: ConfirmModalProps) {
    // --- RESPONSIVE STATE ---
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isOpen) return null;

    return (
        <div style={overlayStyle}>
            <div
                style={{
                    ...modalStyle,
                    padding: isMobile ? '25px 20px' : '30px',
                    maxWidth: isMobile ? '90%' : '400px',
                    borderRadius: isMobile ? '20px' : '24px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{
                    ...iconBox,
                    width: isMobile ? '60px' : '80px',
                    height: isMobile ? '60px' : '80px',
                    marginBottom: isMobile ? '15px' : '20px'
                }}>
                    <WarningIcon size={isMobile ? 32 : 48} />
                </div>

                <h3 style={{
                    ...titleStyle,
                    fontSize: isMobile ? '18px' : '20px'
                }}>{title}</h3>

                <p style={{
                    ...messageStyle,
                    fontSize: isMobile ? '13px' : '14px',
                    marginBottom: isMobile ? '20px' : '30px'
                }}>{message}</p>

                <div style={buttonGroup}>
                    <button onClick={onClose} style={cancelBtn} disabled={isLoading}>
                        Vazgeç
                    </button>
                    <button onClick={onConfirm} style={confirmBtn} disabled={isLoading}>
                        {isLoading ? "İşleniyor..." : "Evet, İptal Et"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- STİLLER ---
const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
};

const modalStyle: React.CSSProperties = {
    backgroundColor: 'white',
    width: '100%', textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
};

const iconBox: React.CSSProperties = {
    borderRadius: '50%', backgroundColor: '#fef2f2',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
    boxShadow: '0 0 0 8px #fff1f2'
};

const titleStyle: React.CSSProperties = { margin: '0 0 10px', fontWeight: '800', color: '#1e293b' };
const messageStyle: React.CSSProperties = { margin: '0', color: '#64748b', lineHeight: '1.5' };

const buttonGroup: React.CSSProperties = { display: 'flex', gap: '12px' };

const cancelBtn: React.CSSProperties = {
    flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0',
    backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '14px',
    transition: '0.2s'
};

const confirmBtn: React.CSSProperties = {
    flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
    backgroundColor: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', transition: '0.2s'
};