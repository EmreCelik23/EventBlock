import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FACTORY_ADDRESS, FACTORY_ABI, EVENT_ABI } from '../config';
import ConfirmModal from '../components/ConfirmModal';

interface MyEventData {
  address: string;
  name: string;
  price: string;
  soldCount: string;
  capacity: string;
  balance: string;
  isCancelled: boolean;
  image: string;
  eventTimestamp: number; // 🔥 Zaman damgası
}

// --- İKONLAR ---
const WalletIcon = () => <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7h-6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M13 13h6"/><path d="M13 17h6"/><path d="M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12"/></svg>;
const TicketIcon = () => <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 5v2"/><path d="M15 11v2"/><path d="M15 17v2"/><path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/></svg>;
const SettingsIcon = () => <svg width="32" height="32" fill="none" stroke="#1e293b" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const CopyIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;

// --- İSTATİSTİK KARTI ---
const StatCard = ({ title, value, unit, icon, colorStart, colorEnd }: any) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                backgroundColor: 'white', borderRadius: '24px', padding: '25px',
                boxShadow: isHovered ? '0 20px 40px -10px rgba(0,0,0,0.12)' : '0 10px 30px -10px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9', transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'relative', overflow: 'hidden'
            }}
        >
            <div style={{position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: `linear-gradient(135deg, ${colorStart}22, ${colorEnd}22)`, borderRadius: '50%', zIndex: 0}}></div>
            <div style={{position:'relative', zIndex:1}}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px', textTransform:'uppercase' }}>{title}</p>
                <h2 style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>{value} <span style={{ fontSize: '16px', fontWeight: '600', color: '#64748b' }}>{unit}</span></h2>
            </div>
            <div style={{width: '60px', height: '60px', borderRadius: '18px', background: `linear-gradient(135deg, ${colorStart} 10%, ${colorEnd} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 20px -5px ${colorStart}66`, position: 'relative', zIndex: 1}}>{icon}</div>
        </div>
    );
};

export default function MyEvents() {
  const [myEvents, setMyEvents] = useState<MyEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedEventAddr, setSelectedEventAddr] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => { fetchMyEvents(); }, []);

  const fetchMyEvents = async () => {
    try {
      if (!(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const myAddress = await signer.getAddress();
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const deployedEvents = await factory.getDeployedEvents();

      const filteredEvents: MyEventData[] = [];
      let revenue = 0;
      let tickets = 0;

      for (const address of deployedEvents) {
        const eventContract = new ethers.Contract(address, EVENT_ABI, provider);
        const organizer = await eventContract.organizer();

        if (organizer.toLowerCase() === myAddress.toLowerCase()) {
            const [name, price, soldCount, capacity, balance, image, eventTimestamp] = await Promise.all([
                eventContract.name(), 
                eventContract.price(), 
                eventContract.soldCount(),
                eventContract.capacity(), 
                provider.getBalance(address), 
                eventContract.imageURL(),
                eventContract.eventTimestamp() 
            ]);
            
            let isCancelled = false;
            try { isCancelled = await eventContract.isCancelled(); } catch(e) {}
            
            const balanceEth = ethers.formatEther(balance);
            
            if (!isCancelled) {
                revenue += parseFloat(balanceEth);
                tickets += Number(soldCount);
            }

            filteredEvents.push({ 
                address, 
                name, 
                price: ethers.formatEther(price), 
                soldCount: soldCount.toString(), 
                capacity: capacity.toString(), 
                balance: balanceEth, 
                isCancelled, 
                image,
                eventTimestamp: Number(eventTimestamp) 
            });
        }
      }
      setMyEvents(filteredEvents);
      setTotalRevenue(revenue);
      setTotalTicketsSold(tickets);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const withdraw = async (eventAddress: string) => {
    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const eventContract = new ethers.Contract(eventAddress, EVENT_ABI, signer);
        const tx = await eventContract.withdraw();
        toast.info("💸 Çekim işlemi başladı...");
        await tx.wait();
        toast.success("🤑 Tutar cüzdana aktarıldı!");
        window.location.reload();
    } catch (err: any) { toast.error("Hata: " + (err.reason || "İşlem başarısız")); }
  };

  const handleCancelClick = (address: string) => {
      setSelectedEventAddr(address);
      setIsConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedEventAddr) return;
    setIsProcessing(true);
    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const eventContract = new ethers.Contract(selectedEventAddr, EVENT_ABI, signer);
        const tx = await eventContract.cancelEvent();
        toast.info("⏳ İptal işlemi gönderildi...");
        await tx.wait();
        toast.success("🛑 Etkinlik başarıyla iptal edildi.");
        setIsConfirmOpen(false);
        window.location.reload();
    } catch (err: any) { 
        toast.error("Hata: " + (err.reason || "İşlem başarısız")); 
    } finally {
        setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Kopyalandı!"); };

  if (loading) return <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f8fafc', color:'#64748b'}}><div style={{fontSize:'60px'}}>💼</div><h3>Panel Yükleniyor...</h3></div>;

  return (
    <div style={{minHeight:'100vh', background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)', paddingBottom:'80px', fontFamily:"'Inter', sans-serif"}}>
      
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Etkinliği İptal Et"
        message="Bu işlem geri alınamaz! Etkinlik iptal edilecek ve bilet sahiplerine iade hakkı tanınacak."
        isLoading={isProcessing}
      />

      {/* HEADER */}
      <div style={{padding:'60px 0 40px', backgroundColor:'white', borderBottom:'1px solid #f1f5f9'}}>
          <div style={containerStyle}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <div style={{backgroundColor:'#e2e8f0', padding:'12px', borderRadius:'16px'}}><SettingsIcon /></div>
                <div>
                    <h1 style={{margin:0, fontSize:'32px', color:'#0f172a', fontWeight:'900', letterSpacing:'-1px'}}>Organizatör Paneli</h1>
                    <p style={{margin:'4px 0 0', color:'#64748b', fontSize:'15px', fontWeight:'500'}}>Finansal durumunu ve etkinliklerini buradan yönet.</p>
                </div>
            </div>
          </div>
      </div>

      <div style={containerStyle}>
        
        {/* İSTATİSTİKLER */}
        {myEvents.length > 0 && (
            <div style={statsGridStyle}>
                <StatCard title="TOPLAM HASILAT" value={totalRevenue.toFixed(4)} unit="ETH" icon={<WalletIcon/>} colorStart="#10b981" colorEnd="#059669" />
                <StatCard title="TOPLAM BİLET" value={totalTicketsSold} unit="Adet" icon={<TicketIcon/>} colorStart="#3b82f6" colorEnd="#2563eb" />
            </div>
        )}

        {/* ETKİNLİKLER */}
        <div style={{marginTop:'50px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
                <h3 style={{fontSize:'20px', fontWeight:'800', color:'#0f172a', margin:0}}>Yönetim Merkezi <span style={{fontSize:'14px', color:'#94a3b8', fontWeight:'500'}}>({myEvents.length} Etkinlik)</span></h3>
                {myEvents.length > 0 && (
                    <button onClick={() => navigate('/create')} style={smallCreateBtn}>+ Yeni Oluştur</button>
                )}
            </div>

            {myEvents.length === 0 ? (
                <div style={emptyStateStyle}>
                    <div style={{fontSize:'70px', marginBottom:'20px', opacity:0.8}}>🚀</div>
                    <h2 style={{color:'#1e293b', marginBottom:'10px'}}>Yolculuk Başlasın!</h2>
                    <p style={{color:'#64748b', maxWidth:'400px', margin:'0 auto 30px'}}>Henüz bir etkinlik oluşturmadın.</p>
                    <button onClick={() => navigate('/create')} style={primaryBtnStyle}>✨ Etkinlik Oluştur</button>
                </div>
            ) : (
                <div style={gridStyle}>
                    {myEvents.map((evt, index) => {
                        const hasBalance = parseFloat(evt.balance) > 0;
                        const percent = Math.round((Number(evt.soldCount) / Number(evt.capacity)) * 100);

                        // 🔥 ŞU ANKİ ZAMANI AL (Saniye cinsinden)
                        const now = Math.floor(Date.now() / 1000);
                        // 🔥 ETKİNLİK ZAMANI GEÇTİ Mİ?
                        const isTimePassed = now > evt.eventTimestamp;

                        return (
                            <div key={index} style={{...eventCardStyle, filter: evt.isCancelled ? 'grayscale(1)' : 'none', opacity: evt.isCancelled ? 0.8 : 1}}>
                                <div style={cardHeaderStyle}>
                                    <img src={evt.image} style={cardBgImage} onError={(e)=>(e.target as any).src='https://via.placeholder.com/400x200'}/>
                                    <div style={overlayGradient}></div>
                                    <div style={headerContent}>
                                        {/* 🔥 DURUM BADGE GÜNCELLEMESİ */}
                                        {evt.isCancelled ? (
                                            <span style={cancelledBadge}>İPTAL EDİLDİ</span>
                                        ) : isTimePassed ? (
                                            <span style={{...activeBadge, backgroundColor: '#64748b', boxShadow:'none'}}>🏁 TAMAMLANDI</span>
                                        ) : (
                                            <span style={activeBadge}>● AKTİF</span>
                                        )}
                                    </div>
                                </div>

                                <div style={cardBodyStyle}>
                                    <div style={{marginBottom:'20px'}}>
                                        <h3 style={eventTitleStyle}>{evt.name}</h3>
                                        <div style={contractIdContainer} onClick={() => copyToClipboard(evt.address)}>
                                            <span>ID: {evt.address.substring(0,8)}...{evt.address.substring(36)}</span>
                                            <CopyIcon />
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{marginBottom:'25px'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', fontSize:'12px', fontWeight:'700', color:'#475569'}}>
                                            <span>Doluluk</span>
                                            <span>{percent}%</span>
                                        </div>
                                        <div style={{width:'100%', height:'12px', backgroundColor:'#f1f5f9', borderRadius:'100px', overflow:'hidden', border:'1px solid #e2e8f0'}}>
                                            <div style={{width:`${percent}%`, height:'100%', background:'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius:'100px', transition:'width 1s ease'}}></div>
                                        </div>
                                        <div style={{display:'flex', justifyContent:'space-between', marginTop:'6px', fontSize:'11px', color:'#94a3b8', fontWeight:'500'}}>
                                            <span>{evt.soldCount} Satıldı</span>
                                            <span>{evt.capacity} Kapasite</span>
                                        </div>
                                    </div>

                                    {/* Kasa Bakiyesi */}
                                    <div style={{
                                        backgroundColor: hasBalance ? 'rgba(16, 185, 129, 0.08)' : '#f8fafc',
                                        border: hasBalance ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #e2e8f0',
                                        borderRadius:'16px', padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'
                                    }}>
                                        <span style={{fontSize:'12px', fontWeight:'700', color: hasBalance ? '#059669' : '#64748b'}}>KASA BAKİYESİ</span>
                                        <span style={{fontSize:'18px', fontWeight:'900', color: hasBalance ? '#059669' : '#94a3b8', letterSpacing:'-0.5px'}}>{evt.balance} ETH</span>
                                    </div>

                                    {/* AKSİYON BUTONLARI */}
                                    <div style={{display:'flex', gap:'12px', marginTop:'auto'}}>
                                        <button 
                                            onClick={() => withdraw(evt.address)}
                                            // 🔥 HASILAT KİLİDİ: Zaman dolmadan para çekilemez
                                            disabled={!hasBalance || evt.isCancelled || !isTimePassed}
                                            style={{
                                                flex: 1, padding:'14px', borderRadius:'12px', border:'none', fontSize:'14px', fontWeight:'800', cursor:'pointer',
                                                background: (!hasBalance || evt.isCancelled || !isTimePassed) ? '#f1f5f9' : '#10b981',
                                                color: (!hasBalance || evt.isCancelled || !isTimePassed) ? '#94a3b8' : 'white',
                                                boxShadow: (hasBalance && isTimePassed && !evt.isCancelled) ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none',
                                                transition: 'all 0.2s', display: 'flex', alignItems:'center', justifyContent:'center', gap:'8px'
                                            }}
                                        >
                                            {!isTimePassed 
                                                ? "⏳ Süre Dolmadı" 
                                                : (hasBalance ? "💰 Hasılatı Çek" : "Kasa Boş")
                                            }
                                        </button>
                                        
                                        {!evt.isCancelled && (
                                            <button 
                                                onClick={() => handleCancelClick(evt.address)}
                                                // 🛑 İPTAL KİLİDİ: Zaman geçtiyse etkinlik iptal edilemez (Organizatör pişmanlığı engelleme)
                                                disabled={isTimePassed}
                                                style={{
                                                    padding:'14px 20px', borderRadius:'12px', 
                                                    border: isTimePassed ? '2px solid #e2e8f0' : '2px solid #fee2e2', 
                                                    backgroundColor: isTimePassed ? '#f8fafc' : 'white', 
                                                    color: isTimePassed ? '#94a3b8' : '#ef4444', 
                                                    fontSize:'14px', fontWeight:'800', 
                                                    cursor: isTimePassed ? 'not-allowed' : 'pointer',
                                                    transition:'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { if(!isTimePassed) e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                                                onMouseLeave={(e) => { if(!isTimePassed) e.currentTarget.style.backgroundColor = 'white'; }}
                                            >
                                                {isTimePassed ? "Bitti" : "İptal"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// --- CSS ---
// -----------------------------------------------------------------------------
const containerStyle: React.CSSProperties = { maxWidth:'1100px', margin:'0 auto', padding:'0 25px' };
const statsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginTop:'-30px' };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "30px" };
const eventCardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)', transition: 'transform 0.2s', display:'flex', flexDirection:'column' };
const cardHeaderStyle: React.CSSProperties = { height:'160px', position:'relative' };
const cardBgImage: React.CSSProperties = { width:'100%', height:'100%', objectFit:'cover' };
const overlayGradient: React.CSSProperties = { position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' };
const headerContent: React.CSSProperties = { position:'absolute', top:'15px', right:'15px', zIndex:2 };
const activeBadge: React.CSSProperties = { backgroundColor:'#10b981', color:'white', padding:'6px 14px', borderRadius:'30px', fontSize:'11px', fontWeight:'800', boxShadow:'0 4px 15px rgba(16, 185, 129, 0.4)', letterSpacing:'0.5px' };
const cancelledBadge: React.CSSProperties = { backgroundColor:'#ef4444', color:'white', padding:'6px 14px', borderRadius:'30px', fontSize:'11px', fontWeight:'800', boxShadow:'0 4px 15px rgba(239, 68, 68, 0.4)', letterSpacing:'0.5px' };
const cardBodyStyle: React.CSSProperties = { padding:'25px', display:'flex', flexDirection:'column', flex:1 };
const eventTitleStyle: React.CSSProperties = { margin:'0 0 6px 0', fontSize:'20px', fontWeight:'800', color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' };
const contractIdContainer: React.CSSProperties = { fontSize:'12px', color:'#64748b', fontFamily:'monospace', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 8px', backgroundColor:'#f8fafc', borderRadius:'6px', border:'1px solid #e2e8f0' };
const emptyStateStyle: React.CSSProperties = { textAlign: 'center', backgroundColor:'white', borderRadius:'24px', padding:'80px 20px', boxShadow:'0 20px 50px rgba(0,0,0,0.03)' };
const primaryBtnStyle: React.CSSProperties = { backgroundColor: '#e91e63', color:'white', border:'none', padding:'16px 40px', borderRadius:'30px', fontSize:'16px', fontWeight:'bold', cursor:'pointer', boxShadow:'0 10px 25px rgba(233, 30, 99, 0.3)', transition:'0.2s' };
const smallCreateBtn: React.CSSProperties = { backgroundColor: '#0f172a', color:'white', border:'none', padding:'10px 20px', borderRadius:'20px', fontSize:'13px', fontWeight:'700', cursor:'pointer', transition:'0.2s', boxShadow:'0 4px 10px rgba(15, 23, 42, 0.2)' };