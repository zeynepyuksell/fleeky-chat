import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useFirebase } from "../../contexts/FirebaseContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";

const { width } = Dimensions.get("window");

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: any;
  participants: string[];
  isPublic?: boolean;
  connectionCode?: string;
}

export default function ChatsScreen() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showConnectionCode, setShowConnectionCode] = useState(false);
  const [connectionCode, setConnectionCode] = useState("");
  const [newlyCreatedChat, setNewlyCreatedChat] = useState<ChatRoom | null>(
    null
  );
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joiningChat, setJoiningChat] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [showDeleteChat, setShowDeleteChat] = useState(false);
  const [chatRoomId, setChatRoomId] = useState("");
  const { user } = useAuth();
  const { db } = useFirebase();
  const { theme } = useTheme();
  const router = useRouter();

  // Generate a random 6-character connection code
  const generateConnectionCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    if (!user) return;

    console.log("🔍 Fetching chat rooms for user:", user.uid);

    // Create a more robust query that handles missing lastMessageTime
    const q = query(collection(db, "chatRooms"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rooms: ChatRoom[] = [];
        console.log("📋 Total chat rooms in database:", snapshot.size);

        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(
            "🏠 Chat room:",
            doc.id,
            "Name:",
            data.name,
            "Public:",
            data.isPublic,
            "Participants:",
            data.participants
          );

          // Show chat rooms where the current user is a participant OR if it's a public room
          if (data.participants?.includes(user.uid) || data.isPublic) {
            console.log("✅ Adding chat room to list:", data.name);
            rooms.push({
              id: doc.id,
              name: data.name,
              lastMessage: data.lastMessage,
              lastMessageTime: data.lastMessageTime,
              participants: data.participants || [],
              isPublic: data.isPublic || false,
              connectionCode: data.connectionCode,
            });
          } else {
            console.log(
              "❌ Skipping chat room:",
              data.name,
              "- User not participant and not public"
            );
          }
        });

        console.log("📱 Final chat rooms for user:", rooms.length);

        // Sort rooms by lastMessageTime (newest first)
        const sortedRooms = rooms.sort((a, b) => {
          if (!a.lastMessageTime && !b.lastMessageTime) return 0;
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return (
            b.lastMessageTime.toDate().getTime() -
            a.lastMessageTime.toDate().getTime()
          );
        });

        setChatRooms(sortedRooms);
      },
      (error) => {
        console.error("🔥 Firestore error:", error);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  const deleteChatRoom = async (chatRoomId: string) => {
    try {
      setDeletingChat(true);
      await deleteDoc(doc(db, "chatRooms", chatRoomId));
      Alert.alert("Success", "Chat room deleted successfully");
      setDeletingChat(false);
    } catch (error) {
      console.error("❌ Error deleting chat room:", error);
      Alert.alert("Error", "Failed to delete chat room");
    } finally {
      setDeletingChat(false);
      setShowDeleteChat(false);
    }
  };

  const createChatRoom = async () => {
    if (!newChatName.trim()) {
      Alert.alert("Error", "Please enter a chat room name");
      return;
    }

    console.log(
      "🚀 Creating chat room:",
      newChatName,
      "Public:",
      isPublic,
      "User:",
      user?.uid
    );

    try {
      const chatRoomData: any = {
        name: newChatName.trim(),
        participants: [user?.uid],
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
      };

      // If public, mark it as such
      if (isPublic) {
        chatRoomData.isPublic = true;
        console.log("🌍 Creating PUBLIC chat room");
      } else {
        // Generate connection code for private chats
        const code = generateConnectionCode();
        chatRoomData.connectionCode = code;
        setConnectionCode(code);
        console.log("🔒 Creating PRIVATE chat room with code:", code);
      }

      const docRef = await addDoc(collection(db, "chatRooms"), chatRoomData);
      console.log("✅ Chat room created with ID:", docRef.id);

      // Store the newly created chat for showing connection code
      const newChat: ChatRoom = {
        id: docRef.id,
        name: newChatName.trim(),
        participants: [user?.uid || ""],
        isPublic: isPublic,
        connectionCode: isPublic ? undefined : connectionCode,
      };
      setNewlyCreatedChat(newChat);

      setNewChatName("");
      setIsPublic(false);
      setModalVisible(false);

      // Show connection code modal for private chats
      if (!isPublic) {
        setShowConnectionCode(true);
      }
    } catch (error) {
      console.error("❌ Error creating chat room:", error);
      Alert.alert("Error", "Failed to create chat room");
    }
  };

  const copyConnectionCode = async () => {
    try {
      await Clipboard.setStringAsync(connectionCode);
      Alert.alert("Success", "Connection code copied to clipboard!");
    } catch (error) {
      Alert.alert("Error", "Failed to copy connection code");
    }
  };

  const joinByCode = async () => {
    if (!joinCode.trim() || !user) {
      Alert.alert("Error", "Please enter a valid connection code");
      return;
    }

    setJoiningChat(true);
    try {
      // Find chat room with the given connection code
      const chatRoomsRef = collection(db, "chatRooms");
      const q = query(chatRoomsRef);
      const snapshot = await getDocs(q);

      let foundChatRoom: any = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.connectionCode === joinCode.trim().toUpperCase()) {
          foundChatRoom = { id: doc.id, ...data };
        }
      });

      if (!foundChatRoom) {
        Alert.alert(
          "Error",
          "Invalid connection code. Please check and try again."
        );
        return;
      }

      // Check if user is already a participant
      if (foundChatRoom.participants?.includes(user.uid)) {
        Alert.alert("Info", "You are already a member of this chat room.");
        setShowJoinByCode(false);
        setJoinCode("");
        return;
      }

      // Add user to the chat room
      const chatRoomRef = doc(db, "chatRooms", foundChatRoom.id);
      const currentParticipants = foundChatRoom.participants || [];
      await updateDoc(chatRoomRef, {
        participants: [...currentParticipants, user.uid],
      });

      Alert.alert("Success", `You have joined "${foundChatRoom.name}"!`);
      setShowJoinByCode(false);
      setJoinCode("");
    } catch (error) {
      console.error("❌ Error joining chat room:", error);
      Alert.alert("Error", "Failed to join chat room");
    } finally {
      setJoiningChat(false);
    }
  };

  const joinPublicChat = async (chatRoomId: string) => {
    console.log("🤝 Joining public chat:", chatRoomId, "User:", user?.uid);

    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);

      if (chatRoomDoc.exists()) {
        const data = chatRoomDoc.data();
        const participants = data.participants || [];
        console.log("👥 Current participants:", participants);

        // Add current user to participants if not already there
        if (user?.uid && !participants.includes(user.uid)) {
          console.log("➕ Adding user to participants");
          await updateDoc(chatRoomRef, {
            participants: [...participants, user.uid],
          });
          console.log("✅ User added to chat room");
        } else {
          console.log("ℹ️ User already in chat room or no user ID");
        }
      }
    } catch (error) {
      console.error("❌ Error joining chat room:", error);
      Alert.alert("Error", "Failed to join chat room");
    }
  };

  const createTestChatRoom = async () => {
    console.log("🧪 Creating test chat room for debugging");

    try {
      const testChatData = {
        name: "Test Chat Room",
        participants: [],
        isPublic: true,
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        lastMessage: "Test room created for debugging",
      };

      const docRef = await addDoc(collection(db, "chatRooms"), testChatData);
      console.log("✅ Test chat room created with ID:", docRef.id);
      Alert.alert(
        "Success",
        "Test chat room created! Other users should see it now."
      );
    } catch (error) {
      console.error("❌ Error creating test chat room:", error);
      Alert.alert("Error", "Failed to create test chat room");
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const isParticipant = user?.uid
      ? item.participants?.includes(user.uid)
      : false;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          if (isParticipant) {
            router.push(`/chat/${item.id}`);
          } else {
            joinPublicChat(item.id);
          }
        }}
        activeOpacity={0.7}
        onLongPress={() => {
          setShowDeleteChat(true);
          setChatRoomId(item.id);
        }}
      >
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>
            {item.name}
            {item.isPublic && !isParticipant && (
              <Text style={styles.publicBadge}> (Public - Tap to Join)</Text>
            )}
            {!item.isPublic && item.connectionCode && (
              <Text style={styles.privateBadge}> (Private)</Text>
            )}
          </Text>
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
        </View>
        {item.lastMessageTime && (
          <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
        )}
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      </TouchableOpacity>
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header with Join by Code button when chats exist */}
      {chatRooms.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
          <TouchableOpacity
            style={styles.headerJoinButton}
            onPress={() => setShowJoinByCode(true)}
          >
            <Ionicons name="key" size={20} color={theme.primary} />
            <Text style={styles.headerJoinButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={
          chatRooms.length === 0 ? styles.emptyListContainer : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={64}
                color={theme.textTertiary}
              />
            </View>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>
              Create a new chat or join an existing one
            </Text>
            <View style={styles.emptyButtons}>
              <TouchableOpacity
                style={styles.joinByCodeButton}
                onPress={() => setShowJoinByCode(true)}
              >
                <Ionicons name="key" size={20} color="white" />
                <Text style={styles.joinByCodeButtonText}>Join by Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testButton}
                onPress={createTestChatRoom}
              >
                <Text style={styles.testButtonText}>Create Test Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Chat Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Chat</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Chat room name"
              placeholderTextColor={theme.inputPlaceholder}
              value={newChatName}
              onChangeText={setNewChatName}
              autoFocus
            />
            <TouchableOpacity
              style={[
                styles.publicToggle,
                isPublic && styles.publicToggleActive,
              ]}
              onPress={() => setIsPublic(!isPublic)}
            >
              <Ionicons
                name={isPublic ? "globe" : "lock-closed"}
                size={20}
                color={isPublic ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.publicToggleText,
                  isPublic && styles.publicToggleTextActive,
                ]}
              >
                {isPublic ? "Public Chat" : "Private Chat"}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewChatName("");
                  setIsPublic(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={createChatRoom}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark]}
                  style={styles.createButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Connection Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showConnectionCode}
        onRequestClose={() => setShowConnectionCode(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.connectionCodeHeader}>
              <Ionicons name="lock-closed" size={32} color={theme.primary} />
              <Text style={styles.connectionCodeTitle}>
                Private Chat Created!
              </Text>
              <Text style={styles.connectionCodeSubtitle}>
                Share this connection code with others to invite them to your
                private chat
              </Text>
            </View>

            <View style={styles.connectionCodeContainer}>
              <Text style={styles.connectionCodeLabel}>Connection Code</Text>
              <View style={styles.connectionCodeDisplay}>
                <Text style={styles.connectionCodeText}>{connectionCode}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyConnectionCode}
                >
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.connectionCodeInfo}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text style={styles.connectionCodeInfoText}>
                Only users with this code can join your private chat room
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowConnectionCode(false);
                setNewlyCreatedChat(null);
                setConnectionCode("");
              }}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={styles.closeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.closeButtonText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Chat Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeleteChat}
        onRequestClose={() => setShowDeleteChat(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Chat</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this chat?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteChat(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => deleteChatRoom(chatRoomId)}
                disabled={deletingChat}
              >
                <LinearGradient
                  colors={
                    deletingChat
                      ? [theme.buttonDisabled, theme.buttonDisabled]
                      : [theme.error, theme.error]
                  }
                  style={styles.deleteButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.deleteButtonText}>
                    {deletingChat ? "Deleting..." : "Delete Chat"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join by Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showJoinByCode}
        onRequestClose={() => setShowJoinByCode(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.connectionCodeHeader}>
              <Ionicons name="key" size={32} color={theme.primary} />
              <Text style={styles.connectionCodeTitle}>Join Private Chat</Text>
              <Text style={styles.connectionCodeSubtitle}>
                Enter the connection code provided by the chat creator
              </Text>
            </View>

            <View style={styles.connectionCodeContainer}>
              <Text style={styles.connectionCodeLabel}>Connection Code</Text>
              <TextInput
                style={styles.joinCodeInput}
                placeholder="Enter 6-digit code"
                placeholderTextColor={theme.inputPlaceholder}
                value={joinCode}
                onChangeText={setJoinCode}
                autoFocus
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.connectionCodeInfo}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text style={styles.connectionCodeInfoText}>
                Connection codes are case-insensitive and contain letters and
                numbers
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowJoinByCode(false);
                  setJoinCode("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={joinByCode}
                disabled={joiningChat || !joinCode.trim()}
              >
                <LinearGradient
                  colors={
                    joiningChat || !joinCode.trim()
                      ? [theme.buttonDisabled, theme.buttonDisabled]
                      : [theme.primary, theme.primaryDark]
                  }
                  style={styles.createButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.createButtonText}>
                    {joiningChat ? "Joining..." : "Join Chat"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    list: {
      flex: 1,
    },
    emptyListContainer: {
      flex: 1,
    },
    chatItem: {
      backgroundColor: theme.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      flexDirection: "row",
      alignItems: "center",
    },
    chatInfo: {
      flex: 1,
    },
    chatName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    lastMessage: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    time: {
      fontSize: 12,
      color: theme.textTertiary,
      marginRight: 10,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.surfaceVariant,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 32,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: "hidden",
      elevation: 8,
      shadowColor: theme.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    fabGradient: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      width: width * 0.85,
      maxWidth: 320,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      color: theme.text,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      fontSize: 16,
      backgroundColor: theme.inputBackground,
      color: theme.text,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    modalButton: {
      flex: 1,
      borderRadius: 12,
      overflow: "hidden",
      height: 48,
    },
    cancelButton: {
      backgroundColor: theme.buttonSecondary,
    },
    createButton: {
      overflow: "hidden",
    },
    createButtonGradient: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    cancelButtonText: {
      color: theme.text,
      textAlign: "center",
      fontWeight: "600",
      fontSize: 16,
      lineHeight: 48,
    },
    createButtonText: {
      color: "white",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 16,
    },
    publicBadge: {
      fontSize: 12,
      color: theme.primary,
      fontStyle: "italic",
    },
    privateBadge: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: "italic",
    },
    publicToggle: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      marginVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.surfaceVariant,
    },
    publicToggleActive: {
      backgroundColor: theme.primaryLight + "20",
    },
    publicToggleText: {
      marginLeft: 12,
      color: theme.textSecondary,
      fontSize: 16,
      fontWeight: "500",
    },
    publicToggleTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },
    testButton: {
      backgroundColor: theme.success,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    testButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    emptyButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    joinByCodeButton: {
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    joinByCodeButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    // Connection Code Modal Styles
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    headerJoinButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primaryLight + "10",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
    headerJoinButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    connectionCodeHeader: {
      alignItems: "center",
      marginBottom: 24,
    },
    connectionCodeTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 12,
      marginBottom: 8,
    },
    connectionCodeSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    connectionCodeContainer: {
      marginBottom: 20,
    },
    connectionCodeLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    connectionCodeDisplay: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    connectionCodeText: {
      flex: 1,
      fontSize: 24,
      fontWeight: "bold",
      color: theme.primary,
      textAlign: "center",
      letterSpacing: 2,
    },
    copyButton: {
      padding: 8,
    },
    joinCodeInput: {
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      padding: 16,
      fontSize: 18,
      backgroundColor: theme.inputBackground,
      color: theme.text,
      textAlign: "center",
      letterSpacing: 2,
      fontWeight: "bold",
    },
    connectionCodeInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: theme.primaryLight + "10",
      borderRadius: 8,
      padding: 12,
      marginBottom: 24,
    },
    connectionCodeInfoText: {
      flex: 1,
      fontSize: 12,
      color: theme.textSecondary,
      marginLeft: 8,
      lineHeight: 16,
    },
    closeButton: {
      borderRadius: 12,
      overflow: "hidden",
      height: 48,
    },
    closeButtonGradient: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    closeButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    modalText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },
    deleteButton: {
      overflow: "hidden",
    },
    deleteButtonGradient: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    deleteButtonText: {
      color: "white",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 16,
    },
  });
