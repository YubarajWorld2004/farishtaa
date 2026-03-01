import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { FaRobot } from "react-icons/fa";
import FloatingChatWidget from "./FloatingChatWidget";

const FloatingAIButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, userType } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Hide for doctors and hospitals, and hide when already on the symptoms/chat page
  if (userType === "Doctor" || userType === "Hospital") return null;
  if (location.pathname.includes("/symptoms")) return null;

  const handleClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setOpen((prev) => !prev);
  };

  return (
    <>
      {/* Chat Widget Popup */}
      {open && isLoggedIn && <FloatingChatWidget onClose={() => setOpen(false)} />}

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Tooltip */}
        {hovered && !open && (
          <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out] whitespace-nowrap">
            AI Symptoms Checker
            <div className="absolute -bottom-1 right-5 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`group relative w-14 h-14 ${
            open
              ? "bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-gray-300/50 hover:shadow-gray-400/50"
              : "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-300/50 hover:shadow-red-400/50"
          } text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center`}
          aria-label="AI Symptoms Checker"
        >
          {/* Ping animation (only when closed) */}
          {!open && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></span>
          )}

          {open ? (
            <IoClose size={24} className="relative z-10" />
          ) : (
            <FaRobot size={22} className="relative z-10" />
          )}
        </button>
      </div>
    </>
  );
};

export default FloatingAIButton;
