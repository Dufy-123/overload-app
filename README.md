# OVERLOAD

A bulk-tracking fitness app: log food by description (manual entry or AI macro estimate), track weight, log workouts with an estimated calorie burn, and see weekly/monthly rollups.

## Setup

```bash
cd overload-app
npm install
cp .env.example .env
```

Edit `.env` and add your Anthropic API key (get one at https://console.anthropic.com/). This key stays server-side — the browser never sees it.

## Run

```bash
npm start
```

Open http://localhost:3000

## Notes

- All your logs (food, weight, workouts, settings) are stored in the browser's `localStorage` — private to this browser/device. Use Settings → "Show backup text" periodically to copy a JSON backup somewhere safe, especially before clearing browser data or switching devices.
- Food macro estimates come from Claude via your own API key, proxied through `server.js` so the key is never exposed to the browser.
- Workout calories burned are estimated from session duration × intensity (MET values from the Compendium of Physical Activities) and your bodyweight — editable before saving.
- No Apple Health / Fitness app integration: browsers can't access iOS HealthKit. Log manually here, or use an iOS Shortcut to also push entries into Health.
