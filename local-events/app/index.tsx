import React, { useEffect, useState } from 'react';
import { 
  Platform, 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  Alert,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Calendar from 'expo-calendar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const { width, height } = Dimensions.get('window');

// 📋 BLUEPRINT: What each event looks like
interface EventItem {
  id: string;
  title: string;
  description: string;
  eventDate: Date;
  dateCreated: Date;
}

export default function HomeScreen() {
  //  PERMISSION TRACKING: Does user allow calendar access?
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [apiAvailable, setApiAvailable] = useState<boolean>(Platform.OS !== 'web');
  
  //  CALENDAR DATA: Which calendar we're using and all events
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  
  //  POPUP CONTROL: Show/hide the "create event" form
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  
  //  FORM DATA: What user types in the form
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventTime, setEventTime] = useState<Date>(new Date());
  
  //  UI STATE: Show/hide date/time pickers and loading states
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // STARTUP: Run calendar setup when app opens
  useEffect(() => {
    initializeCalendar();
  }, []);

  //  SETUP FUNCTION: Check permissions and create calendar
  async function initializeCalendar() {
    try {
      // Check if device supports calendar (not web browsers)
      const available = Platform.OS !== 'web' && (await Calendar.isAvailableAsync());
      setApiAvailable(!!available);
      if (!available) return;

      // Ask user for calendar permission
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      // If permission granted, set up calendar and load events
      if (granted) {
        const id = await ensureLocalCalendar();
        setCalendarId(id);
        await loadEvents(id);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  //  CALENDAR CREATION: Find existing "Local Events" calendar or create new one
  async function ensureLocalCalendar(): Promise<string> {
    const existing = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const found = existing.find(c => c.title === 'Local Events' || c.name === 'Local Events');
    if (found) return found.id; // Use existing calendar

    // Create new blue calendar called "Local Events"
    const defaultCalendarSource = Platform.OS === 'ios' 
      ? await getDefaultCalendarSource() 
      : { isLocalAccount: true, name: 'Local Events' };

    const newCalendarID = await Calendar.createCalendarAsync({
      title: 'Local Events',
      color: '#007AFF',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: (defaultCalendarSource as any).id,
      source: defaultCalendarSource as any,
      name: 'Local Events',
      ownerAccount: 'local',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    return newCalendarID;
  }

  //  iOS HELPER: Get default calendar source for iOS
  async function getDefaultCalendarSource() {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.source;
  }

  //  LOAD EVENTS: Get all events from past 30 days to next 90 days
  async function loadEvents(id: string) {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);   // 90 days from now
    const calendarEvents = await Calendar.getEventsAsync([id], start, end);
    
    // Convert calendar events to our format
    const eventItems: EventItem[] = calendarEvents.map(evt => ({
      id: evt.id,
      title: evt.title || 'Untitled Event',
      description: evt.notes || '',
      eventDate: new Date(evt.startDate),
      dateCreated: new Date(evt.creationDate || evt.startDate)
    }));

    // Sort by date (earliest first) and save
    eventItems.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
    setEvents(eventItems);
  }

  //  DATE PICKER: Handle date selection
  function onDateChange(_: DateTimePickerEvent, selectedDate?: Date) {
    if (selectedDate) {
      setEventDate(selectedDate);
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false); // Android auto-closes
    }
  }

  //  TIME PICKER: Handle time selection
  function onTimeChange(_: DateTimePickerEvent, selectedTime?: Date) {
    if (selectedTime) {
      setEventTime(selectedTime);
    }
    if (Platform.OS === 'android') {
      setShowTimePicker(false); // Android auto-closes
    }
  }

  // 🤖 ANDROID PICKER: Special Android date/time picker
  function pickDateTimeAndroid(mode: 'date' | 'time') {
    DateTimePickerAndroid.open({
      value: mode === 'date' ? eventDate : eventTime,
      mode: mode === 'date' ? 'date' : 'time',
      onChange: mode === 'date' ? onDateChange : onTimeChange,
    });
  }

  // 🔓 OPEN FORM: Show create event popup and reset form
  function openModal() {
    setIsModalVisible(true);
    // Clear form for fresh start
    setTitle('');
    setDescription('');
    setEventDate(new Date());
    setEventTime(new Date());
    setShowDatePicker(false);
    setShowTimePicker(false);
  }

  // 🔒 CLOSE FORM: Hide create event popup
  function closeModal() {
    setIsModalVisible(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
  }

  // ✨ CREATE EVENT: Save new event to calendar
  async function createEvent() {
    // Validation: Must have title
    if (!calendarId || !title.trim()) {
      Alert.alert('Missing Information', 'Please enter a title for the event');
      return;
    }

    setIsCreating(true); // Show loading state
    try {
      // Combine selected date and time
      const combinedDateTime = new Date(eventDate);
      combinedDateTime.setHours(eventTime.getHours());
      combinedDateTime.setMinutes(eventTime.getMinutes());
      
      const endDate = new Date(combinedDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      // Save to phone's calendar
      await Calendar.createEventAsync(calendarId, {
        title: title.trim(),
        startDate: combinedDateTime,
        endDate: endDate,
        notes: description.trim() || undefined,
      });

      // Success! Close form and refresh list
      closeModal();
      await loadEvents(calendarId);
      
      Alert.alert('Success! 🎉', 'Your event has been created successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create event');
    } finally {
      setIsCreating(false); // Hide loading state
    }
  }

  // 🎨 FORMATTING HELPERS: Make dates and times look pretty

  function formatDate(date: Date): string {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function formatDateTime(date: Date): string {
    return `${formatDate(date)} at ${formatTime(date)}`;
  }

  function truncateText(text: string, maxLength: number = 80): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // ⏱️ TIME HELPER: Calculate "Today", "Tomorrow", "In 5 days", etc.
  function getTimeUntilEvent(eventDate: Date): string {
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past event';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30)} months`;
  }

  // 📱 EVENT CARD: How each event looks in the list
  const renderEventItem = ({ item }: { item: EventItem }) => (
    <ThemedView style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <ThemedText type="defaultSemiBold" style={styles.eventTitle}>
          {item.title}
        </ThemedText>
        {/* Blue badge showing "Today", "Tomorrow", etc. */}
        <View style={styles.timeUntilBadge}>
          <ThemedText style={styles.timeUntilText}>
            {getTimeUntilEvent(item.eventDate)}
          </ThemedText>
        </View>
      </View>
      
      {/* Description (if exists) */}
      {item.description && (
        <ThemedText style={styles.eventDescription}>
          {truncateText(item.description)}
        </ThemedText>
      )}
      
      {/* Date and time */}
      <View style={styles.eventFooter}>
        <ThemedText style={styles.eventDateTime}>
          📅 {formatDateTime(item.eventDate)}
        </ThemedText>
      </View>
    </ThemedView>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  // 🪟 POPUP FORM: The sliding form to create events
  const renderBottomSheetModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeModal}
    >
      {/* Blurred background */}
      <View style={styles.modalOverlay}>
        <BlurView intensity={125} tint="dark" style={styles.blurView}>
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            onPress={closeModal}
            activeOpacity={1}
          />
        </BlurView>
        
        {/* The actual form */}
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          
          {/* Header with title and X button */}
          <View style={styles.modalHeader}>
            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
              Create New Event
            </ThemedText>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Form fields */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Event title input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Event Title *</ThemedText>
              <TextInput
                placeholder="Enter event title..."
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
            </View>
            
            {/* Event description input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <TextInput
                placeholder="Add event details..."
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.multilineInput]}
              />
            </View>
            
            {/* Date and time selection */}
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeRow}>
                {/* Date picker button */}
                <View style={styles.dateTimeItem}>
                  <ThemedText style={styles.inputLabel}>Date</ThemedText>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        setShowDatePicker(!showDatePicker);
                      } else {
                        pickDateTimeAndroid('date');
                      }
                    }}
                  >
                    <ThemedText style={styles.dateTimeButtonText}>
                      {formatDate(eventDate)}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                
                {/* Time picker button */}
                <View style={styles.dateTimeItem}>
                  <ThemedText style={styles.inputLabel}>Time</ThemedText>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        setShowTimePicker(!showTimePicker);
                      } else {
                        pickDateTimeAndroid('time');
                      }
                    }}
                  >
                    <ThemedText style={styles.dateTimeButtonText}>
                      {formatTime(eventTime)}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* iOS date picker (shows when button tapped) */}
              {Platform.OS === 'ios' && showDatePicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={eventDate}
                    mode="date"
                    onChange={onDateChange}
                    display="compact"
                  />
                </View>
              )}
              
              {/* iOS time picker (shows when button tapped) */}
              {Platform.OS === 'ios' && showTimePicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={eventTime}
                    mode="time"
                    onChange={onTimeChange}
                    display="compact"
                  />
                </View>
              )}
            </View>
            
            {/* Create button */}
            <TouchableOpacity
              style={[
                styles.createButton, 
                (!title.trim() || isCreating) && styles.createButtonDisabled
              ]}
              onPress={createEvent}
              disabled={!title.trim() || isCreating}
            >
              <ThemedText style={styles.createButtonText}>
                {isCreating ? '⏳ Creating Event...' : '🎉 Create Event'}
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ❌ ERROR SCREENS: Show if calendar doesn't work or no permission

  if (!apiAvailable) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ThemedText type="title" style={styles.errorTitle}>
            📅 Calendar Not Available
          </ThemedText>
          <ThemedText style={styles.errorDescription}>
            This platform doesn't support the Calendar API. Please use a mobile device.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!hasPermission) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ThemedText type="title" style={styles.errorTitle}>
            🔒 Permission Required
          </ThemedText>
          <ThemedText style={styles.errorDescription}>
            Calendar access is needed to create and manage your events.
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={initializeCalendar}>
            <ThemedText style={styles.retryButtonText}>Grant Permission</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // 🏠 MAIN SCREEN: The actual app interface
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* App title */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            ✨ My Events
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Your personal events calendar
          </ThemedText>
        </View>
        
        {/* Events list */}
        <ThemedView style={styles.listContainer}>
          <ThemedText type="defaultSemiBold" style={styles.listTitle}>
            Your Upcoming Events ({events.length})
          </ThemedText>
          
          {events.length === 0 ? (
            // Empty state: No events yet
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateTitle}>📝 No Events Yet</ThemedText>
              <ThemedText style={styles.emptyStateDescription}>
                Tap the + button to create your first event!
              </ThemedText>
            </View>
          ) : (
            // List of events
            <FlatList
              data={events}
              renderItem={renderEventItem}
              ItemSeparatorComponent={renderSeparator}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </ThemedView>
      </ScrollView>

      {/* + Button (Floating Action Button) */}
      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create event popup (hidden by default) */}
      {renderBottomSheetModal()}
    </ThemedView>
  );
}

// 🎨 STYLES: How everything looks (colors, sizes, spacing, etc.)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  errorTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 100, // Space for floating + button
  },
  listTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  eventCard: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    flex: 1,
    marginRight: 12,
  },
  timeUntilBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeUntilText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  eventDateTime: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  
  // Floating + button
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
  },

  // Popup form styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTouchable: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#8E8E93',
    fontWeight: '300',
    lineHeight: 20,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  // Form input styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    marginBottom: 24,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  dateTimeItem: {
    flex: 1,
  },
  dateTimeButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerContainer: {
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});