import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  timestamp: any;
}

interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { db } = useFirebase();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id || !user) return;

    // Listen to chat room details
    const chatRoomRef = doc(db, 'chatRooms', id as string);
    const unsubscribeChatRoom = onSnapshot(chatRoomRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setChatRoom({
          id: doc.id,
          name: data.name,
          participants: data.participants || [],
        });
      }
    });

    // Listen to messages
    const messagesRef = collection(db, 'chatRooms', id as string, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messageList.push({
          id: doc.id,
          text: data.text,
          userId: data.userId,
          userEmail: data.userEmail,
          timestamp: data.timestamp,
        });
      });
      setMessages(messageList);
    });

    return () => {
      unsubscribeChatRoom();
      unsubscribeMessages();
    };
  }, [id, user, db]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;

    setLoading(true);
    try {
      const messagesRef = collection(db, 'chatRooms', id as string, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
      });

      // Update last message in chat room
      const chatRoomRef = doc(db, 'chatRooms', id as string);
      await updateDoc(chatRoomRef, {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add a helper for message status icons
  const getMessageStatusIcon = (status: 'sent' | 'delivered' | 'read') => {
    if (status === 'read') {
      return <Ionicons name="checkmark-done" size={16} color={theme.primary} style={{ marginLeft: 4 }} />;
    } else if (status === 'delivered') {
      return <Ionicons name="checkmark-done" size={16} color={theme.textTertiary} style={{ marginLeft: 4 }} />;
    } else {
      return <Ionicons name="checkmark" size={16} color={theme.textTertiary} style={{ marginLeft: 4 }} />;
    }
  };

  // Add a helper for avatars (placeholder for now)
  const getAvatar = (userId: string) => (
    <View style={styles.avatarWrapper}>
      <LinearGradient
        colors={[theme.primary, theme.primaryDark]}
        style={styles.avatar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="person" size={16} color="white" />
      </LinearGradient>
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.userId === user?.uid;
    // Simulate message status for demo (in real app, use actual status)
    const status: 'sent' | 'delivered' | 'read' = isOwnMessage ? 'read' : 'delivered';
    return (
      <View style={[styles.messageRow, isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow]}>
        {!isOwnMessage && getAvatar(item.userId)}
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble]}>
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>{item.text}</Text>
          <View style={styles.messageMeta}>
            <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>{formatTime(item.timestamp)}</Text>
            {isOwnMessage && getMessageStatusIcon(status)}
          </View>
        </View>
        {isOwnMessage && getAvatar(item.userId)}
      </View>
    );
  };

  const styles = createStyles(theme);

  if (!chatRoom) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="people" size={20} color="white" />
            </LinearGradient>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{chatRoom.name}</Text>
            <Text style={styles.headerStatus}>online</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="call-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="videocam-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.textTertiary} />
              </View>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
        />

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.inputIcon}>
            <Ionicons name="attach" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={theme.inputPlaceholder}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={styles.inputIcon}>
            <Ionicons name="mic" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || loading}
          >
            <LinearGradient
              colors={(!newMessage.trim() || loading) ? [theme.buttonDisabled, theme.buttonDisabled] : [theme.primary, theme.primaryDark]}
              style={styles.sendButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name="send"
                size={20}
                color={newMessage.trim() && !loading ? 'white' : theme.textTertiary}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const createStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.primary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    fontSize: 16,
    color: theme.text,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: theme.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    minHeight: 60,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: screenHeight * 0.6,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: screenWidth * 0.75,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: theme.primary + '20',
    borderTopRightRadius: 4,
    marginLeft: 40,
  },
  otherMessageBubble: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 4,
    marginRight: 40,
    borderWidth: 1,
    borderColor: theme.border,
  },
  messageText: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 2,
    lineHeight: 20,
  },
  ownMessageText: {
    color: theme.text,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 11,
    color: theme.textTertiary,
    marginRight: 2,
  },
  ownMessageTime: {
    color: theme.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    minHeight: 60,
  },
  inputIcon: {
    padding: 8,
    marginHorizontal: 2,
  },
  textInput: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 20,
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginHorizontal: 8,
    maxHeight: 100,
    minHeight: 40,
    color: theme.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 4,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
}); 