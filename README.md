# QuickbillPro

An invoice app built with Expo and React Native.

## Prerequisites
- Node.js >= 18.18.0 (LTS recommended)
- npm >= 9
- Git (optional)

Verify your versions:

PowerShell:
- node -v
- npm -v

If you see "The term 'node.exe' is not recognized" you need to install Node.js or fix your PATH (see Troubleshooting below).

## Install
- npm install

## Start (Offline Friendly)
Network restrictions or corporate proxies can cause Expo CLI to fail while fetching versions. Use the offline scripts to avoid network lookups.

Common commands:
- npm run start           # Normal start
- npm run start:clear     # Clear Metro cache
- npm run start:offline   # Start in offline mode (skips most online checks)
- npm run start:offline:clear  # Offline start + clear cache
- npm run android:offline # Launch on Android in offline mode
- npm run ios:offline     # Launch on iOS in offline mode

On Windows PowerShell, you can also set an environment variable for the current session:
- $env:EXPO_OFFLINE = "1"; npm run start

## Troubleshooting
### Node not recognized on Windows (node.exe not found)
Symptoms:
- & : The term 'node.exe' is not recognized as the name of a cmdlet, function, script file, or operable program.

Fix:
1) Install Node.js LTS from https://nodejs.org/
2) Ensure PATH includes the Node install directory (typically `C:\\Program Files\\nodejs\\`).
   - Check current PATH in PowerShell: $env:Path
   - If missing, add it via Windows Settings > System > About > Advanced system settings > Environment Variables.
3) Close and reopen PowerShell/Terminal, then verify:
   - node -v
   - npm -v

### Expo CLI fetch/undici errors (TypeError: fetch failed)
- Use offline start: npm run start:offline (or start:offline:clear)
- Ensure date/time is correct on your PC
- If behind a proxy, configure npm and environment:
  - npm config set proxy http://your.proxy:port
  - npm config set https-proxy http://your.proxy:port
  - $env:HTTP_PROXY = "http://your.proxy:port"; $env:HTTPS_PROXY = "http://your.proxy:port"

### Clearing cache
- npm run start:clear
- If issues persist: delete the .expo and node_modules folders, then npm install

## Scripts Reference
See package.json scripts for the full list. We added offline variants to reduce network dependence during development.

## License
Proprietary
