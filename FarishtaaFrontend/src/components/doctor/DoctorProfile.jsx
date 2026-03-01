import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { addReview, setReviews } from "../../store/slices/reviewSlice";
import { FaStar, FaMapMarkerAlt, FaDirections } from "react-icons/fa";
import { HiArrowLeft } from "react-icons/hi";

const StarInput = ({ rating, setRating }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        type="button"
        key={star}
        onClick={() => setRating(star)}
        className={`text-xl transition-colors ${
          star <= rating ? "text-amber-400" : "text-gray-200 hover:text-amber-200"
        }`}
      >
        <FaStar />
      </button>
    ))}
  </div>
);

const DoctorProfile = () => {
  const { t } = useTranslation();
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { token, userId } = useSelector((state) => state.auth);
  const { reviews } = useSelector((state) => state.review);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/doctor/view-profile/${doctorId}`
        );
        const data = await res.json();
        setDoctor(data.doctor);
        dispatch(setReviews(data.doctor.reviews || []));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [doctorId, dispatch]);

  const handleAddReview = async () => {
    if (!reviewText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/doctor/add-review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            doctorId: doctor._id,
            rating,
            review: reviewText,
            patientId: userId,
          }),
        }
      );
      const response = await res.json();
      if (!res.ok) {
        console.error("Review failed:", response.message);
        return;
      }
      dispatch(addReview(response.newreview));
      setReviewText("");
      setRating(5);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">{t('doctorProfile.loading')}</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('doctorProfile.notFound')}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            {t('doctorProfile.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const address = doctor.address
    ? typeof doctor.address === "string"
      ? doctor.address
      : `${doctor.address.street || ""}, ${doctor.address.district || ""}, ${doctor.address.state || ""} ${doctor.address.postcode ? "- " + doctor.address.postcode : ""}`.replace(/^,\s*/, "")
    : t('doctorProfile.addressNA');

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : doctor.ratings || "0.0";

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Sticky back bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          >
            <HiArrowLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('doctorProfile.title')}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">
        {/* PROFILE CARD */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {/* Red accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-500"></div>

          <div className="p-4 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Image */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 shadow-sm">
                <img
                  src={doctor.photoUrl || "https://images.unsplash.com/vector-1739803316910-1de9cb66fc2d"}
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{doctor.name}</h1>

              <p className="text-sm text-red-500 dark:text-red-400 font-medium mt-1">
                {doctor.type === "clinic" ? t('doctorProfile.clinic') : t('doctorProfile.hospitalPractice')}
              </p>

              {/* Specialists */}
              <div className="flex flex-wrap gap-2 mt-3">
                {doctor.specialists?.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full font-medium border border-red-100 dark:border-red-800"
                  >
                    {s.replace("_", " ")}
                  </span>
                ))}
              </div>

              {/* Stats bar */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-3 sm:mt-4">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <FaStar className="text-amber-400" size={14} />
                  <span className="font-bold text-gray-800 dark:text-gray-200">{avgRating}</span>
                  <span className="text-gray-400 dark:text-gray-500">({reviews.length} {t('doctorProfile.review', { count: reviews.length })})</span>
                </span>

                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <FaMapMarkerAlt className="text-red-400" size={12} />
                  <span className="truncate max-w-[200px] sm:max-w-xs">{address}</span>
                </span>
              </div>

              {/* Direction button */}
              {doctor.location?.coordinates && (
                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${doctor.location.coordinates[1]},${doctor.location.coordinates[0]}`,
                      "_blank"
                    )
                  }
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition"
                >
                  <FaDirections size={14} className="text-blue-500" />
                  {t('doctorProfile.getDirections')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* WRITE A REVIEW */}
        {token && (
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-8 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-5">
              {t('doctorProfile.writeReview')}
            </h2>

            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('doctorProfile.rating')}</span>
              <StarInput rating={rating} setRating={setRating} />
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{rating}/5</span>
            </div>

            <textarea
              rows={3}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-300 dark:focus:border-red-500 outline-none resize-none transition"
              placeholder={t('doctorProfile.reviewPlaceholder')}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <div className="flex justify-end mt-3">
              <button
                onClick={handleAddReview}
                disabled={!reviewText.trim() || submitting}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('doctorProfile.submitting') : t('doctorProfile.submitReview')}
              </button>
            </div>
          </div>
        )}

        {/* REVIEWS LIST */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {t('doctorProfile.patientReviews')}
            </h2>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full font-medium">
              {reviews.length} {t('doctorProfile.review', { count: reviews.length })}
            </span>
          </div>

          {reviews?.length > 0 ? (
            <div className="space-y-5">
              {reviews.map((r, i) => (
                <div
                  key={i}
                  className="border-b border-gray-50 dark:border-gray-700 last:border-b-0 pb-5 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {r.patientId?.firstName
                          ? r.patientId.firstName.charAt(0).toUpperCase()
                          : "A"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                          {r.patientId?.firstName
                            ? `${r.patientId.firstName} ${r.patientId.lastName}`
                            : t('doctorProfile.anonymous')}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FaStar
                          key={s}
                          size={12}
                          className={s <= r.rating ? "text-amber-400" : "text-gray-200 dark:text-gray-600"}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 sm:mt-3 leading-relaxed pl-0 sm:pl-12">
                    {r.review}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FaStar size={28} className="mx-auto text-gray-200 dark:text-gray-600 mb-3" />
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('doctorProfile.noReviews')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;