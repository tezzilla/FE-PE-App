# CivilPrep mobile app (Expo)

iOS and Android app for CivilPrep, built with Expo SDK 58 and Expo Router. It uses the website's backend through `/api/mobile/*`, so accounts, subscriptions, the question bank, reviewed problem generators, smart practice and readiness are shared with the site.

## Screens

- **Sign in / sign up** (token saved in iOS Keychain / Android Keystore via `expo-secure-store`; localStorage on web)
- **Home**: readiness, exam coverage, reviews due and "focus next" for FE and PE, Smart practice buttons
- **Exam**: topic list with mastery bars
- **Practice**: smart sessions (with "Why this question") or topic practice, worked solutions, reviewer credit

## Run it

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://<your-computer's-LAN-IP>:3000 npx expo start
```

Scan the QR code with **Expo Go** on your phone (same Wi-Fi). Start the website first (`npm run dev` in the repo root). Use your computer's LAN IP, not `localhost`: on a phone, `localhost` is the phone.

Checks: `npx tsc --noEmit` and `npx expo lint`.

## Before the app stores

1. **Expo project:** `npx eas-cli@latest init` links the app to your Expo account and adds `extra.eas.projectId` to `app.json`. Cloud builds, cloud simulators and store submission all need it.
2. **Deployed backend:** set `EXPO_PUBLIC_API_URL` to the live site (HTTPS) in `eas.json` build profiles.
3. **Bundle IDs:** `com.civilprep.app` in `app.json` is a placeholder. Use a reverse-domain ID you own.
4. **Payments (decide before submitting):** Apple and Google have rules about selling digital subscriptions outside their in-app purchase systems, and those rules vary by country and have been changing. The native app currently shows no prices or purchase links; people subscribe on the website and the app unlocks content for their account. Check the current App Store Review Guidelines and Google Play payments policy, or add in-app purchases (for example with RevenueCat), before release.
5. **Build:** `npx eas-cli@latest build --platform all`, then `eas submit`.
