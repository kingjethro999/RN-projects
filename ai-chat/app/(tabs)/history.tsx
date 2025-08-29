import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
  TextStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Markdown from 'react-native-markdown-display';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  messages: Message[];
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface SessionListItem {
  id: string;
  title: string;
  updatedAt: number;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const sessionsData = await AsyncStorage.getItem('chat_sessions');
      if (sessionsData) {
        const sessionsList: SessionListItem[] = JSON.parse(sessionsData);
        // Sort by most recently updated
        sessionsList.sort((a, b) => b.updatedAt - a.updatedAt);
        setSessions(sessionsList);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      Alert.alert('Error', 'Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, []);

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const sessionData = await AsyncStorage.getItem(`chat_session_${sessionId}`);
      if (sessionData) {
        const session: ChatSession = JSON.parse(sessionData);
        setSelectedSession(session);
      }
    } catch (error) {
      console.error('Failed to load session details:', error);
      Alert.alert('Error', 'Failed to load chat details');
    }
  };

  const deleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove session data
              await AsyncStorage.removeItem(`chat_session_${sessionId}`);
              
              // Update sessions list
              const updatedSessions = sessions.filter(s => s.id !== sessionId);
              setSessions(updatedSessions);
              await AsyncStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
              
              // Clear selected session if it's the deleted one
              if (selectedSession?.id === sessionId) {
                setSelectedSession(null);
              }
            } catch (error) {
              console.error('Failed to delete session:', error);
              Alert.alert('Error', 'Failed to delete chat');
            }
          },
        },
      ]
    );
  };

  const clearAllHistory = async () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all chat history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all session data
              for (const session of sessions) {
                await AsyncStorage.removeItem(`chat_session_${session.id}`);
              }
              
              // Clear sessions list
              await AsyncStorage.removeItem('chat_sessions');
              setSessions([]);
              setSelectedSession(null);
            } catch (error) {
              console.error('Failed to clear history:', error);
              Alert.alert('Error', 'Failed to clear chat history');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderSessionItem = ({ item }: { item: SessionListItem }) => (
    <TouchableOpacity
      style={[
        styles.sessionItem,
        selectedSession?.id === item.id && styles.selectedSessionItem
      ]}
      onPress={() => loadSessionDetails(item.id)}
      onLongPress={() => deleteSession(item.id)}
    >
      <View style={styles.sessionContent}>
        <ThemedText style={styles.sessionTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.sessionDate}>
          {formatDate(item.updatedAt)}
        </ThemedText>
      </View>
      <IconSymbol
        name="chevron.right"
        size={16}
        color="#999"
      />
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={styles.messageHeader}>
        <ThemedText style={styles.messageRole}>
          {item.role === 'user' ? '👤 You' : '🤖 Assistant'}
        </ThemedText>
        <ThemedText style={styles.messageTimestamp}>
          {new Date(item.timestamp).toLocaleString()}
        </ThemedText>
      </View>
      
      {item.role === 'assistant' ? (
        <Markdown style={markdownStyles}>
          {item.content}
        </Markdown>
      ) : (
        <ThemedText style={styles.messageText}>
          {item.content}
        </ThemedText>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyState}>
      <IconSymbol
        name="bubble.left.and.bubble.right"
        size={80}
        color="#ccc"
        style={styles.emptyIcon}
      />
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No Chat History
      </ThemedText>
      <ThemedText style={styles.emptyDescription}>
        Your chat conversations will appear here once you start chatting with the AI assistant.
      </ThemedText>
    </ThemedView>
  );

  if (selectedSession) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedSession(null)}
          >
            <IconSymbol name="chevron.left" size={20} color="#007AFF" />
            <ThemedText style={styles.backText}>Back</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.detailTitle} numberOfLines={1}>
            {selectedSession.title}
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
        
        <FlatList
          data={selectedSession.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconSymbol
            name="clock"
            size={24}
            color="#007AFF"
            style={styles.headerIcon}
          />
          <ThemedText type="title">Chat History</ThemedText>
        </View>
        {sessions.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllHistory}
          >
            <ThemedText style={styles.clearButtonText}>Clear All</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {sessions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          style={styles.sessionsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
          contentContainerStyle={styles.sessionsContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionsList: {
    flex: 1,
  },
  sessionsContent: {
    paddingVertical: 10,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedSessionItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  sessionContent: {
    flex: 1,
    marginRight: 10,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  sessionDate: {
    fontSize: 14,
    opacity: 0.6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 5,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 2,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
    borderColor: '#bbdefb',
  },
  assistantMessage: {
    backgroundColor: '#f1f8e9',
    borderColor: '#c8e6c9',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  messageRole: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageTimestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 22,
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  heading1: {
    fontSize: 22,
    fontWeight: 'bold' as TextStyle['fontWeight'],
    marginBottom: 8,
    color: '#333',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold' as TextStyle['fontWeight'],
    marginBottom: 6,
    color: '#333',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold' as TextStyle['fontWeight'],
    marginBottom: 4,
    color: '#333',
  },
  paragraph: {
    marginBottom: 8,
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  strong: {
    fontWeight: 'bold' as TextStyle['fontWeight'],
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    marginVertical: 5,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 3,
  },
};