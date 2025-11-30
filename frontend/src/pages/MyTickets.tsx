import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { FACTORY_ADDRESS, FACTORY_ABI, EVENT_ABI } from '../config';

// --- TİP TANIMLARI ---
interface Ticket {
    eventAddress: string;
    eventName: string;
    image: string;
    date: string;
    time: string;
    location: string;
    mapsLink: string;
    price: string;
    isCancelled: boolean;
    isUsed: boolean;
}

interface QRDataState {
    payload: string;
    eventName: string;
    ticket: Ticket;
    expiresAt: number;
}

const ICON_COLOR = '#e91e63';

export default function MyTickets() {
    const [allTickets, setAllTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [qrDataState, setQrDataState] = useState<QRDataState | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const navigate = useNavigate();
    const timerRef = useRef<any>(null);

    // --- HELPER: GEÇMİŞ KONTROLÜ ---
    const isEventPast = (dateStr: string, timeStr: string) => {
        if (!dateStr || !timeStr) return false;
        const now = new Date();
        const eventDate = new Date(`${dateStr}T${timeStr}`);
        return now > eventDate;
    };

    // --- 🔥 GÜNCELLENMİŞ FİLTRELEME MANTIĞI ---
    const filteredTickets = useMemo(() => {
        if (activeTab === 'active') {
            // AKTİF: Gelecek tarihli VE İptal Edilmemiş
            return allTickets.filter(t => !isEventPast(t.date, t.time) && !t.isCancelled);
        } else {
            // GEÇMİŞ: Tarihi Geçmiş VEYA İptal Edilmiş
            return allTickets.filter(t => isEventPast(t.date, t.time) || t.isCancelled);
        }
    }, [allTickets, activeTab]);

    const activeCount = allTickets.filter(t => !isEventPast(t.date, t.time) && !t.isCancelled).length;

    const getCleanMapLink = (url: string) => {
        if (!url) return '';
        const coordRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
        if (coordRegex.test(url.trim())) return `https://www.google.com/maps?q=${url.trim().replace(/\s/g, '')}`;
        if (url.includes('googleusercontent') || url.includes('maps.google.com/10')) {
            const match = url.match(/(maps\.google\.com.*|goo\.gl.*)/);
            if (match) return `https://${match[0]}`;
        }
        if (!url.startsWith('http')) return `https://${url}`;
        return url;
    };

    const formatDateTR = (dateStr: string) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    };

    useEffect(() => {
        if ((window as any).ethereum) {
            (window as any).ethereum.on('accountsChanged', () => window.location.reload());
        }
        findMyTickets();
    }, []);

    // --- SAYAÇ ---
    useEffect(() => {
        if (qrDataState) {
            setTimeLeft(30);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } else { clearInterval(timerRef.current); }
        return () => clearInterval(timerRef.current);
    }, [qrDataState]);

    // --- VERİ ÇEKME ---
    const findMyTickets = async () => {
        try {
            if (!(window as any).ethereum) return;
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
            const deployedEvents = await factory.getDeployedEvents();
            const ticketsFound: Ticket[] = [];

            for (const address of deployedEvents) {
                try {
                    const eventContract = new ethers.Contract(address, EVENT_ABI, provider);
                    const hasTicket = await eventContract.hasTicket(userAddress);
                    if (hasTicket) {
                        const [name, image, date, time, price, isCancelled, isUsed] = await Promise.all([
                            eventContract.name(), eventContract.imageURL(), eventContract.date(), eventContract.time(),
                            eventContract.price(), eventContract.isCancelled(), eventContract.isTicketUsed(userAddress)
                        ]);
                        let location = "Konum Bilgisi Yok", mapsLink = "";
                        try {
                            const locName = await eventContract.locationName();
                            const city = await eventContract.city();
                            location = locName ? `${locName}, ${city}` : city;
                            mapsLink = await eventContract.mapsLink();
                        } catch (e) { }

                        ticketsFound.push({
                            eventAddress: address, eventName: name, image, date, time,
                            location, mapsLink: getCleanMapLink(mapsLink),
                            price: ethers.formatEther(price), isCancelled, isUsed
                        });
                    }
                } catch (innerError) { console.error("Hata:", address); }
            }
            setAllTickets(ticketsFound);
        } catch (error) { console.error("Genel Hata:", error); } finally { setLoading(false); }
    };

    // --- QR & İADE ---
    const generateQR = async (ticket: Ticket) => {
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const timestamp = Date.now();
            const message = `LOGIN_REQ|${ticket.eventAddress}|${timestamp}`;
            const signature = await signer.signMessage(message);

            const qrPayload = JSON.stringify({
                addr: ticket.eventAddress,
                usr: await signer.getAddress(),
                sig: signature,
                ts: timestamp
            });

            setQrDataState({ payload: qrPayload, eventName: ticket.eventName, ticket: ticket, expiresAt: timestamp + 30000 });
        } catch (error) { toast.error("İmza reddedildi."); }
    };

    const getRefund = async (eventAddress: string) => {
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const eventContract = new ethers.Contract(eventAddress, EVENT_ABI, signer);
            const confirm = window.confirm("Biletinizi iade edip ücretini geri almak istiyor musunuz?");
            if (!confirm) return;
            const tx = await eventContract.getRefund();
            toast.info("İade işlemi gönderildi... ⏳");
            await tx.wait();
            toast.success("✅ İade başarılı!");
            window.location.reload();
        } catch (err: any) { toast.error("Hata: " + (err.reason || "İşlem başarısız")); }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b' }}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>🎟️</div>
            <h3>Cüzdanın Taranıyor...</h3>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            paddingBottom: '80px',
            fontFamily: "'Inter', sans-serif"
        }}>

            {/* HEADER */}
            <div style={{ padding: '60px 0 20px' }}>
                <div style={containerStyle}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '36px', color: '#0f172a', fontWeight: '900', letterSpacing: '-1.5px' }}>Cüzdanım</h1>
                        <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '16px', fontWeight: '400' }}>Tüm etkinlik giriş anahtarların burada.</p>
                    </div>
                </div>
            </div>

            <div style={containerStyle}>

                {/* TABS */}
                <div style={tabsContainerStyle}>
                    <div
                        style={activeTab === 'active' ? activeTabStyle : inactiveTabStyle}
                        onClick={() => setActiveTab('active')}
                    >
                        Aktif Biletler
                        {activeCount > 0 && <span style={tabBadgeStyle}>{activeCount}</span>}
                        {activeTab === 'active' && <div style={activeTabIndicator}></div>}
                    </div>

                    <div
                        style={activeTab === 'past' ? activeTabStyle : inactiveTabStyle}
                        onClick={() => setActiveTab('past')}
                    >
                        Geçmiş
                        {activeTab === 'past' && <div style={activeTabIndicator}></div>}
                    </div>

                    <div style={dividerLineStyle}></div>
                </div>

                {/* LİSTE */}
                {filteredTickets.length === 0 ? (
                    <div style={emptyStateStyle}>
                        <div style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.6 }}>
                            {activeTab === 'active' ? '🎫' : '🕰️'}
                        </div>
                        <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>
                            {activeTab === 'active' ? 'Aktif biletin yok.' : 'Geçmiş etkinlik yok.'}
                        </h2>
                        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 30px', lineHeight: '1.6' }}>
                            {activeTab === 'active'
                                ? 'Dünyanın en iyi etkinliklerine katılmak için hemen bilet al.'
                                : 'Katıldığın veya iptal edilen etkinlikler burada listelenir.'}
                        </p>
                        {activeTab === 'active' && (
                            <button onClick={() => navigate('/')} style={primaryBtnStyle}>🚀 Etkinlikleri Keşfet</button>
                        )}
                    </div>
                ) : (
                    <div style={gridStyle}>
                        {filteredTickets.map((ticket, index) => {
                            // İptal edilmiş veya geçmiş tarihli biletler "Pasif" görünecek
                            const isPastItem = activeTab === 'past';

                            return (
                                <div key={index} style={{
                                    ...ticketCardStyle,
                                    filter: isPastItem ? 'grayscale(100%) opacity(0.8)' : 'none', // Siyah-beyaz efekt
                                    borderColor: isPastItem ? '#e2e8f0' : 'white'
                                }}>
                                    <div style={ticketLeftStyle}>
                                        <img src={ticket.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.target as any).src = 'https://via.placeholder.com/150'} />
                                        <div style={overlayGradient}></div>
                                        <div style={dateOverlay}>
                                            <span style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1' }}>{ticket.date.split('-')[2]}</span>
                                            <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>{new Date(ticket.date).toLocaleString('tr-TR', { month: 'short' })}</span>
                                        </div>
                                    </div>

                                    <div style={ticketRightStyle}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                {ticket.isCancelled ? (
                                                    <span style={cancelledTag}>İPTAL EDİLDİ</span>
                                                ) : ticket.isUsed ? (
                                                    <span style={usedTag}>KULLANILDI</span>
                                                ) : isEventPast(ticket.date, ticket.time) ? (
                                                <span style={pastTag}>GEÇMİŞ</span>
                                                ) : (
                                                <span style={activeTag}>AKTİF</span>
)}
                                                <span style={priceTag}>{ticket.price} ETH</span>
                                            </div>
                                            <h3 style={ticketTitle}>{ticket.eventName}</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                                <p style={ticketInfo}>📍 {ticket.location.length > 25 ? ticket.location.substring(0, 25) + '...' : ticket.location}</p>
                                                <p style={ticketInfo}>⏰ {ticket.time}</p>
                                            </div>
                                        </div>

                                        <div style={actionRow}>
                                            {ticket.isCancelled ? (
                                                // İPTAL EDİLDİYSE -> İADE AL
                                                <button onClick={() => getRefund(ticket.eventAddress)} style={refundBtnStyle}>💸 İade Al</button>
                                            ) : isPastItem ? (
                                                // SADECE GEÇMİŞSE -> DETAY
                                                <button onClick={() => setSelectedTicket(ticket)} style={{ ...detailBtnStyle, width: '100%' }}>ETKİNLİK DETAYI</button>
                                            ) : (
                                                // AKTİFSE -> QR VE DETAY
                                                <>
                                                    <button onClick={() => generateQR(ticket)} style={qrBtnStyle}>QR KOD</button>
                                                    <button onClick={() => setSelectedTicket(ticket)} style={detailBtnStyle}>DETAY</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div style={notchTop}></div>
                                    <div style={notchBottom}></div>
                                    <div style={dashedLine}></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- QR MODAL --- */}
            {qrDataState && (
                <div style={modalOverlay}>
                    <div style={qrModalContent}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: '700' }}>Güvenli Giriş</h3>
                            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: '500' }}>{qrDataState.eventName}</p>
                        </div>
                        <div style={timerBarStyle}>
                            <div style={{ height: '100%', width: `${(timeLeft / 30) * 100}%`, backgroundColor: timeLeft < 10 ? '#ef4444' : '#10b981', transition: 'width 1s linear', borderRadius: '4px' }}></div>
                        </div>
                        <div style={qrBoxStyle}>
                            <QRCode value={qrDataState.payload} size={280} style={{ width: '100%', height: 'auto', maxWidth: '100%' }} />
                        </div>
                        {timeLeft === 0 && (
                            <div style={expiredOverlay}>
                                <p style={{ color: '#1e293b', fontWeight: '800', marginBottom: '15px', fontSize: '18px' }}>Süre Doldu</p>
                                <button onClick={() => generateQR(qrDataState.ticket)} style={refreshBtn}>🔄 Yenile</button>
                            </div>
                        )}
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '20px' }}>Bu kod güvenlik için her 30 saniyede bir yenilenir.</p>
                        <button onClick={() => setQrDataState(null)} style={closeModalBtn}>Kapat</button>
                    </div>
                </div>
            )}

            {/* DETAY MODAL */}
            {selectedTicket && (
                <div style={modalOverlay} onClick={() => setSelectedTicket(null)}>
                    <div style={detailModalContent} onClick={e => e.stopPropagation()}>
                        <img src={selectedTicket.image} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                        <div style={{ padding: '25px' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '15px', fontSize: '22px', color: '#1e293b' }}>{selectedTicket.eventName}</h2>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <span style={tagStyle}>📅 {formatDateTR(selectedTicket.date)}</span>
                                <span style={tagStyle}>⏰ {selectedTicket.time}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>Etkinlik Konumu</p>
                            <p style={{ margin: 0, color: '#334155', lineHeight: '1.5', fontSize: '15px', marginBottom: '20px' }}>{selectedTicket.location}</p>

                            {selectedTicket.mapsLink && (
                                <a href={selectedTicket.mapsLink} target="_blank" rel="noreferrer" style={mapsLinkBtn}>
                                    📍 Haritada Göster
                                </a>
                            )}
                        </div>
                        <button onClick={() => setSelectedTicket(null)} style={detailCloseBtn}>✕</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// -----------------------------------------------------------------------------
// --- STİLLER ---
// -----------------------------------------------------------------------------

const containerStyle: React.CSSProperties = { maxWidth: '1100px', margin: '0 auto', padding: '0 25px' };
const tabsContainerStyle: React.CSSProperties = { display: 'flex', gap: '30px', position: 'relative', marginBottom: '40px' };
const dividerLineStyle: React.CSSProperties = { position: 'absolute', bottom: '0', left: '0', right: '0', height: '1px', backgroundColor: '#e2e8f0', zIndex: 1 };
const activeTabStyle: React.CSSProperties = { position: 'relative', paddingBottom: '15px', fontSize: '15px', fontWeight: '700', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2, userSelect: 'none' };
const activeTabIndicator: React.CSSProperties = { position: 'absolute', bottom: '0', left: '0', right: '0', height: '3px', borderRadius: '3px 3px 0 0', backgroundColor: ICON_COLOR };
const tabBadgeStyle: React.CSSProperties = { backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' };
const inactiveTabStyle: React.CSSProperties = { paddingBottom: '15px', fontSize: '15px', fontWeight: '500', color: '#94a3b8', cursor: 'pointer', zIndex: 2, userSelect: 'none' };
const primaryBtnStyle: React.CSSProperties = { backgroundColor: ICON_COLOR, color: 'white', border: 'none', padding: '15px 35px', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(233, 30, 99, 0.3)', transition: '0.2s' };
const emptyStateStyle: React.CSSProperties = { textAlign: 'center', backgroundColor: 'white', borderRadius: '24px', padding: '80px 20px', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "30px" };
const ticketCardStyle: React.CSSProperties = { display: 'flex', height: '220px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', transition: '0.3s', cursor: 'default', border: '1px solid #f8fafc' };
const ticketLeftStyle: React.CSSProperties = { width: '140px', position: 'relative', flexShrink: 0 };
const overlayGradient: React.CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,0.8) 100%)' };
const dateOverlay: React.CSSProperties = { position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center', color: 'white', display: 'flex', flexDirection: 'column', textShadow: '0 2px 4px rgba(0,0,0,0.5)' };
const ticketRightStyle: React.CSSProperties = { flex: 1, padding: '22px 22px 22px 35px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' };
const ticketTitle: React.CSSProperties = { margin: '0', fontSize: '17px', fontWeight: '800', color: '#0f172a', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' };
const ticketInfo: React.CSSProperties = { margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' };
const actionRow: React.CSSProperties = { display: 'flex', gap: '10px', marginTop: '10px' };
const qrBtnStyle: React.CSSProperties = { flex: 1, backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', padding: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.2s', letterSpacing: '0.5px' };
const detailBtnStyle: React.CSSProperties = { padding: '10px 18px', border: '1px solid #e2e8f0', backgroundColor: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#475569', transition: '0.2s' };
const refundBtnStyle: React.CSSProperties = { flex: 1, backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', padding: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const cancelledTag: React.CSSProperties = { backgroundColor: '#ef4444', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '0.5px' };
const activeTag: React.CSSProperties = { backgroundColor: '#10b981', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '0.5px' };
const pastTag: React.CSSProperties = { backgroundColor: '#94a3b8', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '0.5px' };
const usedTag: React.CSSProperties = { backgroundColor: '#f97316', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '0.5px'};
const priceTag: React.CSSProperties = { fontSize: '12px', fontWeight: '800', color: ICON_COLOR };
const dashedLine: React.CSSProperties = { position: 'absolute', left: '139px', top: '15px', bottom: '15px', borderLeft: '2px dashed #e2e8f0', zIndex: 2 };
const notchTop: React.CSSProperties = { position: 'absolute', left: '132px', top: '-12px', width: '16px', height: '24px', backgroundColor: '#fcfdfd', borderRadius: '12px', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.05)', zIndex: 3 };
const notchBottom: React.CSSProperties = { position: 'absolute', left: '132px', bottom: '-12px', width: '16px', height: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', zIndex: 3 };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(10px)' };
const qrModalContent: React.CSSProperties = { backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '36px', width: '100%', maxWidth: '450px', position: 'relative', boxShadow: '0 25px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' };
const closeModalBtn: React.CSSProperties = { marginTop: '25px', width: '100%', padding: '16px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: '0.2s' };
const timerBarStyle: React.CSSProperties = { width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginBottom: '25px', overflow: 'hidden' };
const qrBoxStyle: React.CSSProperties = { backgroundColor: 'white', padding: '30px', borderRadius: '28px', position: 'relative', marginBottom: '10px', display: 'flex', justifyContent: 'center', boxShadow: '0 15px 40px rgba(0,0,0,0.3)' };
const expiredOverlay: React.CSSProperties = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255,255,255,0.95)', padding: '30px', borderRadius: '24px', textAlign: 'center', width: '85%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' };
const refreshBtn: React.CSSProperties = { backgroundColor: ICON_COLOR, color: 'white', border: 'none', padding: '12px 30px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px', fontSize: '14px' };
const detailModalContent: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', width: '90%', maxWidth: '400px', position: 'relative', boxShadow: '0 30px 90px rgba(0,0,0,0.3)' };
const detailCloseBtn: React.CSSProperties = { position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const mapsLinkBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', padding: '14px', width: '100%', textAlign: 'center', backgroundColor: '#f8fafc', color: '#0f172a', textDecoration: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '14px', border: '1px solid #e2e8f0', transition: '0.2s', boxSizing: 'border-box' };
const tagStyle: React.CSSProperties = { fontSize: '12px', fontWeight: '700', color: ICON_COLOR, backgroundColor: '#fce4ec', padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' };