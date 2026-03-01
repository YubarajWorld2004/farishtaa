import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessages from "./common/ErrorMessages";
import FarishtaaLogo from "../logo/FarishtaaLogo";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store/slices/authSlice";
import { useTranslation } from "react-i18next";

const Login = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const dispatch = useDispatch();
  const emailref = useRef();
  const passwordref = useRef();
  const {token}=useSelector(state=>state.auth);
  const { t } = useTranslation();
  const handleSubmit = async (e) => {
    e.preventDefault();
   
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
         "Authorization": `Bearer ${token}`,
         "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email : emailref.current.value,
          password : passwordref.current.value,
        }),
      });

      if (res.status === 200) {
        const data = await res.json();
        dispatch(login(data));
        if (data.userType === 'Doctor') {
          navigate('/doctor-dashboard');
        } else if (data.userType === 'Hospital') {
          navigate('/hospital-dashboard');
        } else {
          navigate('/');
        }
        return;
      }

      if (res.status === 401 || res.status === 500) {
        const data = await res.json();
        setErrors(data.errorMessages);
        return;
      }
    } catch (err) {
      console.error("Error during login:", err);
      setErrors(["Authentication Failed."]);
      return;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 theme-bg">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-5 sm:p-8 
                   border border-red-200 dark:border-gray-700 backdrop-blur-sm"
      >
        {/* Logo Block */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <FarishtaaLogo  className="w-20 h-20 sm:w-30 sm:h-30"/>

          <h2 className="text-2xl sm:text-3xl font-bold text-red-600 mt-2 sm:mt-3 tracking-wide drop-shadow-[0_2px_6px_rgba(255,0,0,0.3)]">
            फरिश्ता
          </h2>
          <p className="text-sm text-red-500 dark:text-red-400 mt-1">{t('auth.motto')}</p>
        </div>

        <h3 className="text-lg sm:text-xl text-red-700 dark:text-red-400 mb-4 sm:mb-5 text-center">
          {t('auth.signInTitle')}
        </h3>

        <ErrorMessages errors={errors} />

        {/* Email */}
        <label className="block text-sm font-medium text-red-700 dark:text-red-400 mt-4">
          {t('auth.enterEmail')}
        </label>
        <input
          type="email"
          ref={emailref}
          className="w-full mt-1 p-2 border border-red-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          placeholder={t('auth.emailPlaceholder')}
        />

        {/* Password */}
        <label className="block text-sm font-medium text-red-700 dark:text-red-400 mt-4">
          {t('auth.password')}
        </label>
        <input
          type="password"
          ref={passwordref}
          className="w-full mt-1 p-2 border border-red-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          placeholder={t('auth.passwordPlaceholder')}
        />

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-3 rounded-lg 
                     text-lg font-semibold hover:bg-red-700 transition mt-6"
        >
          {t('auth.loginBtn')}
        </button>

        {/* Register link */}
        <p className="text-center mt-5 text-sm text-red-600 dark:text-red-400">
          {t('auth.newHere')}{" "}
          <span
            className="font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            {t('auth.createAccount')}
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
