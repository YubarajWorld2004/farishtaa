import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GiSpeaker } from "react-icons/gi";
import { FaMicrophone } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md";
import { IoSend } from "react-icons/io5";
import { HiOutlineLightBulb, HiOutlineHeart, HiOutlineShieldCheck, HiOutlineChat } from "react-icons/hi";
import {
  addMessage,
  setChat,
  setError,
  setLoading,
  setActiveSession,
  addSession,
  clearChat,
  updateSessionTitle,
} from "../../store/slices/patientSlice";
import Chats from "./Chats.jsx";
import ChatSidebar from "./ChatSidebar.jsx";

const AISymptomsChecker = () => {
  const { t } = useTranslation();
  const { userId, sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { token, firstName } = useSelector((state) => state.auth);
  const { loading, chatHistory, activeSessionId } = useSelector(
    (state) => state.patient
  );
  const { language } = useSelector((state) => state.language);

  const promptRef = useRef(null);
  const recognitionRef = useRef(null);

  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const hasSession = !!sessionId;

  const SUGGESTIONS = [
    {
      icon: <HiOutlineHeart size={20} className="text-red-500" />,
      title: t('ai.describeSymptoms'),
      desc: t('ai.descSymptomsHint'),
    },
    {
      icon: <HiOutlineLightBulb size={20} className="text-amber-500" />,
      title: t('ai.askMedicine'),
      desc: t('ai.askMedicineHint'),
    },
    {
      icon: <HiOutlineShieldCheck size={20} className="text-emerald-500" />,
      title: t('ai.specialistAdvice'),
      desc: t('ai.specialistHint'),
    },
    {
      icon: <HiOutlineChat size={20} className="text-blue-500" />,
      title: t('ai.checkSeverity'),
      desc: t('ai.severityHint'),
    },
  ];

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (sessionId) {
      dispatch(setActiveSession(sessionId));
    }
  }, [token, sessionId, dispatch, navigate]);

  /* ================= LOAD CHAT FOR SESSION ================= */
  useEffect(() => {
    if (!token || !sessionId) return;

    const fetchMessages = async () => {
      try {
        dispatch(setLoading(true));
        const res = await fetch(
          `http://localhost:3001/api/patient/symptoms/${userId}/${sessionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
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
  }, [userId, sessionId, token, dispatch]);

  /* ================= SPEECH RECOGNITION ================= */
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
      promptRef.current.value =
        (promptRef.current.value || "") + " " + transcript;
    };

    recognitionRef.current = recognition;
  }, [language]);

  /* ================= AUTO SPEAK LATEST AI MESSAGE ================= */
  useEffect(() => {
    if (!voiceEnabled) return;
    if (!chatHistory || chatHistory.length === 0) return;
    if (!window.speechSynthesis) return;

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

  /* ================= CREATE SESSION IF NONE ================= */
  const ensureSession = async () => {
    if (sessionId) return sessionId;

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
        console.error("Failed to create session: HTTP", res.status);
        if (res.status === 401) navigate("/login");
        return null;
      }
      const data = await res.json();
      if (!data.session?._id) {
        console.error("Invalid session response", data);
        return null;
      }
      dispatch(addSession(data.session));
      dispatch(setActiveSession(data.session._id));
      navigate(`/symptoms/${userId}/${data.session._id}`, { replace: true });
      return data.session._id;
    } catch (err) {
      console.error("Failed to create session:", err);
      return null;
    }
  };

  /* ================= HANDLERS ================= */
  const handleMicClick = () => recognitionRef.current?.start();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = promptRef.current.value.trim();
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

      if (data.chats && data.chats.length > 0) {
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
        alert("Session expired. Please log in again.");
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

  /* ================= UI ================= */
  return (
    <div className="h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] flex bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-2 sm:px-5 py-2 sm:py-3 flex justify-between items-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <Link
            to="/"
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition text-sm font-medium"
          >
            <MdArrowBack size={16} />
            <span className="hidden sm:inline">{t('ai.back')}</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-[10px] sm:text-xs font-bold">F</span>
            </div>
            <div>
              <h1 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">
                {t('ai.farishtaaAI')}
              </h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('ai.online')}</p>
              </div>
            </div>
          </div>

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
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition text-[10px] sm:text-xs font-medium ${
              voiceEnabled
                ? "bg-red-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <GiSpeaker size={14} />
            {voiceEnabled ? t('ai.listening') : t('ai.listen')}
          </button>
        </header>

        {/* Chat area or Welcome screen */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          {!hasSession || chatHistory.length === 0 ? (
            /* Welcome screen */
            <div className="h-full flex flex-col items-center justify-center px-3 sm:px-6">
              <div className="text-center mb-6 sm:mb-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-3 sm:mb-5 shadow-lg shadow-red-200 dark:shadow-red-900/30">
                  <span className="text-white text-xl sm:text-2xl font-bold">F</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {firstName ? t('ai.hiUser', { name: firstName }) : t('ai.howCanHelp')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1.5 sm:mt-2 max-w-md mx-auto px-2">
                  {t('ai.welcomeDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-xl w-full">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s.desc)}
                    className="flex items-start gap-2 sm:gap-3 text-left border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3.5 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50/30 dark:hover:bg-red-900/10 hover:shadow-sm transition-all group"
                  >
                    <span className="mt-0.5 flex-shrink-0 p-1 sm:p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 transition">
                      {s.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-700 dark:text-gray-200 text-xs sm:text-sm group-hover:text-red-600 dark:group-hover:text-red-400 transition">
                        {s.title}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed truncate">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Chats />
          )}
        </main>

        {/* Input */}
        <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 sm:px-4 py-1.5 sm:py-3">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex gap-1 sm:gap-2 items-center bg-gray-50 dark:bg-gray-700 rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-1 sm:py-1.5 border border-gray-200 dark:border-gray-600 focus-within:border-red-300 dark:focus-within:border-red-500 focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:shadow-sm transition-all"
          >
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-1.5 sm:p-2 rounded-xl transition flex-shrink-0 ${
                listening
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
              title="Voice input"
            >
              <FaMicrophone size={14} />
            </button>

            <input
              ref={promptRef}
              className="flex-1 min-w-0 bg-transparent py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
              placeholder={t('ai.inputPlaceholder')}
            />

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl transition-all disabled:opacity-40 flex-shrink-0 shadow-sm hover:shadow-md text-sm font-medium"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <IoSend size={14} />
                  <span className="hidden sm:inline">{t('ai.send')}</span>
                </>
              )}
            </button>
          </form>
          <p className="text-center text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 sm:mt-2 px-2">
            {t('ai.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AISymptomsChecker;