import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../store/slices/authSlice";
import { clearChat } from "../../../store/slices/patientSlice";
import { HiOutlineLogout, HiOutlineShieldCheck } from "react-icons/hi";

const DoctorSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(clearChat());
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Manage your account preferences.</p>
      </div>

      <div className="space-y-4">
        {/* Account section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <HiOutlineShieldCheck size={16} className="text-red-500" />
            Account
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Receive email updates about new reviews</p>
              </div>
              <div className="w-10 h-6 bg-gray-200 dark:bg-gray-600 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm" />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Visibility</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Make your profile visible to patients</p>
              </div>
              <div className="w-10 h-6 bg-red-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/30 p-5">
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Danger Zone</h3>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <HiOutlineLogout size={16} />
            Logout from Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorSettings;
