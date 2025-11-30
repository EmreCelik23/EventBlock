import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

// İkonlar
const WarningIcon = () => <svg width="48" height="48" fill="none" stroke="#ef4444" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

export default function ConfirmModal({ isOpen, title, message, onClose, onConfirm, isLoading }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={iconBox}>
                    <WarningIcon />
                </div>
                
                <h3 style={titleStyle}>{title}</h3>
                <p style={messageStyle}>{message}</p>

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
    backgroundColor: 'white', padding: '30px', borderRadius: '24px',
    width: '100%', maxWidth: '400px', textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
};

const iconBox: React.CSSProperties = {
    width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fef2f2',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
    boxShadow: '0 0 0 8px #fff1f2'
};

const titleStyle: React.CSSProperties = { margin: '0 0 10px', fontSize: '20px', fontWeight: '800', color: '#1e293b' };
const messageStyle: React.CSSProperties = { margin: '0 0 30px', fontSize: '14px', color: '#64748b', lineHeight: '1.5' };

const buttonGroup: React.CSSProperties = { display: 'flex', gap: '12px' };

const cancelBtn: React.CSSProperties = {
    flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0',
    backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize:'14px',
    transition: '0.2s'
};

const confirmBtn: React.CSSProperties = {
    flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
    backgroundColor: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize:'14px',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', transition: '0.2s'
};