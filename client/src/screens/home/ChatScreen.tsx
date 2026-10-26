/**
 * ChatScreen – real-time chat between patient and doctor.
 * In production connect to a Twilio Conversations or Sendbird channel.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList, ChatMessage as ChatMessageType } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import ChatMessageBubble from '../../components/ChatMessage';
import { useAuth } from '../../context/AuthContext';
import { useDoctor } from '../../hooks/useApi';

type NavProp   = NativeStackNavigationProp<HomeStackParamList, 'Chat'>;
type RouteType = RouteProp<HomeStackParamList, 'Chat'>;

const INITIAL_MESSAGES: ChatMessageType[] = [
  {
    id: 'm0',
    senderId: 'd1',
    senderName: 'Dr. Sarah Mitchell',
    senderType: 'doctor',
    content: 'Hello! How can I assist you today?',
    type: 'text',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    isRead: true,
  },
];

import { ChatService } from '../../services/api';

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteType>();
  const { doctorId } = route.params;

  const { user }    = useAuth();
  const { doctor }  = useDoctor(doctorId);
  const listRef     = useRef<FlatList>(null);

  const [messages, setMessages]   = useState<ChatMessageType[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ChatService.getMessages(doctorId)
      .then(msgs => {
        if (!cancelled && msgs && msgs.length > 0) {
          setMessages(msgs);
        }
      })
      .catch(err => {
        if (!cancelled) setChatError(err.message);
      });
    return () => { cancelled = true; };
  }, [doctorId]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setChatError(null);

    const tempMsg: ChatMessageType = {
      id: `m-${Date.now()}`,
      senderId: user?.id ?? 'u1',
      senderName: user?.name ?? 'You',
      senderType: 'user',
      content: text,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await ChatService.sendMessage(doctorId, text, {
        id: user?.id ?? 'u1',
        name: user?.name ?? 'You',
        type: 'user',
      });
    } catch (err: any) {
      setChatError(err.message || 'Failed to deliver message.');
    } finally {
      setIsTyping(false);
    }
  }, [inputText, user, doctorId]);

  const renderMessage = ({ item }: { item: ChatMessageType }) => (
    <ChatMessageBubble
      message={item}
      isCurrentUser={item.senderType === 'user'}
      avatarUrl={doctor?.profileImage}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.neutral[700]} />
        </TouchableOpacity>
        {doctor && (
          <Image source={{ uri: doctor.profileImage }} style={styles.headerAvatar} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{doctor?.name ?? 'Loading…'}</Text>
          <View style={styles.headerStatus}>
            <View style={[styles.statusDot, { backgroundColor: doctor?.isAvailableNow ? Colors.success.main : Colors.neutral[400] }]} />
            <Text style={styles.statusText}>
              {doctor?.isAvailableNow ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.videoBtn} onPress={() => {}}>
          <Ionicons name="videocam-outline" size={22} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item: ChatMessageType) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingRow}>
          <View style={styles.typingBubble}>
            <View style={styles.dots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.dot, { opacity: 0.4 + i * 0.3 }]} />
              ))}
            </View>
          </View>
          <Text style={styles.typingLabel}>{doctor?.name?.split(' ')[0]} is typing…</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="attach-outline" size={22} color={Colors.neutral[500]} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor={Colors.neutral[400]}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: 56,
    paddingBottom: Spacing[3],
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backBtn: {},
  headerAvatar: { width: 40, height: 40, borderRadius: BorderRadius.full },
  headerInfo: { flex: 1 },
  headerName: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[900] },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
  videoBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },

  messageList: { paddingVertical: Spacing[4] },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingHorizontal: Spacing[4], paddingBottom: Spacing[2] },
  typingBubble: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing[3], ...Shadows.sm },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.neutral[400] },
  typingLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[400] },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
    padding: Spacing[3],
    paddingBottom: Platform.OS === 'ios' ? Spacing[6] : Spacing[3],
    backgroundColor: Colors.white,
    ...Shadows.lg,
  },
  attachBtn: { padding: Spacing[2] },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
    maxHeight: 100,
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  sendBtn: { width: 44, height: 44, borderRadius: BorderRadius.full, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.neutral[300] },
});

export default ChatScreen;
