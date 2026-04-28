import express from 'express';
import { protect } from '../middleware/auth.js';
import { Message, User } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// Send message
router.post('/send', protect, async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        const message = await Message.create({
            senderId,
            receiverId,
            content,
            isRead: false
        });

        const messageWithSender = await Message.findByPk(message.id, {
            include: [
                { model: User, as: 'sender', attributes: ['id', 'email'] },
                { model: User, as: 'receiver', attributes: ['id', 'email'] }
            ]
        });

        res.status(201).json({ success: true, message: messageWithSender });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get conversations
router.get('/conversations', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [{ senderId: userId }, { receiverId: userId }]
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'email'] },
                { model: User, as: 'receiver', attributes: ['id', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Group by conversation partner
        const conversations = {};
        messages.forEach(msg => {
            const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!conversations[partnerId]) {
                conversations[partnerId] = {
                    user: msg.senderId === userId ? msg.receiver : msg.sender,
                    lastMessage: msg,
                    unreadCount: msg.receiverId === userId && !msg.isRead ? 1 : 0
                };
            } else if (msg.receiverId === userId && !msg.isRead) {
                conversations[partnerId].unreadCount++;
            }
        });

        res.json({ success: true, conversations: Object.values(conversations) });
    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get messages with user
router.get('/:otherUserId', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'email'] },
                { model: User, as: 'receiver', attributes: ['id', 'email'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        // Mark messages as read
        await Message.update(
            { isRead: true },
            { where: { senderId: otherUserId, receiverId: userId, isRead: false } }
        );

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark message as read
router.put('/read/:messageId', protect, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findOne({
            where: { id: messageId, receiverId: userId }
        });

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        message.isRead = true;
        await message.save();

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;