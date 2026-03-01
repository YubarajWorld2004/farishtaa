import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import {
  HiOutlineStar,
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineLocationMarker,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineChat,
} from "react-icons/hi";

const HospitalDoctorDetail = () => {
  const { token } = useSelector((state) => state.auth);
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("details"); // details | reviews

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, revRes] = await Promise.all([
          fetch(`http://localhost:3001/api/hospital-dashboard/doctors/${doctorId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:3001/api/hospital-dashboard/doctors/${doctorId}/reviews`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const docData = await docRes.json();
        const revData = await revRes.json();

        setDoctor(docData.doctor);
        setReviews(revData.reviews || []);
      } catch (err) {
        console.error("Failed to fetch doctor details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, doctorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">Doctor not found</p>
        <Link to="/hospital-dashboard/doctors" className="text-red-600 text-sm mt-2 inline-block hover:underline">
          Back to doctors
        </Link>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        to="/hospital-dashboard/doctors"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
      >
        <HiOutlineArrowLeft size={16} /> Back to doctors
      </Link>

      {/* Doctor Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 flex items-center justify-center flex-shrink-0">
            {doctor.photoUrl ? (
              <img src={doctor.photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <HiOutlineUser size={32} className="text-red-500 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Dr. {doctor.firstName} {doctor.lastName}
              </h1>
              {doctor.profileCompleted ? (
                <HiOutlineCheckCircle size={18} className="text-green-500" />
              ) : (
                <HiOutlineExclamationCircle size={18} className="text-amber-500" />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {doctor.specialist || "Specialization not set"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doctor.email}</p>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-3">
              {doctor.experience && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <HiOutlineBriefcase size={14} /> {doctor.experience} yrs
                </div>
              )}
              {doctor.degree && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <HiOutlineAcademicCap size={14} /> {doctor.degree}
                </div>
              )}
              {avgRating && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <HiOutlineStar size={14} className="text-amber-500" /> {avgRating} ({reviews.length})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <button
          onClick={() => setTab("details")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === "details"
              ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === "reviews"
              ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      {/* Tab Content */}
      {tab === "details" ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <InfoRow label="Full Name" value={`Dr. ${doctor.firstName} ${doctor.lastName || ""}`} />
          <InfoRow label="Email" value={doctor.email} />
          <InfoRow label="Specialization" value={doctor.specialist || "Not set"} />
          <InfoRow label="Experience" value={doctor.experience ? `${doctor.experience} years` : "Not set"} />
          <InfoRow label="Degree" value={doctor.degree || "Not set"} />
          <InfoRow label="Languages" value={doctor.languages?.length > 0 ? doctor.languages.join(", ") : "Not set"} />
          <InfoRow label="Address" value={doctor.address || "Not set"} icon={<HiOutlineLocationMarker size={14} />} />
          {doctor.about && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">About</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{doctor.about}</p>
            </div>
          )}
          {/* Availability */}
          {doctor.availability && doctor.availability.length > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Availability</p>
              <div className="grid gap-1.5">
                {doctor.availability.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">{slot.day}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{slot.startTime} – {slot.endTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center border border-gray-100 dark:border-gray-700">
              <HiOutlineChat size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                      {review.patientId?.firstName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {review.patientId?.firstName || "Anonymous"} {review.patientId?.lastName || ""}
                      </p>
                      <p className="text-[10px] text-gray-400">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <HiOutlineStar
                        key={star}
                        size={14}
                        className={star <= review.rating ? "text-amber-500 fill-amber-500" : "text-gray-300 dark:text-gray-600"}
                      />
                    ))}
                  </div>
                </div>
                {review.review && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.review}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-start gap-3">
    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 w-28 flex-shrink-0 pt-0.5">{label}</p>
    <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1">
      {icon} {value}
    </p>
  </div>
);

export default HospitalDoctorDetail;
