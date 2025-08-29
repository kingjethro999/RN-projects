# Count App

This is a simple counter app with two tabs:

- Counter: Digital counter with milliseconds (3 digits). Start, Pause/Resume, and Reset.
- History: Shows values saved when you Pause or Reset, including milliseconds. You can Clear the list.

The app persists your current number and your history even if you close it.

## How to open the app (quick)

1) Open this folder on your computer.
2) Open a terminal in this folder.
3) Type these commands (press Enter after each):

```bash
npm install
npm run web
```

After a moment, your browser will open with the app.

More ways to run (device/emulator):

```bash
npm run android   # Android emulator/device
npm run ios       # iOS simulator (macOS)
npm run web       # Web
```

## How to use

- Press Start to begin counting.
- Press Pause to stop. Press Start again to resume.
- Press Reset to set the number back to 0.
- Open the History tab to see recent values saved on Pause/Reset. Use Clear to empty the list.
- History auto-refreshes whenever you open the tab. You can also pull down to refresh.

## What’s new

- Milliseconds display: Counter shows `{count}.{milliseconds}` with three digits (e.g., `12.034`).
- History entries now include milliseconds and render as `value.mmm`.
- Auto-refresh on focus + pull-to-refresh on the History tab.
- Safe areas + dark theme: content avoids system UI (notch/status/nav); white text on black for contrast.

## Implementation details

- Counter screen: `app/(tabs)/index.tsx`
  - Timer: 10ms interval updates `millis` and rolls over to `count` when it reaches 1000.
  - Display: ```${count}.${String(millis).padStart(3, '0')}```.
  - Pause/Reset: Save a history entry to `AsyncStorage` key `count_history` with shape `{ id, value, millis, date, type }` where `type` is `pause` or `reset`. Latest entries appear first and are bounded to 100.
  - Persistence: Current `count` is saved to `AsyncStorage` as `count_value` so the app can restore it. Milliseconds are captured in history entries but not continuously persisted.
  - UX: Haptic feedback on actions via `expo-haptics`.

- History screen: `app/(tabs)/history.tsx`
  - Loads from `count_history` and renders newest first.
  - Auto-refresh: `useFocusEffect(load)` refreshes when the tab gains focus.
  - Pull-to-refresh: `RefreshControl` lets you drag down to reload.
  - Safe area: wrapped in `SafeAreaView` to avoid overlapping the status bar and bottom navigation.
  - Rendering: Shows each entry as ```${value}.${String(millis ?? 0).padStart(3, '0')}```. Older entries created before milliseconds support will show `.000`.

## Data storage keys (AsyncStorage)

- `count_value`: number (latest whole seconds)
- `count_history`: array of `{ id, value, millis, date, type }`

That’s it. No extra steps needed.