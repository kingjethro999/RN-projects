# FlatList and JSX Tags Guide (for app/index.tsx)

## What is FlatList?
- "FlatList" is React Native’s high-performance list component for rendering large, scrollable lists of data efficiently.
- It virtualizes rows (only renders what’s visible plus a buffer) to reduce memory and re-render cost.
- Prefer FlatList over mapping arrays inside a ScrollView when your list can grow or change.

### Key props used in this project
```tsx
<FlatList
  data={events}                        // Array of items to render
  renderItem={renderEventItem}         // Function that returns the JSX for each row
  keyExtractor={(item) => item.id}     // Unique key per item for diffing
  ItemSeparatorComponent={renderSeparator} // Small component between rows
  showsVerticalScrollIndicator={false} // Hide scroll bar for cleaner UI
  scrollEnabled={false}                // Disable internal scroll (parent ScrollView handles scrolling)
/>
```

- When `scrollEnabled` is false here, the outer `ScrollView` handles the page scroll (because the list is short and embedded in a larger screen).
- For long lists, remove the outer `ScrollView` and let `FlatList` manage scrolling by itself.

---

## Components/Tags used in `app/index.tsx`

### Core React
- `React`, `useState`, `useEffect`: Build components, store state, and run side-effects (e.g., initializing calendar on mount).

### React Native primitives
- `View`: Box/container for layout.
- `Text`: Display inline or block text.
- `TextInput`: Editable text field (used for title/description).
- `TouchableOpacity`: Pressable area with fade feedback.
- `ScrollView`: Scrollable container for content that can be taller than the screen.
- `FlatList`: Efficient list rendering (see above).
- `Modal`: Native modal overlay (used for the bottom sheet form).
- `Alert`: Native alert dialog for notifications/errors.
- `StyleSheet`: Helper to create and validate styles.
- `Dimensions`: Access device screen size (used to cap bottom sheet height).
- `Platform`: Detect platform (`ios`, `android`, `web`) to branch logic.

### Theming
- `ThemedView` (from `@/components/ThemedView`): Likely wraps `View` with color scheme awareness (light/dark).
- `ThemedText` (from `@/components/ThemedText`): Likely wraps `Text` with theme styles and optional `type` props.

### Visual effects
- `BlurView` (from `expo-blur`): Adds a platform blur effect behind the modal for depth and focus.

### Date/Time picking
- `DateTimePicker` (from `@react-native-community/datetimepicker`): Inline picker used on iOS for date or time.
- `DateTimePickerAndroid.open(...)`: Imperative API to open Android’s native date/time dialogs.

### Calendar integration
- `expo-calendar`: Native calendar API to read/write calendars and events.
  - `Calendar.isAvailableAsync()`: Checks if the device supports the API.
  - `Calendar.requestCalendarPermissionsAsync()`: Requests user permission.
  - `Calendar.getCalendarsAsync(...)`: Lists available calendars.
  - `Calendar.createCalendarAsync(...)`: Creates a custom calendar ("Local Events").
  - `Calendar.getEventsAsync([id], start, end)`: Fetches events in a date range.
  - `Calendar.createEventAsync(calendarId, event)`: Writes a new event.

---

## Common props explained (quick reference)

### FlatList
- `data`: Array of items.
- `renderItem`: `({ item, index, separators }) => JSX` renderer.
- `keyExtractor`: `(item, index) => string` unique key.
- `ItemSeparatorComponent`: Component between rows.
- `ListEmptyComponent`: Optional component when `data` is empty.
- `onEndReached`: Pagination trigger near the bottom.

### Modal
- `visible`: Show/hide the modal.
- `transparent`: Allow seeing content behind the modal (true for custom sheets).
- `animationType`: `'none' | 'slide' | 'fade'`.
- `onRequestClose`: Required on Android for back button handling.

### TextInput
- `value` / `onChangeText`: Controlled input.
- `placeholder` / `placeholderTextColor`: Input hint.
- `multiline`, `numberOfLines`: Multi-line behavior.
- `style`: Style object/array.

### TouchableOpacity
- `onPress`: Press handler.
- `activeOpacity`: Opacity on press (defaults to 0.2).
- `style`: Style object/array.

### DateTimePicker (iOS inline usage here)
- `value`: Date object shown by the picker.
- `mode`: `'date' | 'time'`.
- `onChange`: Callback for selection.
- `display`: `'default' | 'spinner' | 'compact'` (compact used here).

### DateTimePickerAndroid.open (Android)
- `value`: Date.
- `mode`: `'date' | 'time'`.
- `onChange`: Selection handler.

### Dimensions
- `Dimensions.get('window')`: Returns `{ width, height, scale, fontScale }` of the screen.

### Platform
- `Platform.OS`: Current platform (`'ios' | 'android' | 'web'`).
- Use to branch behavior (e.g., inline picker vs native dialog).

---

## Where these appear in your code (`app/index.tsx`)
- `FlatList`: Renders `events` with `renderEventItem` and a `renderSeparator`.
- `Modal` + `BlurView`: Bottom sheet style modal with blurred backdrop for creating a new event.
- `TextInput`: Event title and description fields.
- `TouchableOpacity`: FAB (+), date/time buttons, close icon, and create button.
- `DateTimePicker` (iOS) vs `DateTimePickerAndroid.open` (Android): Platform-specific pickers.
- `Calendar` (expo-calendar): Permission + calendar bootstrap, loading events, creating events.
- `Platform` / `Dimensions`: Platform gating and bottom sheet sizing.

---

## Quick FlatList vs ScrollView guidance
- Use `ScrollView` for small, static content that won’t grow large.
- Use `FlatList` for lists that can grow or change, benefit from virtualization, and need item separators, headers/footers, or pagination.
- Avoid nesting a scrollable `FlatList` inside a `ScrollView` unless you disable one scroll (as done here with `scrollEnabled={false}`).

---

## Small examples

### Minimal FlatList
```tsx
const data = [{ id: '1', title: 'Item 1' }, { id: '2', title: 'Item 2' }];

<FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <Text>{item.title}</Text>
  )}
/>
```

### Modal with bottom sheet styling (like your code)
```tsx
<Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
  <View style={{ flex: 1, justifyContent: 'flex-end' }}>
    <BlurView intensity={125} style={StyleSheet.absoluteFillObject} />
    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
      {/* content */}
    </View>
  </View>
</Modal>
```

---

## Takeaways for interviews
- FlatList is for performance with large/variable lists (virtualized, windowed).
- Modal + BlurView for focus and depth in creation flows.
- Platform branching keeps UX native (iOS inline pickers vs Android system dialogs).
- expo-calendar integration shows capability to provision calendars and manage events.
