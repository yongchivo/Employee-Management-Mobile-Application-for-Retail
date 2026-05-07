# Fichaje App

Mobile application for employee management in retail. Currently developed for a tobacco shop in Spain — handles secure clock-in/out, schedules, and employment documents.

## Tech Stack

- React Native (Expo SDK 54)
- Firebase Authentication + Firestore
- React Navigation

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Firebase credentials
npx expo start
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR with Expo Go.

## Privacy & Security

Handles employee personal data under GDPR. Firebase keys are stored in environment variables and excluded from version control. Data access is enforced via Firestore security rules.

## Status

🚧 In development — MVP focuses on authentication and time tracking.