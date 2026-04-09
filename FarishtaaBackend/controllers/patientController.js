const Chats=require('../model/Chats');
const ChatSession=require('../model/ChatSession');
const geminiService=require('../service/geminiService')
const User=require('../model/User');

const parsePagination = (pageValue, limitValue, defaultLimit = 20, maxLimit = 100) => {
  const parsedPage = Number.parseInt(pageValue, 10);
  const parsedLimit = Number.parseInt(limitValue, 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, maxLimit)
    : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const ensureOwnUser = (req, res) => {
  if (String(req.userId) !== String(req.params.userId)) {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
};

/* ========== SESSIONS ========== */

// GET all sessions for a user
exports.getSessions = async (req, res, next) => {
  const { userId } = req.params;
  if (!ensureOwnUser(req, res)) return;

  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20, 100);
    const filter = { user: userId };

    const [sessions, total] = await Promise.all([
      ChatSession.find(filter)
        .sort({ updatedAt: -1 })
        .select('title createdAt updatedAt')
        .skip(skip)
        .limit(limit),
      ChatSession.countDocuments(filter),
    ]);

    return res.status(200).json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sessions', error: err.message });
  }
};

// POST create a new session
exports.createSession = async (req, res, next) => {
  const { userId } = req.params;
  if (!ensureOwnUser(req, res)) return;

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
  const { sessionId } = req.params;
  if (!ensureOwnUser(req, res)) return;

  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (String(session.user) !== String(req.userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

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
  if (!ensureOwnUser(req, res)) return;

  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (String(session.user) !== String(req.userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Fetch user details for personalized AI responses
    const user = await User.findById(req.userId).select('firstName lastName age gender');

    const recentChatIds = Array.isArray(session.chats) ? session.chats.slice(-20) : [];
    const previousChats = recentChatIds.length > 0
      ? await Chats.find({
        _id: { $in: recentChatIds }
      })
        .select('role content createdAt')
        .sort({ createdAt: 1 })
      : [];

    const rawText = await geminiService.generateContent(language, userPrompt, previousChats, user);

    const patientChat = new Chats({
      user: req.userId,
      role: 'patient',
      content: userPrompt,
    });
    const assistantChat = new Chats({
      user: req.userId,
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
  const { sessionId } = req.params;
  if (!ensureOwnUser(req, res)) return;

  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 50, 200);
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (String(session.user) !== String(req.userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const total = Array.isArray(session.chats) ? session.chats.length : 0;

    let chats = await Chats.find({
      _id: { $in: session.chats }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    chats = chats.reverse();

    if (chats.length === 0 && page === 1)
      chats.push({
        role: "assistant",
        content: "Hello! This is your Farishtaa. Please describe your symptoms so I can assist you further",
      });

    return res.status(200).json({
      chats,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error while fetching chats" });
  }
};