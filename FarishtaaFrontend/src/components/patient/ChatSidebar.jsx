import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HiPlus, HiOutlineTrash, HiOutlineChatAlt2 } from "react-icons/hi";
import { FiMenu, FiX } from "react-icons/fi";
import {
  setSessions,
  addSession,
  removeSession,
  setActiveSession,
  clearChat,
} from "../../store/slices/patientSlice";

const ChatSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { token, userId } = useSelector((state) => state.auth);
  const { sessions, activeSessionId } = useSelector((state) => state.patient);

  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [hoveredId, setHoveredId] = useState(null);

  /* ---- fetch sessions on mount ---- */
  useEffect(() => {
    if (!token || !userId) return;

    const fetchSessions = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/patient/sessions/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          if (res.status === 401) navigate("/login");
          return;
        }
        const data = await res.json();
        dispatch(setSessions(data.sessions || []));
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };

    fetchSessions();
  }, [token, userId, dispatch]);

  /* ---- create new chat session ---- */
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
      if (!res.ok) {
        if (res.status === 401) navigate("/login");
        return;
      }
      const data = await res.json();
      if (!data.session?._id) return;
      dispatch(addSession(data.session));
      dispatch(setActiveSession(data.session._id));
      dispatch(clearChat());
      navigate(`/symptoms/${userId}/${data.session._id}`);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  /* ---- select a session ---- */
  const handleSelectSession = (sessionId) => {
    dispatch(setActiveSession(sessionId));
    dispatch(clearChat());
    navigate(`/symptoms/${userId}/${sessionId}`);
  };

  /* ---- delete a session ---- */
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

  /* ---- format date ---- */
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <aside
      className={`h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
        collapsed ? "w-[42px] sm:w-[60px]" : "w-[180px] sm:w-[280px]"
      }`}
    >
      {/* Top section */}
      <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-3 sm:py-4 ${collapsed ? "justify-center" : ""}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 sm:p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition flex-shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiMenu size={18} /> : <FiX size={18} />}
        </button>

        {!collapsed && (
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            <HiPlus size={16} />
            New Chat
          </button>
        )}
      </div>

      {/* collapsed: just the + icon */}
      {collapsed && (
        <button
          onClick={handleNewChat}
          className="mx-auto mt-1 p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
          title="New Chat"
        >
          <HiPlus size={18} />
        </button>
      )}

      {/* Session list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {sessions.length > 0 && (
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 pt-3 pb-2">
              Recent Chats
            </p>
          )}

          <nav className="space-y-0.5">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
                  <HiOutlineChatAlt2 size={22} className="text-red-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No chats yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Start a conversation to get health insights
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session._id}
                  onClick={() => handleSelectSession(session._id)}
                  onMouseEnter={() => setHoveredId(session._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] transition-all group relative ${
                    activeSessionId === session._id
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium shadow-sm border border-red-100 dark:border-red-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <HiOutlineChatAlt2
                    size={15}
                    className={`flex-shrink-0 ${
                      activeSessionId === session._id
                        ? "text-red-500 dark:text-red-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">
                      {session.title || "New Chat"}
                    </span>
                    <span className="block text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatDate(session.updatedAt || session.createdAt)}
                    </span>
                  </div>
                  {hoveredId === session._id && (
                    <span
                      onClick={(e) => handleDeleteSession(e, session._id)}
                      className="absolute right-2 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                      title="Delete chat"
                    >
                      <HiOutlineTrash size={13} />
                    </span>
                  )}
                </button>
              ))
            )}
          </nav>
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">F</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Farishtaa AI</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Health Assistant</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ChatSidebar;
