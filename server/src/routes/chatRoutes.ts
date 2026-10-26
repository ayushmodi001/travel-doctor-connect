import { Router } from 'express';
import { getChatMessages, sendChatMessage } from '../controllers/chatController';

const router = Router();

router.get('/:appointmentId/messages', getChatMessages);
router.post('/:appointmentId/messages', sendChatMessage);

export default router;
