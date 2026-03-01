import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../store/slices/authSlice";
import { clearChat } from "../../../store/slices/patientSlice";
import {
  HiOutlineViewGrid,
  HiOutlineUser,
  HiOutlineStar,
  HiOutlineCog,
  HiOutlineLogout,
} from "react-icons/hi";
import { FiMenu, FiX } from "react-icons/fi";

const sidebarLinks = [
  { to: "/doctor-dashboard", icon: HiOutlineViewGrid, label: "Dashboard", end: true },
  { to: "/doctor-dashboard/profile", icon: HiOutlineUser, label: "My Profile" },
  { to: "/doctor-dashboard/reviews", icon: HiOutlineStar, label: "Reviews" },
  { to: "/doctor-dashboard/settings", icon: HiOutlineCog, label: "Settings" },
];

const DoctorLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(clearChat());
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[260px] bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">Farishtaa</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Doctor Portal</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-800"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                }`
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all w-full"
          >
            <HiOutlineLogout size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiMenu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold">
              D
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              Doctor
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
