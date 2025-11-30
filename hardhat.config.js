import dotenv from "dotenv";
import { defineConfig } from "hardhat/config";

import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatIgnitionEthers from "@nomicfoundation/hardhat-ignition-ethers";

dotenv.config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// Tek bir profile objesi tanımlıyoruz, hem default hem production bunu kullanacak
const solidityProfile = {
  version: "0.8.23",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    viaIR: true, // ← derleyicinin ısrarla istediği ayar
  },
};

export default defineConfig({
  plugins: [hardhatEthers, hardhatIgnitionEthers],

  // 🔥 Burada artık build profile’ları açıkça override ediyoruz
  solidity: {
    profiles: {
      default: solidityProfile,
      production: solidityProfile,
    },
  },

  networks: {
    sepolia: {
      type: "http",
      chainType: "l1",
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
});