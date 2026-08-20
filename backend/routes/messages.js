const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

// Get messages between current user and admin (for User view)
router.get('/support', auth, async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) return res.json([]);

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: admin._id },
        { sender: admin._id, receiver: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users who have chatted with admin (for Admin view)
router.get('/conversations', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    // Find all unique senders (users) who sent messages to admin (or received from admin)
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    }).sort({ createdAt: -1 });

    const userIds = new Set();
    messages.forEach(m => {
      if (m.sender.toString() !== req.user.id) userIds.add(m.sender.toString());
      if (m.receiver.toString() !== req.user.id) userIds.add(m.receiver.toString());
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } }, 'name email');
    
    // Attach last message to each user
    const conversations = users.map(u => {
      const lastMsg = messages.find(m => 
        m.sender.toString() === u._id.toString() || m.receiver.toString() === u._id.toString()
      );
      return {
        user: u,
        lastMessage: lastMsg
      };
    });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages between current user and a specific target
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    
    // If user is sending, receiverId is usually Admin
    // If admin is sending, receiverId is the User
    
    let finalReceiver = receiverId;
    if (!receiverId) {
      // Default to first admin if not specified (for user chat)
      const admin = await User.findOne({ role: 'admin' });
      finalReceiver = admin._id;
    }

    const newMessage = new Message({
      sender: req.user.id,
      receiver: finalReceiver,
      text
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
