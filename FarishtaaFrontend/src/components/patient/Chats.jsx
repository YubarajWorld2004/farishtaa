import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

const Chats = () => {
  const { t } = useTranslation();
  const { chatHistory } = useSelector((state) => state.patient);
  const bottomRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="w-full h-full overflow-y-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:gap-4">
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
              <div className={`flex gap-1.5 sm:gap-2.5 ${isPatient ? "flex-row-reverse" : ""} max-w-[90%] sm:max-w-[80%]`}>
                
                {/* Avatar */}
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 mt-0.5 ${
                    isPatient
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm"
                  }`}
                >
                  {isPatient ? t('ai.you') : "F"}
                </div>

                {/* Bubble */}
                <div
                  className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm leading-relaxed ${
                    isPatient
                      ? "bg-red-600 text-white rounded-2xl rounded-tr-md shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl rounded-tl-md border border-gray-100 dark:border-gray-700 shadow-sm"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc ml-5 mb-2 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal ml-5 mb-2 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className={`font-semibold ${isPatient ? "" : "text-gray-900 dark:text-white"}`}>
                          {children}
                        </strong>
                      ),
                      h3: ({ children }) => (
                        <h3 className={`font-bold text-base mb-1 ${isPatient ? "" : "text-gray-800 dark:text-gray-100"}`}>
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
};

export default Chats;