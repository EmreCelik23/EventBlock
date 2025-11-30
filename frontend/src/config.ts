// frontend/src/config.ts

// Adresi Vite env'den alıyoruz (Sepolia)
export const FACTORY_ADDRESS = import.meta.env
  .VITE_EVENT_FACTORY_ADDRESS as `0x${string}`;

// Sepolia RPC (read-only istersen utils'te kullanırız)
export const SEPOLIA_RPC_URL = import.meta.env
  .VITE_SEPOLIA_RPC_URL as string;

// EventFactory ABI (Solidity ile birebir)
export const FACTORY_ABI = [
  "function createEvent(string,string,string,string,string,string,string,string,uint256,uint256,uint256) public",
  "function getDeployedEvents() public view returns (address[])",
];

export const EVENT_ABI = [
  "function name() view returns (string)",
  "function date() view returns (string)",
  "function time() view returns (string)",
  "function imageURL() view returns (string)",
  "function locationName() view returns (string)",
  "function city() view returns (string)",
  "function country() view returns (string)",
  "function mapsLink() view returns (string)",
  "function price() view returns (uint256)",
  "function capacity() view returns (uint256)",
  "function soldCount() view returns (uint256)",
  "function organizer() view returns (address)",
  "function isCancelled() view returns (bool)",
  "function eventTimestamp() view returns (uint256)",
  "function hasTicket(address) view returns (bool)",
  "function isRefunded(address) view returns (bool)",
  "function isTicketUsed(address) view returns (bool)",
  "function buyTicket() external payable",
  "function cancelEvent() external",
  "function getRefund() external",
  "function withdraw() external",
  "function useTicket(address) external",
];

// Ağ bilgileri (Navbar vs. için)
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || "11155111");
export const CHAIN_HEX_ID = "0x" + CHAIN_ID.toString(16); // 0xaa36a7
export const CHAIN_NAME =
  (import.meta.env.VITE_CHAIN_NAME as string) || "Sepolia";

export const BLOCK_EXPLORER_URL =
  (import.meta.env.VITE_BLOCK_EXPLORER_URL as string) ||
  "https://sepolia.etherscan.io";