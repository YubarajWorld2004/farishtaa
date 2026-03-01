import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { IoSend, IoClose } from "react-icons/io5";
import { FaMicrophone, FaRobot } from "react-icons/fa";
import { GiSpeaker } from "react-icons/gi";
import {
  HiOutlineHeart,
  HiOutlineLightBulb,
  HiOutlineShieldCheck,
  HiOutlineChat,
  HiOutlineChatAlt2,
  HiPlus,
  HiOutlineTrash,
} from "react-icons/hi";
import { FiMenu, FiX } from "react-icons/fi";
import {
  addMessage,
  setChat,
  setError,
  setLoading,
  setActiveSession,
  addSession,
  clearChat,
  updateSessionTitle,
  setSessions,
  removeSession,
} from "../../store/slices/patientSlice";

const FloatingChatWidget = ({ onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { token, userId, firstName } = useSelector((state) => state.auth);
  const { loading, chatHistory, activeSessionId, sessions } = useSelector(
    (state) => state.patient
  );
  const { language } = useSelector((state) => state.language);

  const promptRef = useRef(null);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState(null);

  const hasSession = !!activeSessionId;

  const SUGGESTIONS = [
    {
      icon: <HiOutlineHeart size={16} className="text-red-500" />,
      title: t("ai.describeSymptoms"),
      desc: t("ai.descSymptomsHint"),
    },
    {
      icon: <HiOutlineLightBulb size={16} className="text-amber-500" />,
      title: t("ai.askMedicine"),
      desc: t("ai.askMedicineHint"),
    },
    {
      icon: <HiOutlineShieldCheck size={16} className="text-emerald-500" />,
      title: t("ai.specialistAdvice"),
      desc: t("ai.specialistHint"),
    },
    {
      icon: <HiOutlineChat size={16} className="text-blue-500" />,
      title: t("ai.checkSeverity"),
      desc: t("ai.severityHint"),
    },
  ];

  /* =============== AUTO-SCROLL =============== */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  /* =============== FETCH SESSIONS ON MOUNT =============== */
  useEffect(() => {
    if (!token || !userId) return;
    const fetchSessions = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/patient/sessions/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        dispatch(setSessions(data.sessions || []));
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };
    fetchSessions();
  }, [token, userId, dispatch]);

  /* =============== LOAD CHAT WHEN SESSION CHANGES =============== */
  useEffect(() => {
    if (!token || !activeSessionId) return;
    const fetchMessages = async () => {
      try {
        dispatch(setLoading(true));
        const res = await fetch(
          `http://localhost:3001/api/patient/symptoms/${userId}/${activeSessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        dispatch(setChat(data.chats || []));
      } catch (err) {
        dispatch(setError("Failed to load chat"));
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchMessages();
  }, [userId, activeSessionId, token, dispatch]);

  /* =============== SPEECH RECOGNITION =============== */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    const langMap = { en: "en-US", hi: "hi-IN", or: "or-IN" };
    recognition.lang = langMap[language] || "en-US";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (promptRef.current) {
        promptRef.current.value =
          (promptRef.current.value || "") + " " + transcript;
      }
    };

    recognitionRef.current = recognition;
  }, [language]);

  /* =============== AUTO SPEAK LATEST AI MESSAGE =============== */
  useEffect(() => {
    if (!voiceEnabled || !chatHistory?.length || !window.speechSynthesis) return;
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage.role !== "assistant") return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastMessage.content);
    const langMap = { en: "en-US", hi: "hi-IN", or: "or-IN" };
    utterance.lang = langMap[language] || "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [chatHistory, voiceEnabled, language]);

  /* =============== CREATE SESSION =============== */
  const ensureSession = async () => {
    if (activeSessionId) return activeSessionId;
    try {
      const res = await fetch(
        `http://localhost:3001/api/patient/sessions/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        if (res.status === 401) navigate("/login");
        return null;
      }
      const data = await res.json();
      if (!data.session?._id) return null;
      dispatch(addSession(data.session));
      dispatch(setActiveSession(data.session._id));
      return data.session._id;
    } catch (err) {
      console.error("Failed to create session:", err);
      return null;
    }
  };

  /* =============== SUBMIT MESSAGE =============== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = promptRef.current?.value?.trim();
    if (!text) return;

    const currentSessionId = await ensureSession();
    if (!currentSessionId) return;

    try {
      dispatch(setLoading(true));
      dispatch(addMessage({ role: "patient", content: text }));

      const res = await fetch(
        `http://localhost:3001/api/patient/symptoms/${userId}/${currentSessionId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userPrompt: text, language }),
        }
      );

      const data = await res.json();

      if (data.chats?.length > 0) {
        dispatch(addMessage(data.chats.at(-1)));
        const firstMsg = data.chats[0];
        if (firstMsg.role === "patient") {
          dispatch(
            updateSessionTitle({
              sessionId: currentSessionId,
              title:
                firstMsg.content.length > 40
                  ? firstMsg.content.substring(0, 40) + "..."
                  : firstMsg.content,
            })
          );
        }
      }
      if (res.status === 401) {
        navigate("/login");
      }
      promptRef.current.value = "";
    } catch (err) {
      dispatch(setError("Message failed"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSuggestionClick = (text) => {
    if (promptRef.current) {
      promptRef.current.value = text;
      promptRef.current.focus();
    }
  };

  const handleMicClick = () => recognitionRef.current?.start();

  /* =============== SESSION SIDEBAR HANDLERS =============== */
  const handleNewChat = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/patient/sessions/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!data.session?._id) return;
      dispatch(addSession(data.session));
      dispatch(setActiveSession(data.session._id));
      dispatch(clearChat());
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleSelectSession = (sessionId) => {
    dispatch(setActiveSession(sessionId));
    dispatch(clearChat());
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await fetch(
        `http://localhost:3001/api/patient/sessions/${userId}/${sessionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      dispatch(removeSession(sessionId));
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  /* =============== RENDER CHAT MESSAGES =============== */
  const renderMessages = () => (
    <div className="w-full h-full overflow-y-auto px-3 py-4">
      <div className="flex flex-col gap-3">
        {chatHistory?.map((msg, index) => {
          const isPatient = msg.role?.toLowerCase() === "patient";
          const content =
            typeof msg.content === "string"
              ? msg.content
              : JSON.stringify(msg.content);

          return (
            <div
              key={msg._id || index}
              className={`flex ${isPatient ? "justify-end" : "justify-start"} animate-[fadeIn_0.3s_ease-out]`}
            >
              <div
                className={`flex gap-1.5 ${isPatient ? "flex-row-reverse" : ""} max-w-[88%]`}
              >
                {/* Avatar */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5 ${
                    isPatient
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm"
                  }`}
                >
                  {isPatient ? t("ai.you") : "F"}
                </div>

                {/* Bubble */}
                <div
                  className={`px-3 py-2 text-xs leading-relaxed ${
                    isPatient
                      ? "bg-red-600 text-white rounded-2xl rounded-tr-sm shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700 shadow-sm"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-1.5 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc ml-4 mb-1.5 space-y-0.5">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal ml-4 mb-1.5 space-y-0.5">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong
                          className={`font-semibold ${isPatient ? "" : "text-gray-900 dark:text-white"}`}
                        >
                          {children}
                        </strong>
                      ),
                      h3: ({ children }) => (
                        <h3
                          className={`font-bold text-sm mb-1 ${isPatient ? "" : "text-gray-800 dark:text-gray-100"}`}
                        >
                          {children}
                        </h3>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );

  /* =============== RENDER SIDEBAR =============== */
  const renderSidebar = () => (
    <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 flex flex-col rounded-2xl overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white">
          Chat History
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
            title="New Chat"
          >
            <HiPlus size={14} />
          </button>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2">
              <HiOutlineChatAlt2 size={18} className="text-red-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              No chats yet
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              Start a conversation
            </p>
          </div>
        ) : (
          <nav className="space-y-0.5">
            {sessions.map((session) => (
              <button
                key={session._id}
                onClick={() => {
                  handleSelectSession(session._id);
                  setShowSidebar(false);
                }}
                onMouseEnter={() => setHoveredSessionId(session._id)}
                onMouseLeave={() => setHoveredSessionId(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-all relative ${
                  activeSessionId === session._id
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium border border-red-100 dark:border-red-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <HiOutlineChatAlt2
                  size={13}
                  className={`flex-shrink-0 ${
                    activeSessionId === session._id
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-[11px]">
                    {session.title || "New Chat"}
                  </span>
                  <span className="block text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatDate(session.updatedAt || session.createdAt)}
                  </span>
                </div>
                {hoveredSessionId === session._id && (
                  <span
                    onClick={(e) => handleDeleteSession(e, session._id)}
                    className="absolute right-2 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <HiOutlineTrash size={12} />
                  </span>
                )}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );

  /* =============== MAIN WIDGET UI =============== */
  return (
    <div className="fixed bottom-24 right-6 z-50 w-[370px] h-[520px] max-h-[80vh] max-w-[calc(100vw-2rem)] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-gray-400/30 dark:shadow-black/50 border border-gray-200 dark:border-gray-700 overflow-hidden animate-[slideUp_0.3s_ease-out]">
      {/* Sidebar overlay */}
      {showSidebar && renderSidebar()}

      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Chat history"
          >
            <FiMenu size={16} />
          </button>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <FaRobot size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm leading-tight">
              {t("ai.farishtaaAI")}
            </h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              <p className="text-white/70 text-[10px]">{t("ai.online")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (!voiceEnabled) {
                const u = new SpeechSynthesisUtterance("Voice enabled");
                window.speechSynthesis.speak(u);
              } else {
                window.speechSynthesis.cancel();
              }
            }}
            className={`p-1.5 rounded-lg transition text-xs ${
              voiceEnabled
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
            title={voiceEnabled ? t("ai.listening") : t("ai.listen")}
          >
            <GiSpeaker size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <IoClose size={18} />
          </button>
        </div>
      </header>

      {/* Chat area / Welcome */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {!hasSession || chatHistory.length === 0 ? (
          /* Welcome screen */
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-200 dark:shadow-red-900/30">
                <span className="text-white text-lg font-bold">F</span>
              </div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white">
                {firstName
                  ? t("ai.hiUser", { name: firstName })
                  : t("ai.howCanHelp")}
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 max-w-[260px] mx-auto">
                {t("ai.welcomeDesc")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s.desc)}
                  className="flex items-start gap-2 text-left border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-2.5 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50/30 dark:hover:bg-red-900/10 hover:shadow-sm transition-all group"
                >
                  <span className="mt-0.5 flex-shrink-0 p-1 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 transition">
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-700 dark:text-gray-200 text-[11px] group-hover:text-red-600 dark:group-hover:text-red-400 transition leading-tight">
                      {s.title}
                    </p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug truncate">
                      {s.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          renderMessages()
        )}
      </main>

      {/* Input */}
      <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 flex-shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex gap-1.5 items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-2 py-1 border border-gray-200 dark:border-gray-600 focus-within:border-red-300 dark:focus-within:border-red-500 focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:shadow-sm transition-all"
        >
          <button
            type="button"
            onClick={handleMicClick}
            className={`p-1.5 rounded-lg transition flex-shrink-0 ${
              listening
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
            title="Voice input"
          >
            <FaMicrophone size={12} />
          </button>

          <input
            ref={promptRef}
            className="flex-1 min-w-0 bg-transparent py-2 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
            placeholder={t("ai.inputPlaceholder")}
          />

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg transition-all disabled:opacity-40 flex-shrink-0 shadow-sm hover:shadow-md text-xs font-medium"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IoSend size={12} />
            )}
          </button>
        </form>
        <p className="text-center text-[8px] text-gray-400 dark:text-gray-500 mt-1.5">
          {t("ai.disclaimer")}
        </p>
      </div>
    </div>
  );
};

export default FloatingChatWidget;
