import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  HiOutlinePaperClip,
  HiOutlinePaperAirplane,
  HiOutlineVideoCamera,
  HiOutlineUserCircle,
  HiOutlineClock,
} from "react-icons/hi";

const toDisplayName = (user) => {
  if (!user) return "";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim();
};

const toAbsoluteFileUrl = (relativeUrl) => {
  if (!relativeUrl) return "#";
  if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl;
  return `${import.meta.env.VITE_API_BASE_URL}${relativeUrl}`;
};

const PATIENT_BLOCKED_STATUSES = ["rejected", "completed", "cancelled", "closed"];

const TelemedicinePortal = () => {
  const { token, userType } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(searchParams.get("session") || "");
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const isDoctor = userType === "Doctor";
  const isPatient = userType === "Patient";

  const basePath = useMemo(() => {
    if (isDoctor) return `${import.meta.env.VITE_API_BASE_URL}/api/doctor-dashboard`;
    return `${import.meta.env.VITE_API_BASE_URL}/api/patient`;
  }, [isDoctor]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch(`${basePath}/telemedicine/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.message || t("telemedicine.errors.loadSessions"));
        return;
      }

      const list = data.sessions || [];
      setSessions(list);

      const currentOrQuerySessionId = searchParams.get("session") || activeSessionId;
      const currentSessionExists = currentOrQuerySessionId
        ? list.some((session) => session._id === currentOrQuerySessionId)
        : false;

      if (list.length === 0) {
        setActiveSessionId("");
        setMessages([]);
        setSearchParams({});
      } else if (!currentSessionExists) {
        const first = list[0]._id;
        setActiveSessionId(first);
        setSearchParams({ session: first });
      }
    } catch (error) {
      console.error(t("telemedicine.errors.fetchSessions"), error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId) => {
    if (!sessionId) return;

    try {
      setLoadingMessages(true);
      const res = await fetch(`${basePath}/telemedicine/sessions/${sessionId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        if (isPatient && res.status === 403) {
          setMessages([]);
          await fetchSessions();
          return;
        }
        console.error(data.message || t("telemedicine.errors.loadMessages"));
        return;
      }
      setMessages(data.messages || []);
    } catch (error) {
      console.error(t("telemedicine.errors.fetchMessages"), error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!token || (!isDoctor && !isPatient)) {
      navigate("/login");
      return;
    }
    fetchSessions();
  }, [token, isDoctor, isPatient]);

  useEffect(() => {
    const fromQuery = searchParams.get("session");
    if (fromQuery && fromQuery !== activeSessionId) {
      setActiveSessionId(fromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeSessionId) return;
    fetchMessages(activeSessionId);

    const timer = setInterval(() => {
      fetchMessages(activeSessionId);
    }, 6000);

    return () => clearInterval(timer);
  }, [activeSessionId, basePath]);

  const handleSessionSelect = (sessionId) => {
    setActiveSessionId(sessionId);
    setSearchParams({ session: sessionId });
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (isPatientChatBlocked) {
      alert(t("telemedicine.chatUnavailable"));
      return;
    }

    if (!activeSessionId || (!content.trim() && files.length === 0) || sending) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append("content", content);
      files.forEach((file) => formData.append("files", file));

      const res = await fetch(`${basePath}/telemedicine/sessions/${activeSessionId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (isPatient && res.status === 403) {
          setMessages([]);
          await fetchSessions();
        }
        alert(data.message || t("telemedicine.errors.sendMessage"));
        return;
      }

      setContent("");
      setFiles([]);
      setMessages((prev) => [...prev, data.message]);
      fetchSessions();
    } catch (error) {
      console.error(t("telemedicine.errors.sendMessage"), error);
    } finally {
      setSending(false);
    }
  };

  const activeSession = sessions.find((session) => session._id === activeSessionId);
  const isPatientChatBlocked =
    isPatient &&
    !!activeSession &&
    (activeSession.status === "closed" ||
      PATIENT_BLOCKED_STATUSES.includes(activeSession.appointment?.status));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 h-[calc(100vh-80px)]">
      <div className="h-full grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <aside className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white inline-flex items-center gap-2">
                  <HiOutlineVideoCamera size={20} className="text-red-600" /> {t("telemedicine.title")}
            </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("telemedicine.subtitle")}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loadingSessions ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 p-3">{t("telemedicine.loadingSessions")}</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 p-3">
                    {t("telemedicine.noActiveSessions")}
              </p>
            ) : (
              sessions.map((session) => {
                const counterpart = isDoctor ? session.patient : session.doctor;
                    const counterpartName = toDisplayName(counterpart) || t("telemedicine.sessionFallback");
                const isActive = session._id === activeSessionId;

                return (
                  <button
                    key={session._id}
                    onClick={() => handleSessionSelect(session._id)}
                    className={`w-full text-left rounded-xl p-3 border transition ${
                      isActive
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{counterpartName}</p>
                    {session.appointment && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-flex items-center gap-1">
                        <HiOutlineClock size={12} />
                        {session.appointment.appointmentDate} • {session.appointment.slotTime}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
          {activeSession ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white inline-flex items-center gap-2">
                  <HiOutlineUserCircle size={18} className="text-red-600" />
                  {toDisplayName(isDoctor ? activeSession.patient : activeSession.doctor)}
                </p>
                {activeSession.appointment && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("telemedicine.appointmentAt", {
                        date: activeSession.appointment.appointmentDate,
                        time: activeSession.appointment.slotTime,
                      })}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/70 dark:bg-gray-900/20">
                {loadingMessages ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("telemedicine.loadingMessages")}</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("telemedicine.noMessages")}
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderType === userType;
                    const senderName = toDisplayName(message.sender);
                    const senderTypeLabel =
                      message.senderType === "Doctor"
                        ? t("auth.doctor")
                        : message.senderType === "Patient"
                          ? t("auth.patient")
                          : message.senderType;

                    return (
                      <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2.5 border ${
                            mine
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <p className={`text-[11px] mb-1 ${mine ? "text-red-100" : "text-gray-500 dark:text-gray-400"}`}>
                            {senderName || senderTypeLabel}
                          </p>

                          {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}

                          {!!message.attachments?.length && (
                            <div className="mt-2 space-y-1.5">
                              {message.attachments.map((attachment, index) => (
                                <a
                                  key={`${message._id}-${index}`}
                                  href={toAbsoluteFileUrl(attachment.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`block text-xs underline ${mine ? "text-red-100" : "text-blue-600 dark:text-blue-300"}`}
                                >
                                  {attachment.fileName}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                {isPatientChatBlocked && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t("telemedicine.chatClosed")}
                  </p>
                )}

                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isPatientChatBlocked}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t("telemedicine.typeMessage")}
                />

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                    <HiOutlinePaperClip size={14} />
                    {t("telemedicine.attachFiles")}
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files || []))}
                      disabled={isPatientChatBlocked}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isPatientChatBlocked || sending || (!content.trim() && files.length === 0)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <HiOutlinePaperAirplane size={14} />
                    {sending ? t("telemedicine.sending") : t("telemedicine.send")}
                  </button>
                </div>

                {files.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("telemedicine.filesSelected", {
                      count: files.length,
                      names: files.map((f) => f.name).join(", "),
                    })}
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500 dark:text-gray-400 p-6">
              {t("telemedicine.selectSession")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TelemedicinePortal;
