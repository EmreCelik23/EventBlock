import React, { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ethers } from 'ethers';
import { EVENT_ABI } from '../config';

// --- İKONLAR ---
const ShieldCheckIcon = () => <svg width="72" height="72" fill="none" stroke="#10b981" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const ShieldXIcon = () => <svg width="72" height="72" fill="none" stroke="#ef4444" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="15" y1="9" x2="9" y2="15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="9" y1="9" x2="15" y2="15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const ScanFrameIcon = () => <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 7V4h3" /><path d="M20 7V4h-3" /><path d="M4 17v3h3" /><path d="M20 17v3h-3" /></svg>;
const ReloadIcon = () => <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>;
const CloseIcon = () => <svg width="24" height="24" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

interface VerifyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VerifyModal({ isOpen, onClose }: VerifyModalProps) {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [scanData, setScanData] = useState<{ user: string, event: string } | null>(null);
    const [message, setMessage] = useState("");
    const [isScanning, setIsScanning] = useState(true);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => resetScanner(), 300);
        } else {
            setIsScanning(true);
        }
    }, [isOpen]);

    const handleScan = (result: any) => {
        const rawValue = result?.[0]?.rawValue || result?.rawValue;
        if (!isScanning || status !== "idle" || !rawValue) return;
        setIsScanning(false);
        verifyTicket(rawValue);
    };

    const verifyTicket = async (qrRawData: string) => {
        try {
            setStatus("loading");
            setMessage("İmza ve veriler çözümleniyor...");

            // 1. QR Verisini Parse Et
            let data;
            try {
                data = JSON.parse(qrRawData);
            } catch (e) {
                throw new Error("Geçersiz QR Formatı");
            }

            const { addr, usr, sig, ts } = data;
            if (!addr || !usr || !sig || !ts) throw new Error("Eksik veri!");

            // 2. Zaman Aşımı Kontrolü (QR 1 dk geçerli)
            if (Date.now() - ts > 60000)
                throw new Error("QR Kodun süresi dolmuş. Yenileyin.");

            // 3. İmza Doğrulama (Off-Chain)
            const recoveredAddr = ethers.verifyMessage(
                `LOGIN_REQ|${addr}|${ts}`,
                sig
            );
            if (recoveredAddr.toLowerCase() !== usr.toLowerCase()) {
                throw new Error("İmza geçersiz! (Sahte QR)");
            }

            // 4. Blokzincir Bağlantısı (On-Chain)
            setMessage("Blokzincirde bilet doğrulanıyor...");

            const provider = new ethers.BrowserProvider(
                (window as any).ethereum
            );
            const signer = await provider.getSigner();
            const eventContract = new ethers.Contract(addr, EVENT_ABI, signer);

            // ✅ Önce read-only kontroller
            const hasTicket = await eventContract.hasTicket(usr);
            if (!hasTicket) {
                throw new Error("Bu kullanicinin bileti yok");
            }

            const alreadyUsed = await eventContract.isTicketUsed(usr);
            if (alreadyUsed) {
                throw new Error("Bilet zaten kullanilmis");
            }

            // 5. 🔥 useTicket fonksiyonunu çağırıyoruz (tek kullanımlık işaretleme)
            setMessage("Lütfen cüzdandan işlemi onaylayın... 🦊");
            const tx = await eventContract.useTicket(usr);

            setMessage("İşlem blokzincire işleniyor... ⏳");
            await tx.wait();

            // 6. Başarılı! Etkinlik adını da alalım
            const eventName = await eventContract.name();

            setScanData({ user: usr, event: eventName });
            setStatus("success");
            setMessage("Bilet başarıyla doğrulandı!");

        } catch (error: any) {
            console.error(error);
            setStatus("error");

            let errText = error.reason || error.message || "Bilinmeyen Hata";

            if (errText.includes("kullanilmis"))
                errText = "BU BİLET DAHA ÖNCE KULLANILMIŞ!";
            else if (errText.includes("bileti yok"))
                errText = "❌ Bu cüzdanın bileti yok.";
            else if (errText.includes("organizator"))
                errText = "🚫 Yetkisiz! Sadece organizatör okutabilir.";
            else if (errText.includes("iptal"))
                errText = "⛔️ Etkinlik iptal edilmiş.";
            else if (errText.includes("rejected"))
                errText = "İşlem reddedildi.";

            setMessage(errText);
        }
    };

    const resetScanner = () => {
        setScanData(null);
        setStatus("idle");
        setMessage("");
        setIsScanning(true);
    };

    if (!isOpen) return null;

    return (
        <div style={overlayStyle} onClick={onClose}>
            <style>{`
                @keyframes scanBeam { 0% { top: 0%; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
                @keyframes popInModal { 0% { transform: scale(0.95) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
                @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
                .spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #6366f1; borderRadius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>

            <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>

                <button onClick={onClose} style={closeButtonStyle}>
                    <CloseIcon />
                </button>

                {/* HEADER */}
                <div style={headerContainer}>
                    <div style={headerIconBox}>
                        <ScanFrameIcon />
                    </div>
                    <div>
                        <h2 style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Terminal</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Giriş için QR okutunuz.</p>
                    </div>
                </div>

                {/* CONTENT */}
                <div style={contentAreaStyle}>

                    {/* SCANNER AREA */}
                    {status === "idle" && (
                        <div style={scannerWrapper}>
                            <div style={videoContainer}>
                                <Scanner
                                    onScan={handleScan}
                                    components={{ finder: false }}
                                    styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
                                />
                                {/* 🔥 VİZÖR ARTIK TAM KARE (Square) */}
                                <div style={darkOverlay}>
                                    <div style={clearHoleSquare}>
                                        <div style={scanLaser}></div>
                                        <div style={cornerTL}></div><div style={cornerTR}></div>
                                        <div style={cornerBL}></div><div style={cornerBR}></div>
                                    </div>
                                </div>
                            </div>
                            <div style={activeStatusPill}>
                                <div style={pulsingDot}></div>
                                <span>Sistem Hazır</span>
                            </div>
                        </div>
                    )}

                    {/* DİĞER DURUMLAR */}
                    {status === "loading" && (
                        <div style={resultStateContainer}>
                            <div className="spinner"></div>
                            <h3 style={{ margin: '20px 0 5px', fontSize: '16px', color: '#1e293b' }}>Doğrulanıyor</h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{message}</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div style={resultStateContainer}>
                            <div style={{ marginBottom: '15px', animation: 'popInModal 0.4s' }}><ShieldCheckIcon /></div>
                            <h2 style={{ color: '#10b981', margin: '0 0 5px', fontSize: '24px', fontWeight: '800' }}>Onaylandı</h2>
                            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Giriş İzni Verildi</p>

                            <div style={ticketCard}>
                                <div style={ticketRow}>
                                    <span style={ticketLabel}>Etkinlik</span>
                                    <span style={ticketValue}>{scanData?.event}</span>
                                </div>
                                <div style={divider}></div>
                                <div style={ticketRow}>
                                    <span style={ticketLabel}>Katılımcı</span>
                                    <span style={ticketValueMono}>{scanData?.user.substring(0, 6)}...</span>
                                </div>
                            </div>

                            <button onClick={resetScanner} style={successBtn}>
                                <ReloadIcon /> Sonraki
                            </button>
                        </div>
                    )}

                    {status === "error" && (
                        <div style={resultStateContainer}>
                            <div style={{ marginBottom: '10px', animation: 'shake 0.4s' }}><ShieldXIcon /></div>
                            <h2 style={{ color: '#ef4444', margin: '0 0 5px', fontSize: '24px', fontWeight: '800' }}>Reddedildi</h2>
                            <div style={errorBox}>
                                <p style={{ margin: 0, color: '#b91c1c', fontWeight: '600', fontSize: '13px' }}>{message}</p>
                            </div>
                            <button onClick={resetScanner} style={errorBtn}>Tekrar Dene</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------------
// --- CSS STİLLERİ ---
// -----------------------------------------------------------------------------

const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(12px)',
    zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px 10px'
};

const modalCardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '500px', // Genişlik iyi
    height: '700px',     // Uzun Dikdörtgen Formu
    maxHeight: '90vh',
    backgroundColor: 'white',
    borderRadius: '36px',
    padding: '35px',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 40px 80px -20px rgba(0,0,0,0.6)',
    position: 'relative',
    animation: 'popInModal 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex', flexDirection: 'column', gap: '25px'
};

const closeButtonStyle: React.CSSProperties = {
    position: 'absolute', top: '25px', right: '25px',
    background: '#f1f5f9', border: 'none', cursor: 'pointer',
    color: '#64748b', padding: '10px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: '0.2s', zIndex: 50
};

const headerContainer: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9'
};

const headerIconBox: React.CSSProperties = {
    width: '52px', height: '52px', borderRadius: '16px',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.3)', color: 'white'
};

const contentAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    position: 'relative'
};

// SCANNER WRAPPER - YÜKSEKLİĞİ ARTTIRILDI
const scannerWrapper: React.CSSProperties = {
    flex: 1, // Kalan alanı doldur
    width: '100%',
    minHeight: '400px', // 🔥 Kamera alanı genişletildi
    borderRadius: '28px', overflow: 'hidden', position: 'relative',
    backgroundColor: '#0f172a',
    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
    display: 'flex', flexDirection: 'column'
};

const videoContainer: React.CSSProperties = { width: '100%', height: '100%', position: 'relative' };

const darkOverlay: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10
};

// 🔥 TAM KARE VİZÖR
const clearHoleSquare: React.CSSProperties = {
    width: '280px',
    height: '280px', // 1:1 Oran (Kare) - QR için en iyisi
    position: 'relative',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
    borderRadius: '24px'
};

const scanLaser: React.CSSProperties = {
    position: 'absolute', left: 0, right: 0, height: '2px',
    background: 'linear-gradient(90deg, transparent 0%, #6366f1 50%, transparent 100%)',
    boxShadow: '0 0 15px 2px rgba(99, 102, 241, 0.8)',
    animation: 'scanBeam 2s ease-in-out infinite'
};

const cStyle: React.CSSProperties = { position: 'absolute', width: '35px', height: '35px', borderColor: 'white', borderStyle: 'solid', borderWidth: '4px', borderRadius: '8px', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' };
const cornerTL: React.CSSProperties = { ...cStyle, top: '-2px', left: '-2px', borderRight: 'none', borderBottom: 'none' };
const cornerTR: React.CSSProperties = { ...cStyle, top: '-2px', right: '-2px', borderLeft: 'none', borderBottom: 'none' };
const cornerBL: React.CSSProperties = { ...cStyle, bottom: '-2px', left: '-2px', borderRight: 'none', borderTop: 'none' };
const cornerBR: React.CSSProperties = { ...cStyle, bottom: '-2px', right: '-2px', borderLeft: 'none', borderTop: 'none' };

const activeStatusPill: React.CSSProperties = {
    position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)',
    backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
    padding: '8px 16px', borderRadius: '20px',
    color: 'white', fontSize: '12px', fontWeight: '600',
    display: 'flex', alignItems: 'center', gap: '8px', zIndex: 20, border: '1px solid rgba(255,255,255,0.1)'
};

const pulsingDot: React.CSSProperties = { width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulseRing 1.5s infinite' };

const resultStateContainer: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: '20px'
};

const ticketCard: React.CSSProperties = {
    width: '100%', backgroundColor: '#f8fafc', padding: '18px', borderRadius: '18px',
    border: '1px solid #e2e8f0', marginBottom: '25px'
};

const ticketRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const ticketLabel: React.CSSProperties = { fontSize: '14px', color: '#64748b', fontWeight: '600' };
const ticketValue: React.CSSProperties = { fontSize: '15px', color: '#1e293b', fontWeight: '700' };
const ticketValueMono: React.CSSProperties = { ...ticketValue, fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '6px' };
const divider: React.CSSProperties = { height: '1px', backgroundColor: '#e2e8f0', margin: '12px 0' };

const errorBox: React.CSSProperties = {
    backgroundColor: '#fef2f2', padding: '15px', borderRadius: '14px',
    border: '1px solid #fee2e2', marginBottom: '20px', width: '100%'
};

const successBtn: React.CSSProperties = {
    width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    boxShadow: '0 8px 20px -5px rgba(16, 185, 129, 0.4)', transition: 'transform 0.2s'
};

const errorBtn: React.CSSProperties = {
    width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
    backgroundColor: '#f1f5f9', color: '#ef4444', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
};