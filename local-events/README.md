# React Native Calendar App

A modern, feature-rich calendar application built with React Native and Expo that allows users to create, view, and manage personal events with a beautiful interface.

## Features

- **Event Management**: Create, view, and manage personal calendar events
- **Native Calendar Integration**: Seamlessly integrates with device calendar systems
- **Cross-Platform Support**: Works on both iOS and Android devices
- **Modern UI**: Clean, intuitive interface with smooth animations and blur effects
- **Local Calendar**: Creates and manages a dedicated local calendar for app events
- **Time Management**: Set specific dates and times for events with native date/time pickers
- **Event Details**: Add titles, descriptions, and timestamps to events
- **Visual Feedback**: Time-until badges show how soon events are approaching
- **Responsive Design**: Adapts to different screen sizes and orientations

## Technical Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Calendar API**: expo-calendar
- **Date/Time Handling**: @react-native-community/datetimepicker
- **UI Effects**: expo-blur for backdrop effects
- **State Management**: React Hooks (useState, useEffect)

## Dependencies

```json
{
  "@react-native-community/datetimepicker": "^7.x.x",
  "expo-blur": "^12.x.x",
  "expo-calendar": "^12.x.x",
  "react": "^18.x.x",
  "react-native": "^0.x.x"
}
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Install Expo CLI if not already installed:
   ```bash
   npm install -g @expo/cli
   ```
4. Start the development server:
   ```bash
   expo start
   ```

## Platform Requirements

- **iOS**: iOS 11.0 or later
- **Android**: Android 6.0 (API level 23) or later
- **Web**: Not supported (Calendar API unavailable)

## Permissions

The app requires the following permissions:

- **Calendar Access**: Required to read and write calendar events
- **Date/Time Access**: For setting event dates and times

Permissions are requested automatically on first launch.

## Project Structure

```
src/
├── components/
│   ├── ThemedText.tsx     # Themed text component
│   └── ThemedView.tsx     # Themed view component
└── screens/
    └── index.tsx          # Main calendar screen
```

## Key Components

### HomeScreen Component

The main screen component that handles:

- Calendar permission management
- Event creation and display
- Date/time picker integration
- Modal-based event creation form
- Local calendar setup and management

### Core Functions

- `initializeCalendar()`: Sets up calendar permissions and creates local calendar
- `ensureLocalCalendar()`: Creates or finds the app's dedicated calendar
- `loadEvents()`: Retrieves and displays events from the calendar
- `createEvent()`: Adds new events to the calendar
- `formatDate()` / `formatTime()`: Formats dates and times for display

## UI Features

### Event Cards
- Display event title, description, date/time
- Show time-until badges for quick reference
- Clean card-based layout with shadows

### Modal Form
- Slide-up modal with blur backdrop
- Form validation for required fields
- Native date/time pickers for each platform
- Loading states during event creation

### Empty States
- Helpful messages when no events exist
- Clear calls-to-action for creating first event

### Floating Action Button
- Always-accessible event creation trigger
- Positioned for thumb-friendly interaction

## Platform-Specific Features

### iOS
- Compact date/time pickers with inline display
- Native blur effects for modal backdrop
- iOS-style calendar integration

### Android
- Native Android date/time picker dialogs
- Material Design-inspired interactions
- Android calendar provider integration

## Error Handling

The app includes comprehensive error handling for:

- Missing calendar permissions
- Platform compatibility issues
- Event creation failures
- Calendar API unavailability

## Styling

The app uses a modern design system with:

- Consistent spacing and typography
- Smooth shadows and elevation
- Responsive layout system
- Platform-appropriate visual elements
- Clean color palette with blue accent colors

## Event Data Model

```typescript
interface EventItem {
  id: string;           // Unique identifier
  title: string;        // Event title
  description: string;  // Event description
  eventDate: Date;      // When the event occurs
  dateCreated: Date;    // When the event was created
}
```

## Configuration

### Calendar Settings
- Events are stored in a dedicated "Local Events" calendar
- Default event duration: 1 hour
- Event range: 30 days past to 90 days future

### UI Configuration
- Modal height: Maximum 85% of screen height
- FAB position: Bottom right with 30px margin
- Card shadows: Subtle elevation with blur

## Development Notes

- Uses TypeScript for type safety
- Implements React Native best practices
- Follows Expo development patterns
- Includes proper memory management
- Responsive to device orientation changes

## Troubleshooting

### Calendar Not Working
- Ensure calendar permissions are granted
- Check device calendar app functionality
- Verify Expo Calendar API compatibility

### Date/Time Issues
- Confirm device date/time settings
- Check timezone handling
- Verify picker component versions

### Performance Issues
- Monitor event list size and pagination needs
- Check for memory leaks in modal handling
- Optimize FlatList rendering if needed

## Future Enhancements

Potential improvements could include:

- Event editing and deletion
- Recurring event support
- Multiple calendar integration
- Event search and filtering
- Push notification reminders
- Export/import functionality
- Dark mode support
- Offline event caching

## License

This project is available for educational and personal use. Please check individual dependency licenses for commercial usage requirements.