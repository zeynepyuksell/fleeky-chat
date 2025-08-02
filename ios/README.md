# Fleeky Chat 📱

Modern ve kullanıcı dostu bir mobil chat uygulaması. React Native ve Expo kullanılarak geliştirilmiştir.

## 🚀 Özellikler

- **Gerçek Zamanlı Mesajlaşma**: Firebase Firestore ile anlık mesajlaşma
- **Kullanıcı Kimlik Doğrulama**: Firebase Authentication ile güvenli giriş
- **Chat Odaları**: Özel ve genel chat odaları oluşturma
- **Bağlantı Kodu**: Arkadaşlarınızı davet etmek için özel kodlar
- **Tema Desteği**: Açık/koyu tema seçenekleri
- **Çoklu Platform**: iOS, Android ve Web desteği
- **Modern UI/UX**: Expo Linear Gradient ile güzel arayüz

## 📱 Ekran Görüntüleri

[Buraya uygulamanızın ekran görüntülerini ekleyebilirsiniz]

## 🛠️ Teknolojiler

- **React Native** - Mobil uygulama geliştirme
- **Expo** - Geliştirme platformu
- **Firebase** - Backend servisleri (Authentication, Firestore)
- **TypeScript** - Tip güvenliği
- **Expo Router** - Navigasyon
- **React Navigation** - Tab navigasyonu

## 📋 Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn
- Expo CLI
- iOS Simulator (iOS için) veya Android Studio (Android için)

## 🔧 Kurulum

1. **Projeyi klonlayın**
   ```bash
   git clone https://github.com/zeynepyuksell
   cd fleeky-chat
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   # veya
   yarn install
   ```

3. **Firebase yapılandırması**
   - Firebase Console'da yeni bir proje oluşturun
   - Authentication ve Firestore'u etkinleştirin
   - `config/firebase.ts` dosyasındaki yapılandırmayı kendi Firebase projenizle güncelleyin

4. **Uygulamayı başlatın**
   ```bash
   npm start
   # veya
   yarn start
   ```

## 🚀 Çalıştırma

### Geliştirme Modu
```bash
npm start
```

### Platform Spesifik
```bash
# iOS
npm run ios

# Android
npm run android
```

## 📁 Proje Yapısı

```
fleeky-chat/
├── app/                    # Expo Router sayfaları
│   ├── (auth)/            # Kimlik doğrulama sayfaları
│   ├── (tabs)/            # Tab navigasyonu
│   └── chat/              # Chat sayfaları
├── components/            # Yeniden kullanılabilir bileşenler
├── contexts/              # React Context'ler
├── config/               # Yapılandırma dosyaları
├── assets/               # Resimler ve ikonlar
└── ios/                  # iOS native dosyaları
```

## 🔐 Firebase Yapılandırması

Uygulamanın çalışması için Firebase yapılandırması gereklidir:

1. Firebase Console'da proje oluşturun
2. Authentication'ı etkinleştirin (Email/Password)
3. Firestore Database'i oluşturun
4. `config/firebase.ts` dosyasını güncelleyin

## 📱 Kullanım

1. **Kayıt Olun**: Email ve şifre ile hesap oluşturun
2. **Giriş Yapın**: Mevcut hesabınızla giriş yapın
3. **Chat Odası Oluşturun**: Yeni bir chat odası oluşturun veya mevcut birine katılın
4. **Mesajlaşın**: Gerçek zamanlı olarak mesajlaşın
5. **Arkadaş Davet Edin**: Bağlantı kodu ile arkadaşlarınızı davet edin

## 🎨 Tema Sistemi

Uygulama açık ve koyu tema desteği sunar:
- Otomatik tema algılama
- Manuel tema değiştirme
- Platform tema ayarlarına uyum

## 🔧 Geliştirme

### Yeni Özellik Ekleme
1. Feature branch oluşturun
2. Kodunuzu yazın
3. Test edin
4. Pull request oluşturun

### Kod Stili
- TypeScript kullanın
- ESLint kurallarına uyun
- Component'leri ayrı dosyalarda tutun
```

## 🙏 Teşekkürler

- [Expo](https://expo.dev/) - Harika geliştirme platformu
- [Firebase](https://firebase.google.com/) - Güçlü backend servisleri
- [React Native](https://reactnative.dev/) - Mobil uygulama geliştirme



