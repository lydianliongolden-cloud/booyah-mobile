# BooYah! Mobile — Build & Release Guide

## Prerequisites

| Tool | Install |
|------|---------|
| Node.js 20+ | Already on your machine if you run this repo |
| EAS CLI | `npm install -g eas-cli` |
| Expo account | Free at https://expo.dev |

---

## Step 1 — Deploy the API Server (do this first)

The mobile app needs a permanent backend URL.

1. Click **Deploy** in Replit on the `API Server` artifact
2. Copy the live URL (looks like `https://api-server-yourname.replit.app`)
3. Open `eas.json` and replace every `your-api-server.replit.app` with your actual URL

---

## Step 2 — Create an Expo Account & Link the Project

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in
eas login

# Inside the booyah-mobile folder, link to Expo
cd artifacts/booyah-mobile
eas init
```

After `eas init`, Expo will print a **Project ID**. Copy it and paste it into `app.json`:
```json
"extra": {
  "eas": {
    "projectId": "PASTE_YOUR_ID_HERE"
  }
}
```

---

## Step 3 — Build for Android (cheapest, fastest)

```bash
cd artifacts/booyah-mobile

# Preview APK — installs directly on any Android phone
eas build --platform android --profile preview
```

When the build finishes (~10–15 min), EAS emails you a download link.  
Share the `.apk` file and anyone with an Android phone can install it.

### For Google Play Store (requires $25 account)
```bash
eas build --platform android --profile production
```
This produces an `.aab` bundle ready to upload to Play Console.

---

## Step 4 — Build for iOS (requires $99 Apple Developer account)

```bash
# Test on your own iPhone via TestFlight
eas build --platform ios --profile preview
```

EAS handles the signing certificates automatically.

### For App Store
```bash
eas build --platform ios --profile production
```

---

## Step 5 — Submit to Stores (optional)

```bash
# Auto-submit to Google Play (after setting up google-service-account.json)
eas submit --platform android

# Auto-submit to Apple App Store
eas submit --platform ios
```

---

## Bundle Identifiers

| Platform | ID |
|----------|----|
| iOS | `com.booyah.app` |
| Android | `com.booyah.app` |

These must be unique across all apps. If `com.booyah.app` is taken, change to something like `com.yourname.booyah` in `app.json` before your first build.

---

## Quick Reference

| Goal | Command |
|------|---------|
| Test on Android phone now | `eas build --platform android --profile preview` |
| Test on iOS simulator | `eas build --platform ios --profile development` |
| Release to Play Store | `eas build --platform android --profile production` |
| Release to App Store | `eas build --platform ios --profile production` |
