import { Request, Response } from 'express';
import { ChatMessage } from '../types';

const chatStore: Record<string, ChatMessage[]> = {
  default: [
    {
      id: 'm-default-1',
      appointmentId: 'default',
      senderId: 'd1',
      senderName: 'Dr. Sarah Mitchell',
      senderType: 'doctor',
      content: 'Hello! I am reviewing your consultation notes. How can I help you today?',
      type: 'text',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      isRead: true,
    },
  ],
};

// GET /api/chat/:appointmentId/messages
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const messages = chatStore[appointmentId] || chatStore['default'];

    return res.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error loading chat messages' });
  }
};

// POST /api/chat/:appointmentId/messages
export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { content, senderId, senderName, senderType, type } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      appointmentId,
      senderId: senderId || 'u1',
      senderName: senderName || 'Patient',
      senderType: senderType || 'user',
      content: content.trim(),
      type: type || 'text',
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    if (!chatStore[appointmentId]) {
      chatStore[appointmentId] = [...chatStore['default']];
    }
    chatStore[appointmentId].push(newMessage);

    return res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error sending message' });
  }
};
