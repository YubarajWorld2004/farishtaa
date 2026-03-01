import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  HiOutlineStar,
  HiOutlineUserGroup,
  HiOutlineUserAdd,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";

const HospitalDashboard = () => {
  const { token } = useSelector((state) => state.auth);
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState({ totalDoctors: 0, completedProfiles: 0, totalReviews: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("http://localhost:3001/api/hospital-dashboard/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3001/api/hospital-dashboard/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileData = await profileRes.json();
        const statsData = await statsRes.json();

        setHospital(profileData.hospital);
        setStats(statsData.stats || { totalDoctors: 0, completedProfiles: 0, totalReviews: 0, averageRating: 0 });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-6 lg:p-8 text-white shadow-lg shadow-red-200/40 dark:shadow-red-900/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-red-100 text-sm">{greeting()},</p>
            <h1 className="text-2xl lg:text-3xl font-bold mt-1">
              {hospital?.hospitalName || hospital?.firstName || "Hospital Admin"}
            </h1>
            <p className="text-red-100 text-sm mt-2">
              Managing {stats.totalDoctors} doctor{stats.totalDoctors !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <HiOutlineOfficeBuilding size={28} className="text-white" />
          </div>
        </div>
      </div>

      {/* Profile completion */}
      {!hospital?.profileCompleted && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <HiOutlineExclamationCircle size={22} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Complete your hospital profile</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Add your hospital name, address, and details in Settings.
            </p>
          </div>
          <Link
            to="/hospital-dashboard/settings"
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 flex items-center gap-1 flex-shrink-0"
          >
            Complete <HiOutlineArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <HiOutlineUserGroup size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Doctors</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDoctors}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <HiOutlineCheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Profiles Complete</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedProfiles}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <HiOutlineStar size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Reviews</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReviews}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <HiOutlineStar size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating || "—"}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/hospital-dashboard/add-doctor"
          className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:scale-105 transition">
            <HiOutlineUserAdd size={24} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Add New Doctor</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Register a doctor under your hospital</p>
          </div>
          <HiOutlineArrowRight size={16} className="text-gray-400 ml-auto" />
        </Link>

        <Link
          to="/hospital-dashboard/doctors"
          className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-105 transition">
            <HiOutlineUserGroup size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">View All Doctors</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage your doctors and their profiles</p>
          </div>
          <HiOutlineArrowRight size={16} className="text-gray-400 ml-auto" />
        </Link>
      </div>
    </div>
  );
};

export default HospitalDashboard;
