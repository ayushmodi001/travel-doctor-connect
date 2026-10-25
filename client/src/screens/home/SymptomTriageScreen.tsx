/**
 * SymptomTriageScreen – AI triage chat interface.
 * Users describe symptoms; the bot assesses severity and recommends action.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { HomeStackParamList, ChatMessage } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import ChatMessageBubble from '../../components/ChatMessage';
import { calculateTriage } from '../../utils/helpers';
import { TRIAGE_BOT_RESPONSES } from '../../data/mockData';
import { i18n } from '../../localization/i18n';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'SymptomTriage'>;

const SEVERITY_COLORS = {
  low:      Colors.success.main,
  moderate: Colors.warning.main,
  high:     Colors.warning.dark,
  critical: Colors.error.main,
};

const INITIAL_BOT_MESSAGE: ChatMessage = {
  id: 'bot-0',
  senderId: 'bot',
  senderName: 'MediBot',
  senderType: 'bot',
  content: 'Hello! I\'m MediBot, your health assistant. Please describe your symptoms and I\'ll help assess the urgency of your situation. How are you feeling today?',
  type: 'text',
  timestamp: new Date().toISOString(),
  isRead: true,
};

const SymptomTriageScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const listRef    = useRef<FlatList>(null);

  const [messages, setMessages]   = useState<ChatMessage[]>([INITIAL_BOT_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [triageResult, setTriageResult] = useState<ReturnType<typeof calculateTriage> | null>(null);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      senderId: 'u1',
      senderName: 'You',
      senderType: 'user',
      content: text,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot thinking
    await new Promise(res => setTimeout(res, 1200));

    // Find a matching response
    const lower = text.toLowerCase();
    const matched = TRIAGE_BOT_RESPONSES.find(r =>
      r.trigger.some(t => lower.includes(t))
    );

    // Calculate triage
    const triage = calculateTriage(text);
    setTriageResult(triage);

    const botResponse =
      matched?.response ??
      `Thank you for sharing that. Based on what you've described, I'd assess this as a **${triage.severity}** severity situation. ${triage.recommendation}`;

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      senderId: 'bot',
      senderName: 'MediBot',
      senderType: 'bot',
      content: botResponse,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMsg]);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [inputText]);

  const handleEmergency = () => navigation.navigate('Emergency');
  const handleFindDoctor = () => navigation.navigate('DoctorList', {});

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <ChatMessageBubble
      message={item}
      isCurrentUser={item.senderType === 'user'}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <LinearGradient colors={[Colors.primary[800], Colors.primary[600]]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{i18n.t('triage.title')}</Text>
          <Text style={styles.headerSub}>{i18n.t('triage.subtitle')}</Text>
        </View>
        <View style={styles.botIndicator}>
          <Ionicons name="medkit" size={22} color={Colors.white} />
        </View>
      </LinearGradient>

      {/* Triage result banner */}
      {triageResult && (
        <View style={[styles.resultBanner, { borderLeftColor: SEVERITY_COLORS[triageResult.severity] }]}>
          <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[triageResult.severity] }]} />
          <View style={styles.resultText}>
            <Text style={styles.severityLabel}>
              {i18n.t(`triage.severity.${triageResult.severity}`)}
            </Text>
            <Text style={styles.recommendationText}>{triageResult.recommendation}</Text>
          </View>
          <View style={styles.resultActions}>
            {triageResult.shouldCallEmergency ? (
              <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergency}>
                <Ionicons name="alert-circle" size={14} color={Colors.white} />
                <Text style={styles.emergencyBtnText}>Emergency</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.doctorBtn} onPress={handleFindDoctor}>
                <Text style={styles.doctorBtnText}>Find Doctor</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingRow}>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>MediBot is typing</Text>
            <View style={styles.typingDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.typingDot, { opacity: 0.4 + i * 0.3 }]} />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={i18n.t('triage.placeholder')}
          placeholderTextColor={Colors.neutral[400]}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
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
    paddingTop: 56,
    paddingBottom: Spacing[4],
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
  },
  backBtn: {},
  headerTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.white },
  headerSub: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: 'rgba(255,255,255,0.7)' },
  botIndicator: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },

  // Result banner
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderLeftWidth: 4,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    ...Shadows.sm,
  },
  severityDot: { width: 10, height: 10, borderRadius: 5 },
  resultText: { flex: 1 },
  severityLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[800] },
  recommendationText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500], marginTop: 2 },
  resultActions: {},
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.error.main, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: BorderRadius.full },
  emergencyBtnText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
  doctorBtn: { backgroundColor: Colors.primary[50], paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: BorderRadius.full },
  doctorBtnText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary[700] },

  messageList: { paddingVertical: Spacing[4] },

  // Typing indicator
  typingRow: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[2] },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], backgroundColor: Colors.white, alignSelf: 'flex-start', borderRadius: BorderRadius.xl, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], ...Shadows.sm },
  typingText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
  typingDots: { flexDirection: 'row', gap: 3 },
  typingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.neutral[400] },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    paddingBottom: Platform.OS === 'ios' ? Spacing[6] : Spacing[3],
    ...Shadows.lg,
  },
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
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.neutral[300] },
});

export default SymptomTriageScreen;
