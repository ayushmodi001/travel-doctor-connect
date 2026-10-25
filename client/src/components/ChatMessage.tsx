/**
 * ChatMessage – renders a single message bubble in the chat/triage screen.
 * Supports user, doctor, and bot message types with different styles.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage as ChatMessageType } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { timeAgo } from '../utils/helpers';

interface ChatMessageProps {
  message: ChatMessageType;
  isCurrentUser: boolean;
  /** URL of the sender's avatar (optional) */
  avatarUrl?: string;
}

const ChatMessageBubble: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
  avatarUrl,
}) => {
  const isBot = message.senderType === 'bot';

  // ── Bot message ──────────────────────────────────────────────────────────
  if (isBot) {
    return (
      <View style={styles.botRow}>
        <View style={styles.botAvatar}>
          <Ionicons name="medkit" size={16} color={Colors.primary[600]} />
        </View>
        <View style={styles.botBubble}>
          <Text style={styles.botSenderName}>MediBot</Text>
          <Text style={styles.botText}>{message.content}</Text>
          <Text style={styles.timestamp}>{timeAgo(message.timestamp)}</Text>
        </View>
      </View>
    );
  }

  // ── User / Doctor message ─────────────────────────────────────────────────
  return (
    <View style={[styles.row, isCurrentUser ? styles.rowRight : styles.rowLeft]}>
      {/* Avatar (shown on left for incoming) */}
      {!isCurrentUser && (
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={Colors.neutral[500]} />
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isCurrentUser ? styles.userBubble : styles.doctorBubble,
        ]}
      >
        {/* Sender name (only for incoming) */}
        {!isCurrentUser && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}

        {/* Message content */}
        {message.type === 'image' && message.attachmentUrl ? (
          <TouchableOpacity>
            <Image
              source={{ uri: message.attachmentUrl }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.userText : styles.doctorText,
            ]}
          >
            {message.content}
          </Text>
        )}

        {/* Prescription badge */}
        {message.type === 'prescription' && (
          <View style={styles.prescriptionBadge}>
            <Ionicons name="document-text-outline" size={12} color={Colors.primary[600]} />
            <Text style={styles.prescriptionText}>Prescription attached</Text>
          </View>
        )}

        {/* Timestamp + Read receipt */}
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.timestamp,
              isCurrentUser ? styles.userTimestamp : styles.doctorTimestamp,
            ]}
          >
            {timeAgo(message.timestamp)}
          </Text>
          {isCurrentUser && (
            <Ionicons
              name={message.isRead ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={message.isRead ? Colors.primary[300] : Colors.white}
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Bot ──────────────────────────────────────────────────────────────────
  botRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  botBubble: {
    flex: 1,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.xl,
    borderTopLeftRadius: BorderRadius.sm,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  botSenderName: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[600],
    marginBottom: 4,
  },
  botText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[800],
    lineHeight: 20,
  },

  // ── Row ───────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    marginVertical: Spacing[1],
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft:  { justifyContent: 'flex-start' },

  // ── Avatars ────────────────────────────────────────────────────────────────
  avatarContainer: { alignSelf: 'flex-end' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Bubble ─────────────────────────────────────────────────────────────────
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.xl,
  },
  userBubble: {
    backgroundColor: Colors.primary[500],
    borderBottomRightRadius: BorderRadius.sm,
  },
  doctorBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: BorderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  senderName: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[500],
    marginBottom: 3,
  },
  messageText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  userText:   { color: Colors.white },
  doctorText: { color: Colors.neutral[800] },

  // ── Attachment ─────────────────────────────────────────────────────────────
  attachmentImage: {
    width: 180,
    height: 140,
    borderRadius: BorderRadius.lg,
  },

  // ── Prescription badge ─────────────────────────────────────────────────────
  prescriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing[2],
    backgroundColor: Colors.primary[50],
    padding: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  prescriptionText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
  },

  // ── Meta ──────────────────────────────────────────────────────────────────
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[400],
  },
  userTimestamp:   { color: 'rgba(255,255,255,0.6)' },
  doctorTimestamp: { color: Colors.neutral[400] },
  readIcon: { marginTop: 1 },
});

export default ChatMessageBubble;
