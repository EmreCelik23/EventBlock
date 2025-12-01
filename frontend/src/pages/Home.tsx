import React, { useEffect, useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FACTORY_ADDRESS, FACTORY_ABI, EVENT_ABI } from '../config';

const ICON_COLOR = '#e91e63';
const HERO_IMAGES = [
    '/images/hero1.jpg', '/images/hero2.jpg', '/images/hero3.jpg',
    '/images/hero4.jpg', '/images/hero5.jpg', '/images/hero6.jpg'
];

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMobile;
};

const SearchIcon = () => <svg width="20" height="20" fill="none" stroke={ICON_COLOR} strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>;
const MapPinIcon = () => <svg width="20" height="20" fill="none" stroke={ICON_COLOR} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const CalendarIcon = () => <svg width="20" height="20" fill="none" stroke={ICON_COLOR} strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const FilterIcon = () => <svg width="16" height="16" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>;
const SettingsIcon = () => <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2 2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const PlusIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

interface EventData {
    address: string;
    organizer: string;
    name: string;
    date: string;
    time: string;
    image: string;
    locationStr: string;
    city: string;
    country: string;
    mapsLink: string;
    price: string;
    capacity: string;
    soldCount: string;
    hasBought: boolean;
    isCancelled: boolean;
    eventTimestamp: number;
}

export default function Home() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentAccount, setCurrentAccount] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [randomHeroImage, setRandomHeroImage] = useState('');
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const [searchTerm, setSearchTerm] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [sortBy, setSortBy] = useState("date_asc");
    const [hideSoldOut, setHideSoldOut] = useState(false);

    const formatDateTR = (dateStr: string) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    };

    const clampPriceString = (value: string) => {
        if (value === '') return '';
        const num = Number(value);
        return isNaN(num) || num < 0 ? '' : String(num);
    };

    const getCleanMapLink = (url: string) => {
        if (!url) return '';
        const trimmed = url.trim();
        const coordRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
        if (coordRegex.test(trimmed)) return `http://googleusercontent.com/maps.google.com/?q=${trimmed.replace(/\s/g, '')}`;
        if (trimmed.includes('googleusercontent') || trimmed.includes('http://googleusercontent.com/maps.google.com/')) {
            const match = trimmed.match(/(maps\.google\.com.*|goo\.gl.*)/);
            if (match) return `https://${match[0]}`;
        }
        if (trimmed.startsWith('http')) return trimmed;
        
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
    };

    const isFilterActive = searchTerm || filterLocation || minPrice || maxPrice || filterDate || hideSoldOut;

    const clearFilters = () => {
        setSearchTerm(""); setFilterLocation(""); setMinPrice(""); setMaxPrice("");
        setFilterDate(""); setSortBy("date_asc"); setHideSoldOut(false);
        toast.info("Filtreler temizlendi", { theme: "dark" });
    };

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
        setRandomHeroImage(HERO_IMAGES[randomIndex]);
        checkWallet();
        if ((window as any).ethereum) { (window as any).ethereum.on('accountsChanged', handleAccountChange); }
    }, []);

    useEffect(() => {
        if (currentAccount) fetchEvents(currentAccount);
        else fetchEvents(null);
    }, [currentAccount]);

    const handleAccountChange = async (accounts: string[]) => {
        setCurrentAccount(accounts.length > 0 ? accounts[0] : "");
    };

    const checkWallet = async () => {
        if ((window as any).ethereum) {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) setCurrentAccount(accounts[0].address);
        }
    };

    const fetchEvents = async (accountAddr: string | null) => {
        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
            const deployedEvents = await factory.getDeployedEvents();

            const eventList = await Promise.all(
                deployedEvents.map(async (address: string) => {
                    try {
                        const eventContract = new ethers.Contract(address, EVENT_ABI, provider);

                        const [name, date, time, image, price, capacity, soldCount, organizer, isCancelled, eventTimestamp] = await Promise.all([
                            eventContract.name(),
                            eventContract.date(),
                            eventContract.time(),
                            eventContract.imageURL(),
                            eventContract.price(),
                            eventContract.capacity(),
                            eventContract.soldCount(),
                            eventContract.organizer(),
                            eventContract.isCancelled(),
                            eventContract.eventTimestamp()
                        ]);

                        let city = "", country = "", mapsLink = "", locationName = "";
                        try { locationName = await eventContract.locationName(); } catch (e) { }
                        try { city = await eventContract.city(); } catch (e) { }
                        try { country = await eventContract.country(); } catch (e) { }
                        try { mapsLink = await eventContract.mapsLink(); } catch (e) { }

                        const locationStr = locationName ? `${locationName}, ${city}` : (city || "Konum Bilgisi Yok");
                        let hasBought = false;
                        if (accountAddr) { try { hasBought = await eventContract.hasTicket(accountAddr); } catch (e) { } }

                        return {
                            address, organizer, name, date, time, image,
                            locationStr, city, country,
                            mapsLink: getCleanMapLink(mapsLink),
                            price: ethers.formatEther(price),
                            capacity: capacity.toString(),
                            soldCount: soldCount.toString(),
                            hasBought,
                            isCancelled,
                            eventTimestamp: Number(eventTimestamp)
                        };
                    } catch (err) { return null; }
                })
            );
            setEvents(eventList.filter(e => e !== null) as EventData[]);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const buyTicket = async (eventAddress: string, priceETH: string) => {
        if (!currentAccount) return toast.warning("Lütfen cüzdan bağlayın!", { theme: "dark" });
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const eventContract = new ethers.Contract(eventAddress, EVENT_ABI, signer);

            const hasTicket = await eventContract.hasTicket(currentAccount);
            if (hasTicket) return toast.warning("⚠️ Bu etkinlik için zaten biletiniz var!", { theme: "dark" });

            const tx = await eventContract.buyTicket({ value: ethers.parseEther(priceETH) });
            toast.info("İşlem ağa gönderildi... ⏳", { theme: "dark", autoClose: 3000 });

            const receipt = await tx.wait();

            toast.success(
                <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '15px' }}>🎉 Bilet Cüzdanında!</div>
                    <div style={{ fontSize: '12px', opacity: 0.9, color: '#e0e0e0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span>📦</span> <span style={{ fontWeight: 600 }}>Blok No:</span>
                            <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{receipt.blockNumber}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🔗</span> <span style={{ fontWeight: 600 }}>Tx Hash:</span>
                            <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>
                                {tx.hash.substring(0, 10)}...{tx.hash.substring(62)}
                            </span>
                        </div>
                    </div>
                </div>,
                { theme: "dark", autoClose: 6000 }
            );

            setEvents(prevEvents => prevEvents.map(evt => {
                if (evt.address === eventAddress) {
                    return { 
                        ...evt, 
                        hasBought: true, 
                        soldCount: (Number(evt.soldCount) + 1).toString() 
                    };
                }
                return evt;
            }));
            
            setSelectedEvent(prev => prev ? { ...prev, hasBought: true, soldCount: (Number(prev.soldCount) + 1).toString() } : null);

        } catch (error: any) {
            console.error("Hata Detayı:", error);

            if (error.code === 4001 || error.message?.includes("user rejected") || error.reason?.includes("rejected")) {
                toast.warning("İşlemi iptal ettiniz.", { theme: "dark" });
                return;
            }

            if (error.code === "INSUFFICIENT_FUNDS" || error.message?.includes("insufficient funds") || error.info?.error?.message?.includes("insufficient funds")) {
                toast.error("⛔️ Yetersiz Bakiye! Cüzdanınızda bilet ücreti ve işlem masrafı (Gas) için yeterli ETH yok.", { theme: "dark" });
                return;
            }

            if (error.reason) {
                if (error.reason.includes("Satislar kapandi")) {
                    toast.error("⏳ Üzgünüz, bu etkinlik için satış süresi doldu.", { theme: "dark" });
                } else if (error.reason.includes("Dolu")) {
                    toast.error("❌ Üzgünüz, biletler tükendi.", { theme: "dark" });
                } else if (error.reason.includes("Zaten biletin var")) {
                    toast.warning("🎟️ Zaten biletiniz mevcut.", { theme: "dark" });
                } else {
                    toast.error("İşlem başarısız: " + error.reason, { theme: "dark" });
                }
            } else {
                toast.error("Bir hata oluştu. Lütfen bakiyenizi kontrol edip tekrar deneyin.", { theme: "dark" });
            }
        }
    };

    const filteredEvents = useMemo(() => {
        const now = Math.floor(Date.now() / 1000);

        return events.filter((evt) => {
            const matchSearch = evt.name.toLowerCase().includes(searchTerm.toLowerCase()) || evt.locationStr.toLowerCase().includes(searchTerm.toLowerCase());
            const matchLocation = evt.city.toLowerCase().includes(filterLocation.toLowerCase()) || evt.country.toLowerCase().includes(filterLocation.toLowerCase());
            const priceNum = parseFloat(evt.price);
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Infinity;
            const matchPrice = priceNum >= min && priceNum <= max;
            let matchDate = true;
            const evtDate = new Date(evt.date);
            if (filterDate) {
                const selectedDate = new Date(filterDate);
                matchDate = evtDate >= selectedDate;
            }
            const isSoldOut = Number(evt.soldCount) >= Number(evt.capacity);
            const matchSoldOut = hideSoldOut ? !isSoldOut : true;

            const isActiveAndFuture = !evt.isCancelled && (evt.eventTimestamp > now);

            return matchSearch && matchLocation && matchPrice && matchDate && matchSoldOut && isActiveAndFuture;
        }).sort((a, b) => {
            if (sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
            if (sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
            if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
            if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
            return 0;
        });
    }, [events, searchTerm, filterLocation, minPrice, maxPrice, filterDate, sortBy, hideSoldOut]);

    const dynamicHeroStyle = { ...heroWrapperStyle, backgroundImage: `url(${randomHeroImage})` };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>Yükleniyor... 🔄</h2></div>;

    const isEventExpired = (timestamp: number) => {
        const now = Math.floor(Date.now() / 1000);
        return now > timestamp;
    };

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {selectedEvent && (
                <div style={overlayStyle} onClick={() => setSelectedEvent(null)}>
                    <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedEvent(null)} style={closeIconStyle}>✕</button>
                        <img src={selectedEvent.image} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '16px 16px 0 0' }} onError={(e) => (e.target as any).src = 'https://via.placeholder.com/400x220?text=Resim+Yok'} />
                        <div style={{ padding: '25px' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '10px', fontSize: '24px' }}>{selectedEvent.name}</h2>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <span style={tagStyle}>📅 {formatDateTR(selectedEvent.date)}</span>
                                <span style={tagStyle}>⏰ {selectedEvent.time}</span>
                            </div>
                            <div style={{ backgroundColor: '#f4f6f8', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    📍 {selectedEvent.locationStr}
                                </p>
                                {selectedEvent.mapsLink && <a href={selectedEvent.mapsLink} target="_blank" rel="noreferrer" style={mapsLinkStyle}>Haritada Göster →</a>}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                                <div><p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: 'bold' }}>FİYAT</p><p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: ICON_COLOR }}>{selectedEvent.price} ETH</p></div>
                                <div><p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: 'bold' }}>KONTENJAN</p><p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#333' }}>{selectedEvent.soldCount} / {selectedEvent.capacity}</p></div>
                            </div>

                            {currentAccount.toLowerCase() === selectedEvent.organizer.toLowerCase() ? (
                                <button onClick={() => navigate('/dashboard')} style={{ ...buyModalBtnStyle, width: '100%', backgroundColor: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><SettingsIcon /> Etkinliği Yönet</button>
                            ) : (
                                <button
                                    onClick={() => buyTicket(selectedEvent.address, selectedEvent.price)}
                                    style={{
                                        ...buyModalBtnStyle,
                                        width: '100%',
                                        backgroundColor: isEventExpired(selectedEvent.eventTimestamp) ? '#94a3b8' : ICON_COLOR,
                                        cursor: isEventExpired(selectedEvent.eventTimestamp) ? 'not-allowed' : 'pointer'
                                    }}
                                    disabled={
                                        Number(selectedEvent.soldCount) >= Number(selectedEvent.capacity) ||
                                        selectedEvent.hasBought ||
                                        isEventExpired(selectedEvent.eventTimestamp)
                                    }
                                >
                                    {selectedEvent.hasBought
                                        ? "✅ Biletiniz Var"
                                        : isEventExpired(selectedEvent.eventTimestamp)
                                            ? "⛔️ SATIŞ KAPANDI"
                                            : (Number(selectedEvent.soldCount) >= Number(selectedEvent.capacity)
                                                ? "TÜKENDİ"
                                                : `Hemen Al (${selectedEvent.price} ETH)`
                                            )
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div style={dynamicHeroStyle}>
                <div style={heroOverlayStyle}></div>
                <div style={heroContentStyle}>
                    <h1 style={{
                        fontSize: isMobile ? '2.5rem' : '4.5rem',
                        fontWeight: '900', margin: 0, letterSpacing: '-3px', textShadow: '0 0 20px rgba(0,0,0,0.5)'
                    }}>Anı Yaşa. EventBlock.</h1>
                    <p style={{ fontSize: isMobile ? '1rem' : '1.3rem', opacity: 0.9, marginTop: '10px', fontWeight: '300' }}>Blokzincir güvencesiyle en iyi etkinlikleri keşfet.</p>
                </div>
                <div style={{
                    ...searchBarStyle,
                    flexDirection: isMobile ? 'column' : 'row',
                    padding: isMobile ? '20px' : '15px 30px',
                    borderRadius: isMobile ? '30px' : '100px',
                    gap: isMobile ? '15px' : '25px',
                    bottom: isMobile ? '-100px' : '-40px'
                }}>
                    <div style={searchGroupStyle}><label style={labelStyle}>ETKİNLİK</label><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><SearchIcon /><input type="text" placeholder="Konser, Tiyatro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={inputStyle} /></div></div>
                    <div style={{ ...dividerStyle, display: isMobile ? 'none' : 'block' }}></div>
                    <div style={searchGroupStyle}><label style={labelStyle}>NEREDE</label><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPinIcon /><input type="text" placeholder="Şehir Ara..." value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} style={inputStyle} /></div></div>
                    <div style={{ ...dividerStyle, display: isMobile ? 'none' : 'block' }}></div>
                    <div style={searchGroupStyle}><label style={labelStyle}>TARİH</label><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarIcon /><input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={inputStyle} /></div></div>
                </div>
            </div>

            <div style={{ ...subFilterContainerStyle, marginTop: isMobile ? '130px' : '70px' }}>
                <div style={filterPill}><FilterIcon /></div>
                <div style={filterPill}><span>Fiyat:</span><input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(clampPriceString(e.target.value))} style={tinyInput} />-<input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(clampPriceString(e.target.value))} style={tinyInput} /></div>
                <label style={{ ...filterPill, cursor: 'pointer' }}><input type="checkbox" checked={hideSoldOut} onChange={(e) => setHideSoldOut(e.target.checked)} style={checkBoxStyle} /><span style={{ marginLeft: '5px' }}>Tükenenleri Gizle</span></label>
                <div style={filterPill}><span>Sırala:</span><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={tinySelect}><option value="date_asc">Yakın Tarih</option><option value="date_desc">Uzak Tarih</option><option value="price_asc">En Ucuz</option><option value="price_desc">En Pahalı</option></select></div>
                {isFilterActive && (<button onClick={clearFilters} style={clearButtonStyle}>✕ Temizle</button>)}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                        Toplam <strong>{filteredEvents.length}</strong> etkinlik listeleniyor.
                    </p>
                    <button onClick={() => navigate('/create')} style={createBtnStyle}>
                        <PlusIcon /> Etkinlik Oluştur
                    </button>
                </div>

                {(() => {
                    if (events.length === 0) {
                        return (
                            <div style={emptyStateStyle}>
                                <div style={{ fontSize: '60px', marginBottom: '15px' }}>🌱</div>
                                <h2 style={{ margin: '10px 0', color: '#333' }}>Sistemde henüz hiç etkinlik yok.</h2>
                                <p style={{ color: '#666', fontSize: '16px' }}>Buralar çok sessiz... İlk etkinliği sen oluşturarak bu sessizliği boz!</p>
                                <button onClick={() => navigate('/create')} style={actionLinkStyle}>✨ İlk Etkinliği Oluştur</button>
                            </div>
                        );
                    }

                    if (filteredEvents.length === 0) {
                        if (isFilterActive) {
                            return (
                                <div style={emptyStateStyle}>
                                    <div style={{ fontSize: '60px', marginBottom: '15px' }}>🔍</div>
                                    <h2 style={{ margin: '10px 0', color: '#333' }}>Aradığınız kriterlere uygun sonuç bulunamadı.</h2>
                                    <p style={{ color: '#666', fontSize: '16px' }}>Fiyat aralığını genişletmeyi veya farklı bir şehir aramayı deneyin.</p>
                                    <button onClick={clearFilters} style={resetLinkStyle}>Filtreleri Sıfırla</button>
                                </div>
                            );
                        }
                    }

                    return (
                        <div style={{
                            ...gridStyle,
                            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))"
                        }}>
                            {filteredEvents.map((evt, index) => {
                                const isOwner = currentAccount.toLowerCase() === evt.organizer.toLowerCase();
                                const isSoldOut = Number(evt.soldCount) >= Number(evt.capacity);
                                const isExpired = isEventExpired(evt.eventTimestamp);

                                return (
                                    <div key={index} style={cardStyle} onClick={() => setSelectedEvent(evt)}>
                                        <div style={cardImageWrapper}>
                                            <img src={evt.image} style={cardImage} onError={(e) => { (e.target as any).src = "https://via.placeholder.com/400x200?text=Resim+Yok" }} />
                                            <div style={dateBadge}>
                                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{evt.date.split('-')[2]}</span>
                                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#555' }}>{new Date(evt.date).toLocaleString('tr-TR', { month: 'short' })}</span>
                                            </div>
                                            {isOwner && <span style={ownerTag}>👑 SENİN</span>}
                                            {isExpired && !isOwner && <span style={{ ...soldOutTag, backgroundColor: 'rgba(51, 65, 85, 0.9)' }}>SÜRE DOLDU</span>}
                                            {isSoldOut && !isOwner && !isExpired && <span style={soldOutTag}>TÜKENDİ</span>}
                                            {evt.hasBought && !isOwner && <span style={boughtTag}>✅ BİLETİN VAR</span>}
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <h3 style={cardTitle}>{evt.name}</h3>
                                            <p style={cardLocation}>📍 {evt.locationStr.length > 40 ? evt.locationStr.substring(0, 40) + '...' : evt.locationStr}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '15px' }}>
                                                <div><p style={{ margin: 0, fontSize: '11px', color: '#999', fontWeight: '700' }}>BAŞLAYAN FİYATLAR</p><p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: ICON_COLOR }}>{evt.price} ETH</p></div>
                                                <button style={detailBtn}>İncele</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------------------------
// --- STİLLER ---
// -----------------------------------------------------------------------------------------
const heroWrapperStyle: React.CSSProperties = { position: 'relative', height: '500px', width: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' };
const heroOverlayStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)' };
const heroContentStyle: React.CSSProperties = { position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: '60px' };
const searchBarStyle: React.CSSProperties = { position: 'absolute', bottom: '-40px', zIndex: 10, backgroundColor: 'white', padding: '15px 30px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '25px', boxShadow: '0 25px 80px rgba(0,0,0,0.4)', border: '1px solid rgba(0,0,0,0.05)', maxWidth: '950px', width: '90%' };
const searchGroupStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', width: '100%' };
const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: '800', color: '#999', letterSpacing: '1px', marginBottom: '5px' };
const inputStyle: React.CSSProperties = { border: 'none', outline: 'none', fontSize: '15px', fontWeight: '600', width: '100%', color: '#333', background: 'transparent' };
const dividerStyle: React.CSSProperties = { width: '1px', height: '40px', backgroundColor: '#eee' };
const subFilterContainerStyle: React.CSSProperties = { marginTop: '70px', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' };
const filterPill: React.CSSProperties = { backgroundColor: 'white', padding: '8px 16px', borderRadius: '30px', border: '1px solid #e0e0e0', fontSize: '13px', fontWeight: '600', color: '#555', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' };
const tinyInput: React.CSSProperties = { width: '50px', border: '1px solid #ddd', background: '#f5f5f5', padding: '4px', borderRadius: '6px', textAlign: 'center', outline: 'none' };
const tinySelect: React.CSSProperties = { border: 'none', background: 'transparent', fontWeight: 'bold', cursor: 'pointer', outline: 'none', color: ICON_COLOR };
const checkBoxStyle: React.CSSProperties = { accentColor: ICON_COLOR, width: '14px', height: '14px' };
const clearButtonStyle: React.CSSProperties = { padding: '8px 20px', backgroundColor: '#ff6b6b', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '13px', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)' };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "30px" };
const cardStyle: React.CSSProperties = { backgroundColor: "white", borderRadius: "20px", overflow: 'hidden', boxShadow: "0 10px 30px rgba(0,0,0,0.05)", transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'pointer', position: 'relative' };
const cardImageWrapper: React.CSSProperties = { height: '200px', position: 'relative' };
const cardImage: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const dateBadge: React.CSSProperties = { position: 'absolute', top: '15px', left: '15px', backgroundColor: 'white', padding: '6px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', color: '#111', lineHeight: '1.2' };
const ownerTag: React.CSSProperties = { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#ffeb3b', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', color: 'black', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' };
const soldOutTag: React.CSSProperties = { position: 'absolute', bottom: '0', left: '0', right: '0', backgroundColor: 'rgba(231, 76, 60, 0.8)', padding: '10px 0', textAlign: 'center', fontSize: '14px', fontWeight: '800', color: 'white', zIndex: 5 };
const boughtTag: React.CSSProperties = { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#2ecc71', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', color: 'white', boxShadow: '0 4px 10px rgba(46, 204, 113, 0.3)', zIndex: 5 };
const cardTitle: React.CSSProperties = { margin: '0 0 5px 0', fontSize: '18px', fontWeight: '800', color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const cardLocation: React.CSSProperties = { margin: 0, fontSize: '13px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const detailBtn: React.CSSProperties = { padding: '10px 20px', backgroundColor: ICON_COLOR, color: 'white', border: 'none', borderRadius: '20px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: '0.2s', boxShadow: `0 5px 15px ${ICON_COLOR}55` };
const emptyStateStyle: React.CSSProperties = { textAlign: 'center', marginTop: '40px', padding: '60px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' };
const actionLinkStyle: React.CSSProperties = { marginTop: '20px', padding: '14px 35px', backgroundColor: ICON_COLOR, color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: `0 5px 15px ${ICON_COLOR}55`, transition: '0.2s' };
const resetLinkStyle: React.CSSProperties = { marginTop: '15px', padding: '10px 25px', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' };
const overlayStyle: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, backdropFilter: 'blur(10px)' };
const modalStyle: React.CSSProperties = { backgroundColor: "white", padding: "0", borderRadius: "24px", width: '90%', maxWidth: '420px', position: 'relative', boxShadow: '0 30px 90px rgba(0,0,0,0.5)', overflow: 'hidden' };
const closeIconStyle: React.CSSProperties = { position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 };
const tagStyle: React.CSSProperties = { fontSize: '12px', fontWeight: '700', color: ICON_COLOR, backgroundColor: '#fce4ec', padding: '4px 10px', borderRadius: '20px' };
const mapsLinkStyle: React.CSSProperties = { fontSize: '13px', color: '#007bff', textDecoration: 'none', fontWeight: '600', marginTop: '5px', display: 'inline-block' };
const buyModalBtnStyle: React.CSSProperties = { padding: '15px', backgroundColor: ICON_COLOR, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: `0 5px 15px ${ICON_COLOR}55` };

const createBtnStyle: React.CSSProperties = {
    padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', border: 'none',
    borderRadius: '20px', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '6px'
};