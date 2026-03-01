import React, { useRef, useState } from "react";
import FarishtaaLogo from "../logo/FarishtaaLogo";
import { useNavigate } from "react-router-dom";
import ErrorMessages from "./common/ErrorMessages";
import { useTranslation } from "react-i18next";
const Signup = () => {
  const firstNameref = useRef();
  const lastNameref = useRef();
  const emailref = useRef();
  const passwordref = useRef();
  const ageref = useRef();
  const hospitalNameRef = useRef();
  const navigate=useNavigate();
  const { t } = useTranslation();

  const [gender, setGender] = useState("Male");
  const [userType, setUserType] = useState("Patient");
  const [errors,setErrors]=useState([]);
  const handleSubmit =async (e) => {
    e.preventDefault();
   try{
  const res=await fetch('http://localhost:3001/api/auth/signup',{
        method:'POST',
        headers : {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
          firstName : firstNameref.current.value,
            lastName : lastNameref.current.value,
            email : emailref.current.value,
            password : passwordref.current.value,
            age : userType !== 'Hospital' ? ageref.current?.value : undefined,
            gender : userType !== 'Hospital' ? gender : undefined,
            userType : userType,
            hospitalName : userType === 'Hospital' ? hospitalNameRef.current?.value : undefined,
        })
  }
    );
    if(res.status===201){
      navigate('/login');
    } 
     if(res.status===422){
    const data=await res.json();
     setErrors(data.errorMessages);
     return ;
    }
   }catch(err){
   console.error('Error during signup:', err);
   setErrors(['An unexpected error occurred. Please try again later.']);
  return;   
}

  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-3 sm:px-4 py-4 sm:py-0">
  <form
    onSubmit={handleSubmit}
    className="w-full max-w-xl bg-white dark:bg-gray-800 shadow-md rounded-2xl p-5 sm:p-10 border border-red-200 dark:border-gray-700"
  >
    {/* Logo Block */}
    <div className="flex flex-col items-center mb-5 sm:mb-8">
      <FarishtaaLogo />

      <h2 className="text-2xl sm:text-3xl font-bold text-red-600 mt-2 sm:mt-3 tracking-wide drop-shadow-[0_2px_6px_rgba(255,0,0,0.3)]">
        Farishtaa
      </h2>
      <p className="text-sm text-red-500 dark:text-red-400 mt-1">
        {t('auth.motto')}
      </p>
    </div>

    {/* Heading */}
    <h3 className="text-lg sm:text-xl font-semibold text-red-700 dark:text-red-400 mb-4 sm:mb-6 text-center">
      {t('auth.signupTitle')}
    </h3>
 <ErrorMessages  errors={errors} />

    {/* Two Column Name Fields */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-red-700 dark:text-red-400">
          {t('auth.firstName')}
        </label>
        <input
          type="text"
          ref={firstNameref}
          className="w-full mt-1 p-2 border border-red-300 dark:border-gray-600 rounded-lg 
                   focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          placeholder={t('auth.firstNamePlaceholder')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-red-700 dark:text-red-400">
          {t('auth.lastName')}
        </label>
        <input
          type="text"
          ref={lastNameref}
          className="w-full mt-1 p-2 border border-red-300 dark:border-gray-600 rounded-lg
                   focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          placeholder={t('auth.lastNamePlaceholder')}
        />
      </div>
    </div>

    {/* Email */}
    <label className="block mt-4 text-sm font-medium text-red-700 dark:text-red-400">
      {t('auth.email')}
    </label>
    <input
      type="email"
      ref={emailref}
      className="w-full mt-1 p-2 border border-red-300 dark:border-gray-600 rounded-lg 
                 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
      placeholder={t('auth.emailPlaceholder')}
    />

    {/* Password */}
    <label className="block mt-4 text-sm font-medium text-red-700 dark:text-red-400">
      {t('auth.password')}
    </label>
    <input
      type="password"
      ref={passwordref}
      className="w-full mt-1 p-2 border border-red-300 dark:border-gray-600 rounded-lg
                 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
      placeholder={t('auth.passwordPlaceholder')}
    />

    {/* Age — hide for Hospital */}
    {userType !== 'Hospital' && (
      <>
        <label className="block mt-4 text-sm font-medium text-red-700 dark:text-red-400">
          {t('auth.age')}
        </label>
        <input
          type="number"
          ref={ageref}
          className="w-full mt-1 p-2 border border-red-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          placeholder={t('auth.agePlaceholder')}
        />
      </>
    )}

    {/* Gender — hide for Hospital */}
    {userType !== 'Hospital' && (
      <>
        <label className="block mt-5 mb-2 text-sm font-medium text-red-700 dark:text-red-400">
          {t('auth.gender')}
        </label>
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
          {[{val: "Male", label: t('auth.male')}, {val: "Female", label: t('auth.female')}, {val: "Others", label: t('auth.others')}].map((g) => (
            <button
              key={g.val}
              type="button"
              onClick={() => setGender(g.val)}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border transition text-xs sm:text-sm
              ${
                gender === g.val
                  ? "border-red-600 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "border-red-300 dark:border-gray-600 text-red-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-gray-700"
              }
            `}
            >
              {g.label}
            </button>
          ))}
        </div>
      </>
    )}

    {/* Hospital Name — show only for Hospital */}
    {userType === 'Hospital' && (
      <>
        <label className="block mt-4 text-sm font-medium text-red-700 dark:text-red-400">
          Hospital Name
        </label>
        <input
          type="text"
          ref={hospitalNameRef}
          className="w-full mt-1 p-2 border border-red-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          placeholder="Enter hospital name"
        />
      </>
    )}

    {/* User Type */}
    <label className="block mb-2 text-sm font-medium text-red-700 dark:text-red-400">
      {t('auth.userType')}
    </label>
    <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
      {[{val: "Patient", label: t('auth.patient')}, {val: "Doctor", label: t('auth.doctor')}, {val: "Hospital", label: "Hospital"}].map((u) => (
        <button
          key={u.val}
          type="button"
          onClick={() => setUserType(u.val)}
          className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border transition text-xs sm:text-sm
          ${
            userType === u.val
              ? "border-red-600 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              : "border-red-300 dark:border-gray-600 text-red-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-gray-700"
          }
        `}
        >
          {u.label}
        </button>
      ))}
    </div>

    {/* Submit */}
    <button
      type="submit"
      className="w-full bg-red-600 text-white py-3 rounded-lg 
                 text-lg font-semibold hover:bg-red-700 transition"
    >
      {t('auth.signupBtn')}
    </button>
  </form>
</div>

  );
};

export default Signup;
