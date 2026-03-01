import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineEye,
} from "react-icons/hi";

const HospitalDoctors = () => {
  const { token } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchDoctors = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/hospital-dashboard/doctors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [token]);

  const handleRemoveDoctor = async (doctorId) => {
    try {
      await fetch(`http://localhost:3001/api/hospital-dashboard/doctors/${doctorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctors((prev) => prev.filter((d) => d._id !== doctorId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to remove doctor:", err);
    }
  };

  const getAvgRating = (reviews) => {
    if (!reviews || reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Doctors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Link
          to="/hospital-dashboard/add-doctor"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm"
        >
          + Add Doctor
        </Link>
      </div>

      {doctors.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <HiOutlineUser size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No doctors yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
            Start by adding doctors to your hospital
          </p>
          <Link
            to="/hospital-dashboard/add-doctor"
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
          >
            Add Your First Doctor
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {doctors.map((doctor) => {
            const avgRating = getAvgRating(doctor.doctorReviews);
            return (
              <div
                key={doctor._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 flex items-center justify-center flex-shrink-0">
                    {doctor.photoUrl ? (
                      <img src={doctor.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-bold text-lg">
                        {doctor.firstName?.[0] || "D"}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      {doctor.profileCompleted ? (
                        <HiOutlineCheckCircle size={16} className="text-green-500" title="Profile complete" />
                      ) : (
                        <HiOutlineExclamationCircle size={16} className="text-amber-500" title="Profile incomplete" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {doctor.specialist || "Specialization not set"}
                      {doctor.experience ? ` · ${doctor.experience} yrs exp` : ""}
                    </p>
                    {doctor.degree && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doctor.degree}</p>
                    )}

                    {/* Rating */}
                    {avgRating && (
                      <div className="flex items-center gap-1 mt-2">
                        <HiOutlineStar size={14} className="text-amber-500" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {avgRating}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({doctor.doctorReviews?.length} review{doctor.doctorReviews?.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/hospital-dashboard/doctors/${doctor._id}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                      title="View details"
                    >
                      <HiOutlineEye size={18} />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(doctor._id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      title="Remove doctor"
                    >
                      <HiOutlineTrash size={18} />
                    </button>
                  </div>
                </div>

                {/* Delete confirmation */}
                {deleteConfirm === doctor._id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <p className="text-xs text-red-600 dark:text-red-400 flex-1">
                      Remove Dr. {doctor.firstName} from your hospital?
                    </p>
                    <button
                      onClick={() => handleRemoveDoctor(doctor._id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HospitalDoctors;
