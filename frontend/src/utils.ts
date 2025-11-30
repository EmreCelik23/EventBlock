// src/utils.ts

// 1. Cüzdan adresini kısaltır (Örn: 0x12...3456)
export const shortenAddress = (address: string) => {
  if (!address) return "";
  // İlk 4 karakter ... Son 4 karakter
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// 2. Tarih ve Saati, Solidity uyumlu Unix Timestamp'e (Saniye) çevirir
// Örn: "2025-11-29" ve "21:30" -> 1764441000
export const dateToTimestamp = (dateStr: string, timeStr: string): number => {
    // Tarih ve saati birleştir
    const eventDate = new Date(`${dateStr}T${timeStr}`);
    
    // JavaScript milisaniye (ms) kullanır, Solidity saniye (s) kullanır.
    // Bu yüzden 1000'e bölüp küsuratı atıyoruz.
    return Math.floor(eventDate.getTime() / 1000);
};