import { Router } from 'express';
import {
    getAllChats,
    getChatById,
    updateChat,
    deleteChat,
    blockChat,
    getChatActiveDates,
    deleteTagGlobally,
    togglePinChat,
    toggleFavouriteChat
} from '../controllers/chat.controller.js';

const router = Router();

/**
 * Chat Management Routes
 * Base path: /api/chats
 */

// GET /api/chats - Get all chats with filters (The Relationship OS Master List)
router.get('/', getAllChats);

// GET /api/chats/active-dates - Get all unique activity dates for an organization
router.get('/active-dates', getChatActiveDates);

// DELETE /api/chats/tags/:tagName - Delete a tag globally from all chats
router.delete('/tags/:tagName', deleteTagGlobally);

// GET /api/chats/:chatId - Get conversation details
router.get('/:chatId', getChatById);

// PUT /api/chats/:chatId - Update conversation metadata/labels
router.put('/:chatId', updateChat);

// DELETE /api/chats/:chatId - Mutual deletion logic
router.delete('/:chatId', deleteChat);

// POST /api/chats/:chatId/block - Mark as spam/archive
router.post('/:chatId/block', blockChat);

// PATCH /api/chats/:chatId/pin - Toggle pin status
router.patch('/:chatId/pin', togglePinChat);

// PATCH /api/chats/:chatId/favourite - Toggle favourite status
router.patch('/:chatId/favourite', toggleFavouriteChat);

// PATCH /api/chats/:chatId/unread - Mark as unread
router.patch('/:chatId/unread', (req, res, next) => {
    import('../controllers/chat.controller.js').then(m => m.markUnread(req, res)).catch(next);
});

// GET /api/chats/:chatId/deletion-stats - Get counts of deleted labels
router.get('/:chatId/deletion-stats', (req, res, next) => {
    import('../controllers/chat.controller.js').then(m => m.getChatDeletionStats(req, res)).catch(next);
});

// POST /api/chats/:chatId/clear-deleted - Manual hard purge of labels
router.post('/:chatId/clear-deleted', (req, res, next) => {
    import('../controllers/chat.controller.js').then(m => m.clearChatDeletionLabels(req, res)).catch(next);
});

// POST /api/chats/:chatId/wipe - Zero-Trace Wipe (Me/Everyone)
router.post('/:chatId/wipe', (req, res, next) => {
    import('../controllers/chat.controller.js').then(m => m.wipeChatHistory(req, res)).catch(next);
});

// POST /api/chats/:chatId/undo-wipe - Restoration for 24h window
router.post('/:chatId/undo-wipe', (req, res, next) => {
    import('../controllers/chat.controller.js').then(m => m.undoWipeChatHistory(req, res)).catch(next);
});

export default router;
