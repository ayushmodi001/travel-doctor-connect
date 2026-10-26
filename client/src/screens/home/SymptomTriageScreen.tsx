import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Modal, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { HomeStackParamList, ChatMessage } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import ChatMessageBubble from '../../components/ChatMessage';
import { calculateTriage } from '../../utils/helpers';
import { TriageService } from '../../services/api';
import { i18n } from '../../localization/i18n';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'SymptomTriage'>;

interface TriageResult {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
  suggestedSpecialty?: string;
  shouldCallEmergency: boolean;
}

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
  content: 'Hello! I\'m MediBot, your clinical health assistant. Please describe your symptoms or medical questions. (Strict safety guardrails active: only medical/health inquiries are answered).',
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
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // API Key management
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyModalVisible, setIsKeyModalVisible] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('@mediconnect_ai_api_key').then(stored => {
      if (stored) {
        setApiKey(stored);
        setTempKeyInput(stored);
      }
    });
  }, []);

  const handleSaveApiKey = async () => {
    const trimmed = tempKeyInput.trim();
    setApiKey(trimmed);
    if (trimmed) {
      await AsyncStorage.setItem('@mediconnect_ai_api_key', trimmed);
      Alert.alert('AI Key Saved', 'MediBot is now linked to your custom Gemini AI key with strict medical safety guardrails.');
    } else {
      await AsyncStorage.removeItem('@mediconnect_ai_api_key');
      Alert.alert('Reset', 'Reverted to clinical rule triage engine.');
    }
    setIsKeyModalVisible(false);
  };

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

    // Call Backend Triage API with custom API key and safety guardrails
    try {
      const assessment = await TriageService.assessSymptoms(text, apiKey);
      setTriageResult({
        severity: assessment.severity,
        recommendation: assessment.recommendation,
        suggestedSpecialty: assessment.suggestedSpecialty,
        shouldCallEmergency: assessment.shouldCallEmergency,
      });

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        senderId: 'bot',
        senderName: 'MediBot',
        senderType: 'bot',
        content: assessment.botReply,
        type: 'text',
        timestamp: new Date().toISOString(),
        isRead: true,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        senderId: 'bot',
        senderName: 'MediBot',
        senderType: 'bot',
        content: `⚠️ Server Error: ${err.message || 'Unable to connect to clinical assessment server.'} Please try again.`,
        type: 'text',
        timestamp: new Date().toISOString(),
        isRead: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [inputText, apiKey]);

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{i18n.t('triage.title')}</Text>
          <Text style={styles.headerSub}>
            {apiKey ? '⚡ Gemini AI Active (Medical Only)' : 'Clinical Rule Engine (Medical Only)'}
          </Text>
        </View>

        {/* AI Key Configuration Button */}
        <TouchableOpacity
          style={styles.keyBtn}
          onPress={() => setIsKeyModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="key" size={16} color={apiKey ? '#F59E0B' : Colors.white} />
          {apiKey ? <View style={styles.activeDot} /> : null}
        </TouchableOpacity>

        <View style={styles.botIndicator}>
          <Ionicons name="medkit" size={20} color={Colors.white} />
        </View>
      </LinearGradient>

      {/* Safety Guardrail Notice Bar */}
      <View style={styles.guardrailBanner}>
        <Ionicons name="shield-checkmark" size={14} color={Colors.primary[700]} />
        <Text style={styles.guardrailText}>
          Strict Medical Guardrails Enabled • Non-medical queries will be declined
        </Text>
      </View>

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
        keyExtractor={(item: ChatMessage) => item.id}
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
      {/* API Key Configuration Modal */}
      <Modal
        visible={isKeyModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsKeyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.keyModalCard}>
            <View style={styles.keyModalHeader}>
              <View style={styles.keyIconWrap}>
                <Ionicons name="key" size={20} color={Colors.primary[600]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.keyModalTitle}>MediBot AI API Key</Text>
                <Text style={styles.keyModalSub}>Configure Google Gemini AI for triage</Text>
              </View>
              <TouchableOpacity onPress={() => setIsKeyModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.keyNotice}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.primary[600]} />
              <Text style={styles.keyNoticeText}>
                Safety Guardrails Active: MediBot will strictly decline non-medical questions (code, politics, chit-chat) and only provide clinical health triage.
              </Text>
            </View>

            <Text style={styles.keyInputLabel}>Gemini API Key</Text>
            <TextInput
              style={styles.keyInput}
              placeholder="AIzaSy..."
              placeholderTextColor={Colors.neutral[400]}
              value={tempKeyInput}
              onChangeText={setTempKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />

            <View style={styles.keyActionRow}>
              <TouchableOpacity
                style={styles.keyResetBtn}
                onPress={() => {
                  setTempKeyInput('');
                }}
              >
                <Text style={styles.keyResetText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keySaveBtn}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.keySaveText}>Save API Key</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerSub: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  keyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  botIndicator: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardrailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[100],
  },
  guardrailText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[800],
    flex: 1,
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

  // Key Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
  },
  keyModalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    ...Shadows.lg,
  },
  keyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  keyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyModalTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  keyModalSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  keyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  keyNoticeText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[900],
    lineHeight: 16,
  },
  keyInputLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[700],
    marginBottom: Spacing[2],
  },
  keyInput: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[900],
    marginBottom: Spacing[5],
  },
  keyActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[3],
  },
  keyResetBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyResetText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  keySaveBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[5],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  keySaveText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});

export default SymptomTriageScreen;
