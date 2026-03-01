const Chats=require('../model/Chats');
const ChatSession=require('../model/ChatSession');
const geminiService=require('../service/geminiService')
const User=require('../model/User');

/* ========== SESSIONS ========== */

// GET all sessions for a user
exports.getSessions = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const sessions = await ChatSession.find({ user: userId })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt');
    return res.status(200).json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sessions', error: err.message });
  }
};

// POST create a new session
exports.createSession = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const session = new ChatSession({ user: userId, title: 'New Chat' });
    await session.save();
    return res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ message: 'Error creating session', error: err.message });
  }
};

// DELETE a session
exports.deleteSession = async (req, res, next) => {
  const { userId, sessionId } = req.params;
  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Delete all chats in this session
    await Chats.deleteMany({ _id: { $in: session.chats } });
    await ChatSession.findByIdAndDelete(sessionId);

    return res.status(200).json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting session', error: err.message });
  }
};

/* ========== CHATS WITHIN SESSION ========== */

exports.postSymptomChecker = async (req, res, next) => {
  const { userId, sessionId } = req.params;
  const { userPrompt, language } = req.body;
  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Fetch user details for personalized AI responses
    const user = await User.findById(userId).select('firstName lastName age gender');

    const previousChats = await Chats.find({
      _id: { $in: session.chats }
    }).sort({ createdAt: 1 });

    const rawText = await geminiService.generateContent(language, userPrompt, previousChats, user);

    const patientChat = new Chats({
      user: userId,
      role: 'patient',
      content: userPrompt,
    });
    const assistantChat = new Chats({
      user: userId,
      role: 'assistant',
      content: rawText,
    });

    await patientChat.save();
    await assistantChat.save();

    session.chats.push(patientChat._id);
    session.chats.push(assistantChat._id);

    // Auto-generate title from first message
    if (session.title === 'New Chat') {
      session.title = userPrompt.length > 40 ? userPrompt.substring(0, 40) + '...' : userPrompt;
    }

    await session.save();

    return res.status(201).json({ chats: [patientChat, assistantChat] });
  } catch (err) {
    console.error('Error in postSymptomChecker:', err);
    res.status(500).json({ message: 'Error while checking symptoms', error: err.message });
  }
};

exports.getPreviousChats = async (req, res, next) => {
  const { userId, sessionId } = req.params;
  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    let chats = await Chats.find({
      _id: { $in: session.chats }
    }).sort({ createdAt: 1 });

    if (chats.length === 0)
      chats.push({
        role: "assistant",
        content: "Hello! This is your Farishtaa. Please describe your symptoms so I can assist you further",
      });

    return res.status(200).json({ chats });
  } catch (error) {
    res.status(500).json({ message: "Error while fetching chats" });
  }
};