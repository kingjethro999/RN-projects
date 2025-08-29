import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apikey } from '@/constants/ApiKey';
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

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    const sessionId = Date.now().toString();
    setCurrentSessionId(sessionId);
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: '# Welcome to AI Chat! 🤖\n\nI\'m here to help you with anything you need. Feel free to ask me questions, request assistance, or just have a conversation!\n\n**Features:**\n- Full markdown support\n- Chat history saved automatically\n- Responsive AI powered by OpenRouter',
      timestamp: Date.now(),
    };
    
    setMessages([welcomeMessage]);
  };

  const saveSession = async (sessionMessages: Message[]) => {
    if (!currentSessionId || sessionMessages.length <= 1) return;

    try {
      const chatSession: ChatSession = {
        id: currentSessionId,
        messages: sessionMessages,
        title: generateSessionTitle(sessionMessages),
        createdAt: parseInt(currentSessionId),
        updatedAt: Date.now(),
      };

      // Save current session
      await AsyncStorage.setItem(`chat_session_${currentSessionId}`, JSON.stringify(chatSession));

      // Update sessions list
      const existingSessions = await AsyncStorage.getItem('chat_sessions');
      const sessionsList = existingSessions ? JSON.parse(existingSessions) : [];
      
      const existingIndex = sessionsList.findIndex((s: any) => s.id === currentSessionId);
      if (existingIndex >= 0) {
        sessionsList[existingIndex] = { id: chatSession.id, title: chatSession.title, updatedAt: chatSession.updatedAt };
      } else {
        sessionsList.unshift({ id: chatSession.id, title: chatSession.title, updatedAt: chatSession.updatedAt });
      }

      await AsyncStorage.setItem('chat_sessions', JSON.stringify(sessionsList));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const generateSessionTitle = (sessionMessages: Message[]): string => {
    const firstUserMessage = sessionMessages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.slice(0, 50);
      return title.length === 50 ? title + '...' : title;
    }
    return 'New Chat';
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apikey}`,
          "HTTP-Referer": "https://your-app.com",
          "X-Title": "AI Chat App",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-chat-v3-0324:free",
          "messages": newMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      await saveSession(finalMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ **Error**: Failed to get response. Please check your internet connection and try again.',
        timestamp: Date.now(),
      };
      
      const errorMessages = [...newMessages, errorMessage];
      setMessages(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const newChat = () => {
    const sessionId = Date.now().toString();
    setCurrentSessionId(sessionId);
    
    const welcomeMessage: Message = {
      id: 'welcome_' + sessionId,
      role: 'assistant',
      content: '# New Chat Started! 🚀\n\nWhat can I help you with today?',
      timestamp: Date.now(),
    };
    
    setMessages([welcomeMessage]);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ThemedView style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      {item.role === 'assistant' ? (
        <Markdown style={markdownStyles}>
          {item.content}
        </Markdown>
      ) : (
        <ThemedText style={styles.messageText}>
          {item.content}
        </ThemedText>
      )}
      <ThemedText style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>AI Chat</ThemedText>
        <TouchableOpacity onPress={newChat} style={styles.newChatButton}>
          <ThemedText style={styles.newChatText}>New Chat</ThemedText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
            maxLength={2000}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.sendButtonText}>Send</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newChatText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginVertical: 5,
    padding: 15,
    borderRadius: 15,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  paragraph: {
    marginBottom: 10,
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  strong: {
    fontWeight: 'bold',
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
    marginBottom: 10,
  },
  ordered_list: {
    marginBottom: 10,
  },
  list_item: {
    marginBottom: 5,
  },
};