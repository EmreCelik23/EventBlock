# EventBlock 🎟️

**Blokzincir Tabanlı Merkeziyetsiz Etkinlik ve Biletleme Platformu**

> *"Bilet, sadece bir kağıt parçası değil; bir deneyime giriş sertifikasıdır."*

EventBlock; merkezi biletleme şirketlerinin yüksek komisyon oranlarına, karaborsa satışlarına ve şeffaflık sorunlarına çözüm getiren, Ethereum (Sepolia) ağı üzerinde çalışan yeni nesil bir biletleme platformudur. **TrustCert** standartlarına uygun olarak, her bilet blokzincir üzerinde izlenebilir ve kopyalanamaz bir varlık olarak üretilir.

## 🌟 Projenin Amacı

Geleneksel biletleme sistemlerindeki "aracı" kavramını ortadan kaldırmak.

  * **Organizatörler:** Doğrudan hedef kitlelerine ulaşır, anlık ödeme alır ve bilet sahteciliğinden kurtulur.
  * **Kullanıcılar:** Satın aldıkları biletin geçerliliğinden %100 emin olur ve fahiş hizmet bedelleri ödemez.

## 🚀 Özellikler

### 👤 Kullanıcılar İçin

  * **Güvenli Satın Alma:** MetaMask cüzdanı ile saniyeler içinde ETH kullanarak bilet alma.
  * **QR Kod ile Giriş:** Kriptografik imzalarla (Off-chain imza, On-chain doğrulama) üretilen dinamik QR kodlar.
  * **Şeffaf İade:** İptal edilen etkinliklerde akıllı kontrat üzerinden güvenli iade garantisi.
  * **Cüzdanım:** Geçmiş ve aktif biletlerinizi görüntüleyebileceğiniz dijital arşiv.
  * **Harita Entegrasyonu:** Etkinlik konumlarını harita üzerinde görme.

### 💼 Organizatörler İçin

  * **Etkinlik Paneli:** Toplam hasılat, satılan bilet sayısı ve doluluk oranlarını anlık takip etme.
  * **Hasılat Çekimi:** Etkinlik tamamlandığında biriken ETH'yi tek tıkla cüzdana çekme.
  * **QR Tarayıcı (Terminal):** Kapıda bilet kontrolü için dahili QR okuyucu ve doğrulama sistemi.
  * **Etkinlik Yönetimi:** Görsel, konum, tarih ve kapasite ayarlarıyla etkinlik oluşturma veya iptal etme.

## 🛠️ Teknolojiler

Bu proje modern Web3 ve Frontend teknolojileri kullanılarak geliştirilmiştir:

  * **Blockchain:** Ethereum (Sepolia Testnet), Solidity, Hardhat.
  * **Frontend:** React (TypeScript), Vite.
  * **Web3 Entegrasyonu:** Ethers.js v6.
  * **Harita:** React Leaflet & OpenStreetMap.
  * **UI/UX:** Responsive CSS Modules, React Toastify (Bildirimler).
  * **Güvenlik:** EIP-712 standardına benzer kriptografik imza doğrulama mekanizması.

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

### 1\. Projeyi Klonlayın

```bash
git clone https://github.com/kullaniciadi/eventblock.git
cd eventblock
```

### 2\. Bağımlılıkları Yükleyin

```bash
npm install
# veya
yarn install
```

### 3\. Ortam Değişkenlerini Ayarlayın

`src/config.ts` dosyası içerisindeki kontrat adreslerinin güncel olduğundan emin olun. Eğer kendi kontratlarınızı deploy edecekseniz Hardhat ile deploy ettikten sonra adresleri güncelleyin.

### 4\. Uygulamayı Başlatın

```bash
npm start
# veya
npm run dev
```

Tarayıcınızda `http://localhost:3000` (veya `5173`) adresine gidin.

## 🏗️ Akıllı Kontrat Mimarisi

Sistem **Factory Pattern** kullanılarak tasarlanmıştır:

1.  **EventFactory:** Ana fabrika kontratıdır. Yeni etkinliklerin deploy edilmesini ve kayıt altına alınmasını sağlar.
2.  **EventContract:** Her etkinlik için `Factory` tarafından ayrı ayrı üretilen kontratlardır. Bilet satış mantığı, bakiye yönetimi ve bilet sahipliği verileri burada tutulur.

## 📱 Mobil Uyumluluk

EventBlock, mobil öncelikli (mobile-first) bir yaklaşımla tasarlanmamış olsa da, tüm arayüzler (Biletlerim, Etkinlik Oluşturma, QR Tarayıcı) mobil cihazlarda kusursuz çalışacak şekilde responsive (duyarlı) hale getirilmiştir.

## 🤝 Katkıda Bulunma

1.  Bu projeyi Fork'layın.
2.  Yeni bir özellik dalı oluşturun (`git checkout -b yeni-ozellik`).
3.  Değişikliklerinizi Commit edin (`git commit -m 'Yeni özellik eklendi'`).
4.  Dalınızı Push edin (`git push origin yeni-ozellik`).
5.  Bir Pull Request oluşturun.

-----

EventBlock © 2025 - Blockchain ile Güvenli Eğlence
