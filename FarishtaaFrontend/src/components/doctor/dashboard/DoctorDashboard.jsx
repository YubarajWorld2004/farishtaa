import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  HiOutlineStar,
  HiOutlineChat,
  HiOutlineUser,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

const DoctorDashboard = () => {
  const { token } = useSelector((state) => state.auth);
  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("http://localhost:3001/api/doctor-dashboard/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3001/api/doctor-dashboard/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileData = await profileRes.json();
        const statsData = await statsRes.json();

        setDoctor(profileData.doctor);
        setStats(statsData.stats || { totalReviews: 0, averageRating: 0 });
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-6 lg:p-8 text-white shadow-lg shadow-red-200/40 dark:shadow-red-900/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-red-100 text-sm">{greeting()},</p>
            <h1 className="text-2xl lg:text-3xl font-bold mt-1">
              Dr. {doctor?.firstName} {doctor?.lastName}
            </h1>
            <p className="text-red-100 text-sm mt-2">
              {doctor?.specialist || "Specialist not set"} &middot;{" "}
              {doctor?.experience ? `${doctor.experience} yrs experience` : "Experience not set"}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <HiOutlineUser size={28} className="text-white" />
          </div>
        </div>
      </div>

      {/* Profile completion banner */}
      {!doctor?.profileCompleted && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <HiOutlineExclamationCircle size={22} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Complete your profile</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Add your specialization, experience, and other details so patients can find you.
            </p>
          </div>
          <Link
            to="/doctor-dashboard/profile"
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 flex items-center gap-1 flex-shrink-0"
          >
            Complete <HiOutlineArrowRight size={12} />
          </Link>
        </div>
      )}

      {doctor?.profileCompleted && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <HiOutlineCheckCircle size={22} className="text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Your profile is complete and visible to patients.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<HiOutlineStar size={22} className="text-amber-500" />}
          label="Average Rating"
          value={stats.averageRating > 0 ? `${stats.averageRating} / 5` : "No ratings"}
          bg="bg-amber-50 dark:bg-amber-900/20"
        />
        <StatCard
          icon={<HiOutlineChat size={22} className="text-blue-500" />}
          label="Total Reviews"
          value={stats.totalReviews}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<HiOutlineUser size={22} className="text-emerald-500" />}
          label="Profile Status"
          value={doctor?.profileCompleted ? "Complete" : "Incomplete"}
          bg="bg-emerald-50 dark:bg-emerald-900/20"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/doctor-dashboard/profile"
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition">
              <HiOutlineUser size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition">
                Edit Profile
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Update your details & specialization</p>
            </div>
            <HiOutlineArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-red-500 transition" />
          </Link>

          <Link
            to="/doctor-dashboard/reviews"
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition">
              <HiOutlineStar size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition">
                View Reviews
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">See what patients are saying</p>
            </div>
            <HiOutlineArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-red-500 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, bg }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-0.5">{value}</p>
    </div>
  </div>
);

export default DoctorDashboard;
