import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FACTORY_ADDRESS, FACTORY_ABI } from '../config';
import { dateToTimestamp } from '../utils'; 

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow,
});

// --- RENK PALETİ ---
const PRIMARY = '#8b5cf6'; // Violet
const SECONDARY = '#f43f5e'; // Rose
const BG_COLOR = '#0f172a'; // Ana Arka Plan
const CARD_BG = '#1e293b'; // Form Kartlarının Zemini
const INPUT_BG = '#0b0f19'; // Input İçi
const BORDER_COLOR = '#2d3748'; // Çizgiler
const TEXT_MUTED = '#94a3b8';

// --- RESPONSIVE CHECK ---
const useWindowSize = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1000);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMobile;
};

// --- İKONLAR ---
const RefreshIcon = () => <svg width="14" height="14" fill="none" stroke={PRIMARY} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;
const ImageIcon = () => <svg width="18" height="18" fill="none" stroke={TEXT_MUTED} strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const MapIcon = () => <svg width="18" height="18" fill="none" stroke={TEXT_MUTED} strokeWidth="2" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
const ClockIcon = () => <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const UsersIcon = () => <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

const globalStyles = `
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
    opacity: 0.6;
    transition: 0.2s;
  }
  input[type="date"]::-webkit-calendar-picker-indicator:hover,
  input[type="time"]::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
`;

function LocationMarker({ setCity, setCountry, setMapsLink, setManualAddress }: any) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  useMapEvents({
    async click(e: L.LeafletMouseEvent) { 
      setPosition(e.latlng);
      toast.info("📍 Konum alınıyor...", { autoClose: 1000, theme: "dark" });

      const link = `http://googleusercontent.com/maps.google.com/maps?q=${e.latlng.lat},${e.latlng.lng}`;
      setMapsLink(link);

      try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`;
          const response = await fetch(url);
          const data = await response.json();

          if (data && data.address) {
              const addr = data.address;
              const detectedCity = addr.province || addr.city || addr.state || "";
              const detectedCountry = addr.country || "";
              const road = addr.road || addr.pedestrian || "";
              const number = addr.house_number || "";
              const suburb = addr.suburb || addr.district || "";
              const fullAddr = `${road} ${number} ${suburb}`.trim();

              setCity(detectedCity);
              setCountry(detectedCountry);
              setManualAddress(fullAddr); 
          }
      } catch (err) { console.error(err); }
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

export default function CreateEvent() {
  const isMobile = useWindowSize();
  
  // 🛡️ BUGÜNÜN TARİHİNİ AL
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  const safeImages = [
    "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1574581457199-543594b1509a?auto=format&fit=crop&w=800&q=80"
  ];

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [imageURL, setImageURL] = useState(safeImages[0]);
  const [locationName, setLocationName] = useState(""); 
  const [city, setCity] = useState("");                 
  const [country, setCountry] = useState("");           
  const [mapsLink, setMapsLink] = useState("");         
  const [manualAddress, setManualAddress] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [locationMode, setLocationMode] = useState<'map' | 'manual'>('map');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const setRandomImage = (e: React.MouseEvent) => {
    e.preventDefault();
    const availableImages = safeImages.filter(img => img !== imageURL);
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    setImageURL(availableImages[randomIndex]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1️⃣ BOŞ ALAN KONTROLÜ
    if (!name || !date || !time || !price || !capacity || !locationName || !city || !country || !imageURL) {
        return toast.warning("Lütfen tüm alanları doldurun!", { theme: "dark" });
    }

    // 2️⃣ FİYAT KONTROLÜ
    if (Number(price) < 0) {
        return toast.warning("Bilet fiyatı 0'dan küçük olamaz!", { theme: "dark" });
    }

    // 3️⃣ KAPASİTE KONTROLÜ
    if (Number(capacity) <= 0) {
        return toast.warning("Kapasite en az 1 kişi olmalıdır!", { theme: "dark" });
    }

    // 4️⃣ ZAMAN KONTROLÜ
    const selectedDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    if (selectedDateTime <= now) {
        return toast.warning("Geçmiş bir tarih veya saate etkinlik oluşturamazsınız!", { theme: "dark" });
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      
      let finalMapsLink = mapsLink;
      if (!finalMapsLink) {
          const fullSearchQuery = manualAddress ? `${locationName}, ${manualAddress}, ${city}` : `${locationName}, ${city}`;
          finalMapsLink = `http://googleusercontent.com/maps.google.com/maps?q=${encodeURIComponent(fullSearchQuery)}`;
      }

      // 🔥 GÜVENLİK ADIMI: Tarihi Unix Timestamp formatına çevir
      const eventTimestamp = dateToTimestamp(date, time);
      console.log("Blokzincire giden tarih:", eventTimestamp);

      // 🔥 createEvent fonksiyonunu yeni parametre ile çağır
      const tx = await factoryContract.createEvent(
          name, date, time, imageURL, 
          locationName, city, country, finalMapsLink,
          ethers.parseEther(price), Number(capacity),
          eventTimestamp // <--- YENİ PARAMETRE: Zaman Kilidi için
      );
      
      toast.info("Cüzdan onayı bekleniyor... ⏳", { theme: "dark" });
      await tx.wait();
      toast.success("🚀 Etkinlik Başarıyla Oluşturuldu!", { theme: "dark" });
      navigate('/'); 
    } catch (error: any) {
      console.error(error);
      toast.error("Hata: " + (error.reason || "İşlem başarısız"), { theme: "dark" });
    } finally { setLoading(false); }
  };

  return (
    <div style={pageWrapperStyle}>
      <style>{globalStyles}</style>

      <div style={{...contentGridStyle, gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr'}}>
        
        {/* SOL TARA: FORM ALANI */}
        <div style={formSectionStyle}>
          <div style={headerStyle}>
            <h1 style={titleStyle}>Etkinlik Tasarla</h1>
            <p style={subtitleStyle}>Topluluğunuzu bir araya getirecek eşsiz bir deneyim yaratın.</p>
          </div>

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            <div style={cardStyle}>
                <h3 style={sectionTitleStyle}><span style={{marginRight:'8px'}}>📝</span> Temel Bilgiler</h3>
                <div style={inputWrapperStyle}>
                    <label style={labelStyle}>ETKİNLİK ADI</label>
                    <input type="text" placeholder="Örn: Web3 Summit Istanbul" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                </div>
                
                <div style={gridRowStyle}>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>TARİH</label>
                        <input type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>SAAT</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                   <h3 style={{...sectionTitleStyle, margin:0}}><span style={{marginRight:'8px'}}>📷</span> Görsel</h3>
                   <button onClick={setRandomImage} style={randomBtnStyle} title="Rastgele Değiştir"><RefreshIcon/> Değiştir</button>
                </div>
                
                <div style={inputWrapperStyle}>
                    <div style={{position:'relative'}}>
                        <input type="text" placeholder="https://..." value={imageURL} onChange={(e) => setImageURL(e.target.value)} style={{...inputStyle, paddingLeft:'40px'}} />
                        <div style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)'}}><ImageIcon/></div>
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                <h3 style={sectionTitleStyle}><span style={{marginRight:'8px'}}>💎</span> Bilet Detayları</h3>
                <div style={gridRowStyle}>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>FİYAT (ETH)</label>
                        <input type="number" step="0.0001" min="0" placeholder="0.05" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>KAPASİTE</label>
                        <input type="number" min="1" placeholder="100" value={capacity} onChange={(e) => setCapacity(e.target.value)} style={inputStyle} />
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                <h3 style={sectionTitleStyle}><span style={{marginRight:'8px'}}>📍</span> Konum</h3>
                
                <div style={tabContainerStyle}>
                    <button type="button" onClick={() => setLocationMode('map')} style={locationMode === 'map' ? activeTabStyle : tabStyle}>Haritadan Seç</button>
                    <button type="button" onClick={() => setLocationMode('manual')} style={locationMode === 'manual' ? activeTabStyle : tabStyle}>Elle Gir</button>
                </div>

                {locationMode === 'map' && (
                    <div style={mapWrapperStyle}>
                        <MapContainer center={[41.0082, 28.9784]} zoom={10} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='© OSM' />
                            <LocationMarker setCity={setCity} setCountry={setCountry} setMapsLink={setMapsLink} setManualAddress={setManualAddress} />
                        </MapContainer>
                        <div style={mapOverlayTextStyle}>Konumu seçmek için haritaya tıklayın</div>
                    </div>
                )}

                <div style={{display:'grid', gap:'15px', marginTop:'15px'}}>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>MEKAN ADI</label>
                        <input type="text" placeholder="Örn: Volkswagen Arena" value={locationName} onChange={e => setLocationName(e.target.value)} style={inputStyle} />
                    </div>
                    
                    <div style={gridRowStyle}>
                        <div style={inputWrapperStyle}>
                            <label style={labelStyle}>ŞEHİR</label>
                            <input type="text" placeholder="İstanbul" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
                        </div>
                        <div style={inputWrapperStyle}>
                            <label style={labelStyle}>ÜLKE</label>
                            <input type="text" placeholder="Türkiye" value={country} onChange={e => setCountry(e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                    
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>DETAYLI ADRES</label>
                         <div style={{position:'relative'}}>
                            <input type="text" placeholder="Cadde, No, Mahalle..." value={manualAddress} onChange={e => setManualAddress(e.target.value)} style={{...inputStyle, paddingLeft:'40px'}} />
                            <div style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)'}}><MapIcon/></div>
                        </div>
                    </div>
                </div>
            </div>

            <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? "Blokzincire İşleniyor..." : "Etkinliği Yayınla 🚀"}
            </button>

          </form>
        </div>

        {/* --- CANLI ÖNİZLEME (SAĞ) --- */}
        <div style={{...previewSectionStyle, order: isMobile ? -1 : 1}}>
            <div style={stickyWrapperStyle}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                     <span style={{width:'8px', height:'8px', borderRadius:'50%', backgroundColor: '#10b981', boxShadow:`0 0 8px #10b981`}}></span>
                     <h3 style={{color: TEXT_MUTED, fontSize: '11px', textTransform:'uppercase', letterSpacing:'1.5px', margin:0, fontWeight: 700}}>Canlı Önizleme</h3>
                </div>
                
                <div style={previewCardStyle}>
                    <div style={previewImageWrapper}>
                        <img src={imageURL} style={previewImage} onError={(e) => (e.target as any).src="https://via.placeholder.com/400x200?text=Gorsel+Hata"} />
                        <div style={dateBadge}>
                            <span style={{fontSize:'14px', fontWeight:'bold'}}>
                                {date ? date.split('-')[2] : 'GG'}
                            </span>
                            <span style={{fontSize:'10px', textTransform:'uppercase', color:'#555'}}>
                                {date ? new Date(date).toLocaleString('tr-TR', {month:'short'}) : 'AY'}
                            </span>
                        </div>
                        <span style={ownerTag}>👑 SENİN</span>
                    </div>
                    
                    <div style={{padding:'20px'}}>
                        <h3 style={cardTitle}>{name || "Etkinlik Başlığı"}</h3>
                        <p style={cardLocation}>📍 {locationName ? `${locationName}, ${city}` : "Konum Bilgisi"}</p>
                        
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'end', marginTop:'20px', paddingTop:'15px', borderTop:`1px solid #f0f0f0`}}>
                            <div>
                                <p style={{margin:0, fontSize:'10px', color:'#999', fontWeight:'700', letterSpacing:'0.5px'}}>BAŞLANGIÇ</p>
                                <p style={{margin:0, fontSize:'20px', fontWeight:'800', color: PRIMARY}}>{price || "0"} ETH</p>
                            </div>
                            <div style={fakeBtn}>İncele</div>
                        </div>

                        <div style={{
                            marginTop: '15px', 
                            paddingTop: '15px', 
                            borderTop: '1px solid #f0f0f0', 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: '#64748b',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}>
                             <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                                 <UsersIcon/>
                                 <span>{capacity ? `${capacity} Kişi` : "Kapasite"}</span>
                             </div>
                             <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                                 <ClockIcon/>
                                 <span>{time || "--:--"}</span>
                             </div>
                        </div>

                    </div>
                </div>

                <div style={infoBoxStyle}>
                    <p style={{margin:0}}>💡 <strong>İpucu:</strong> Etkinlik oluşturulduktan sonra blokzincir doğası gereği değiştirilemez. Lütfen bilgileri kontrol edin.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

// --- STİLLER ---
const pageWrapperStyle: React.CSSProperties = { minHeight: '100vh', backgroundColor: BG_COLOR, color: 'white', padding: '40px 20px', fontFamily: '"Inter", sans-serif', borderRadius: '12px' };
const contentGridStyle: React.CSSProperties = { display: 'grid', gap: '50px', maxWidth: '1100px', margin: '0 auto' };
const formSectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const headerStyle: React.CSSProperties = { marginBottom: '20px' };
const titleStyle: React.CSSProperties = { fontSize: '36px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-1.5px', color: 'white' };
const subtitleStyle: React.CSSProperties = { fontSize: '16px', color: TEXT_MUTED, margin: 0, fontWeight: '400', lineHeight: '1.5' };
const cardStyle: React.CSSProperties = { backgroundColor: CARD_BG, padding: '30px', borderRadius: '16px', border: `1px solid ${BORDER_COLOR}`, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: 'white', display:'flex', alignItems:'center' };
const gridRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const inputWrapperStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '700', color: TEXT_MUTED, letterSpacing: '0.5px', textTransform: 'uppercase' };
const inputStyle: React.CSSProperties = { backgroundColor: INPUT_BG, border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', padding: '14px', color: 'white', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', width: '100%', boxSizing: 'border-box' };
const randomBtnStyle: React.CSSProperties = { background: 'transparent', border: `1px solid ${PRIMARY}`, color: PRIMARY, borderRadius:'8px', padding:'6px 12px', cursor: 'pointer', fontSize: '12px', display:'flex', alignItems:'center', gap:'6px', fontWeight:'600', transition: '0.2s' };
const tabContainerStyle: React.CSSProperties = { display: 'flex', gap: '5px', marginBottom: '20px', backgroundColor: INPUT_BG, padding: '4px', borderRadius: '10px', border: `1px solid ${BORDER_COLOR}` };
const tabStyle: React.CSSProperties = { flex: 1, padding: '8px', border: 'none', backgroundColor: 'transparent', color: TEXT_MUTED, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition:'0.2s' };
const activeTabStyle: React.CSSProperties = { ...tabStyle, backgroundColor: PRIMARY, color: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' };
const mapWrapperStyle: React.CSSProperties = { height: '250px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${BORDER_COLOR}`, position:'relative', marginBottom:'20px' };
const mapOverlayTextStyle: React.CSSProperties = { position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', color: '#333', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', zIndex: 999, pointerEvents: 'none', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' };
const submitButtonStyle: React.CSSProperties = { padding: '20px', background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '20px', boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)', transition: 'transform 0.2s' };
const previewSectionStyle: React.CSSProperties = { display: 'block' };
const stickyWrapperStyle: React.CSSProperties = { position: 'sticky', top: '100px' };
const previewCardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', color: '#333', border: '4px solid rgba(255,255,255,0.1)' };
const previewImageWrapper: React.CSSProperties = { height: '220px', position: 'relative', backgroundColor: '#eee' };
const previewImage: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const dateBadge: React.CSSProperties = { position: 'absolute', top: '15px', left: '15px', backgroundColor: 'white', padding: '8px 14px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', color:'#111', lineHeight:'1.2' };
const ownerTag: React.CSSProperties = { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fbbf24', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', color: 'black', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' };
const cardTitle: React.CSSProperties = { margin: '0 0 6px 0', fontSize: '20px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const cardLocation: React.CSSProperties = { margin: 0, fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const fakeBtn: React.CSSProperties = { padding: '10px 24px', backgroundColor: PRIMARY, color: 'white', borderRadius: '20px', fontWeight: '700', fontSize: '13px', cursor: 'default' };
const infoBoxStyle: React.CSSProperties = { marginTop: '25px', padding: '20px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#a5b4fc', fontSize: '13px', lineHeight: '1.5' };