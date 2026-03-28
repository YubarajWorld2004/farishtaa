import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FarishtaaLogo from "../components/logo/FarishtaaLogo";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { logout } from "../store/slices/authSlice";
import { clearChat } from "../store/slices/patientSlice";
import { setLanguage } from "../store/slices/languageSlice";
import { toggleDarkMode } from "../store/slices/themeSlice";
import { CgProfile } from "react-icons/cg";
import { SlLogout } from "react-icons/sl";
import { LuStethoscope } from "react-icons/lu";
import { TiHome } from "react-icons/ti";
import { MdDashboard } from "react-icons/md";
import { TbShieldCheckeredFilled } from "react-icons/tb";
import { HiMenu, HiX } from "react-icons/hi";
import { FiSun, FiMoon } from "react-icons/fi";


const NavBar = () => {
  const dispatch = useDispatch();
  const { isLoggedIn, userId, userType } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);
  const { darkMode } = useSelector((state) => state.theme);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDoctor = userType === 'Doctor';
  const isHospital = userType === 'Hospital';
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(clearChat());
    dispatch(logout());
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16">

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {mobileOpen ? <HiX size={22} /> : <HiMenu size={22} />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group" onClick={() => setMobileOpen(false)}>
          <FarishtaaLogo className="w-7 h-7 sm:w-9 sm:h-9 group-hover:scale-105 transition" />
          <div className="leading-tight">
            <div className="text-base sm:text-lg font-extrabold text-red-600 tracking-tight">फरिश्ता</div>
            <div className="text-gray-400 dark:text-gray-500 text-[9px] sm:text-[10px] font-medium tracking-wide hidden xs:block">{t('nav.healthcareCompanion')}</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {!isDoctor && !isHospital && (
            <Link
              to="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <TiHome size={16} /> {t('nav.home')}
            </Link>
          )}

          {isHospital ? (
            <Link
              to="/hospital-dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <MdDashboard size={16} /> {t('nav.dashboard')}
            </Link>
          ) : isDoctor ? (
            <Link
              to="/doctor-dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <MdDashboard size={16} /> {t('nav.dashboard')}
            </Link>
          ) : (
            <Link
              to="/categories"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LuStethoscope size={16} /> {t('nav.findDoctors')}
            </Link>
          )}

          {isLoggedIn && !isDoctor && !isHospital && (
            <Link
              to={`/symptoms/${userId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <TbShieldCheckeredFilled size={16} /> {t('nav.aiSymptoms')}
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="p-1.5 sm:p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>

          {/* Language Selector */}
          {isLoggedIn && (
            <select
              value={language}
              onChange={(e) => dispatch(setLanguage(e.target.value))}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer transition"
            >
              <option value="en">🇺🇸 EN</option>
              <option value="hi">🇮🇳 हिं</option>
              <option value="or">🇮🇳 ଓ</option>
            </select>
          )}

          {/* Auth Buttons */}
          {!isLoggedIn ? (
            <Link
              to="/login"
              className="flex items-center gap-1 sm:gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <CgProfile size={14} />
              <span>{t('nav.login')}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm">
                {userType === 'Doctor' ? 'D' : userType === 'Hospital' ? 'H' : 'P'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Logout"
              >
                <SlLogout size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pb-4 pt-2 space-y-1 shadow-lg">
          {!isDoctor && !isHospital && (
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <TiHome size={16} /> {t('nav.home')}
            </Link>
          )}

          {isHospital ? (
            <Link
              to="/hospital-dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <MdDashboard size={16} /> {t('nav.dashboard')}
            </Link>
          ) : isDoctor ? (
            <Link
              to="/doctor-dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <MdDashboard size={16} /> {t('nav.dashboard')}
            </Link>
          ) : (
            <Link
              to="/categories"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LuStethoscope size={16} /> {t('nav.findDoctors')}
            </Link>
          )}

          {isLoggedIn && !isDoctor && !isHospital && (
            <Link
              to={`/symptoms/${userId}`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <TbShieldCheckeredFilled size={16} /> {t('nav.aiSymptoms')}
            </Link>
          )}

          {isLoggedIn && (
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full text-left"
            >
              <SlLogout size={16} /> {t('nav.logout')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
};





export default NavBar;