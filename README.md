# MediConnect – Telemedicine React Native App (Expo)

> **A professional-grade telemedicine scaffold** built with React Native, Expo, TypeScript, React Navigation, and Context API.

---

## 📱 Screenshots & Features

| Screen | Description |
|--------|-------------|
| **Login / Signup** | JWT-based auth with form validation & password strength meter |
| **Home** | Dashboard with emergency, consultation & symptom-check quick actions |
| **Symptom Triage** | AI-powered chat bot that assesses severity and routes to appropriate care |
| **Doctor List** | Searchable, filterable list with consultation type, sort & availability filters |
| **Doctor Profile** | Full profile with slots, qualifications, ratings, and booking |
| **Book Appointment** | Date/time selection, consultation type, fee summary, and confirmation |
| **Chat** | Real-time doctor–patient chat with typing indicators |
| **Video Call** | Mock video consultation UI with call controls |
| **Emergency** | Geolocation-sorted EMS info with quick-dial buttons |
| **Appointments** | Upcoming / past / cancelled tabs with join & cancel actions |
| **Profile** | Health overview, allergies, emergency contacts, settings |
| **Settings** | Language switcher (EN / ES), toggles, legal links |

---

## 🏗️ Project Structure

```
Travel_project/
├── client/                     # Telemedicine React Native mobile app (Expo)
│   ├── App.tsx                 # Entry point – fonts + providers
│   ├── app.json                # Expo config (permissions, icons)
│   ├── eas.json                # EAS build profiles
│   ├── jest.config.js          # Jest configuration
│   ├── tsconfig.json           # TypeScript config
│   ├── assets/                 # App icons and splash screens
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── context/            # React context providers
│       ├── data/               # Mock data & fallback schemas
│       ├── hooks/              # Custom data-fetching hooks
│       ├── navigation/         # React Navigation stacks & tabs
│       ├── screens/            # Screen views
│       ├── services/           # Axios API services
│       └── types/              # TypeScript definitions
│
├── server/                     # Backend REST API (Node.js + Express)
│   ├── server.js               # Server entry point
│   ├── package.json            # Server dependencies (Express, CORS, Morgan)
│   ├── .env.example            # Environment variable template
│   └── src/
│       ├── app.js              # Express app configuration & middlewares
│       ├── routes/             # API routes (auth, doctors, appointments)
│       ├── controllers/        # Route controllers
│       └── data/               # Seed & mock data
│
├── package.json                # Root scripts (run client & server)
├── .gitignore                  # Monorepo git ignore rules
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your device **or** Android emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mediconnect.git
cd mediconnect

# Install dependencies
npm install

# Start the dev server
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android / `i` for iOS simulator.

---

## 🔐 Authentication (Demo)

The app uses a **mock authentication** layer. To sign in:

- **Email:** any valid email address
- **Password:** any password ≥ 6 characters

To replace with real auth, update `src/context/AuthContext.tsx` → `login()` / `signup()` methods with your Firebase or Auth0 SDK calls.

---

## 🌍 Localization

Powered by [`i18n-js`](https://github.com/fnando/i18n-js).

Supported locales:
- 🇺🇸 **English** (`en`) – default
- 🇪🇸 **Spanish** (`es`)

The device locale is auto-detected. Users can switch manually in **Settings → Language**.

To add a new language, add a new key in `src/localization/i18n.ts`:
```ts
translations.fr = { auth: { login: 'Se connecter', … }, … };
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

Test files live in `__tests__/`:
- `utils/helpers.test.ts` – 30+ unit tests for helper functions
- `components/DoctorCard.test.tsx` – component interaction tests + snapshot

---

## 🏗️ Building for Production

### EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build Android APK (preview)
eas build --platform android --profile preview

# Build for production
eas build --platform all --profile production
```

### Classic Expo Build (deprecated)

```bash
expo build:android
expo build:ios
```

---

## ⚙️ CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR to `main` or `develop`:

1. **Lint** – ESLint + TypeScript type-check
2. **Test** – Jest with coverage upload to Codecov
3. **EAS Build** – Android preview build (main branch only)

Required GitHub Secrets:
- `EXPO_TOKEN` – from `eas.dev` or `expo.dev` account
- `CODECOV_TOKEN` – from codecov.io (optional)

---

## 🔌 API Integration Guide

All API calls are in `src/services/api.ts`. Each method currently returns **mock data** after a simulated delay.

### Replacing with real endpoints:

```ts
// DoctorService.getDoctors – replace mock with:
return apiClient.get('/doctors', { params: filter }).then(r => r.data);

// AppointmentService.createAppointment – replace mock with:
return apiClient.post('/appointments', data).then(r => r.data);
```

### Real-time features (production):
- **Video/Chat** – Integrate [Twilio Video SDK](https://www.twilio.com/docs/video) or [LiveKit](https://livekit.io/)
- **Push Notifications** – [Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
- **Maps** – Already configured with `react-native-maps`; add your Google Maps API key to `app.json`

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` | Core Expo SDK |
| `@react-navigation/*` | Stack + bottom tab navigation |
| `expo-linear-gradient` | Gradient backgrounds |
| `expo-location` | Geolocation for emergency services |
| `expo-font` + `@expo-google-fonts/inter` | Inter typeface |
| `axios` | HTTP client |
| `i18n-js` + `expo-localization` | Internationalization |
| `@react-native-async-storage/async-storage` | Session persistence |
| `react-native-gesture-handler` | Touch/swipe support |
| `react-native-safe-area-context` | Safe area insets |

---

## 📄 License

MIT © 2026 MediConnect
