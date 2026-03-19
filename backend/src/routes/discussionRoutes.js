import express from 'express';
import { getMessages, createMessage, deleteMessage } from '../controllers/discussionController.js';

const router = express.Router({ mergeParams: true });

router.get('/', getMessages);
router.post('/', createMessage);
router.delete('/:messageId', deleteMessage);

export default router;
