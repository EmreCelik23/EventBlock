// src/utils.ts

// 1. Cüzdan adresini kısaltır (Örn: 0x12...3456)
export const shortenAddress = (address: string) => {
  if (!address) return "";

  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// 2. Tarih ve Saati, Solidity uyumlu Unix Timestamp'e çevirir
export const dateToTimestamp = (dateStr: string, timeStr: string): number => {
    const eventDate = new Date(`${dateStr}T${timeStr}`);
    
    return Math.floor(eventDate.getTime() / 1000);
};