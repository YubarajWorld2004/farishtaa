import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { HiOutlineStar, HiStar } from "react-icons/hi";

const DoctorReviews = () => {
  const { token } = useSelector((state) => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/doctor-dashboard/reviews", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Patient Reviews</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          See feedback from your patients.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i}>
                {i <= Math.round(avgRating) ? (
                  <HiStar size={16} className="text-amber-400" />
                ) : (
                  <HiOutlineStar size={16} className="text-gray-300 dark:text-gray-600" />
                )}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{reviews.length} reviews</p>
        </div>

        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400 w-3">{star}</span>
                <HiStar size={12} className="text-amber-400" />
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-400 dark:text-gray-500 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <HiOutlineStar size={40} className="text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No reviews yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Reviews from patients will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400">
                    {review.patientId?.firstName?.charAt(0) || "P"}
                    {review.patientId?.lastName?.charAt(0) || ""}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {review.patientId?.firstName} {review.patientId?.lastName}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i}>
                      {i <= review.rating ? (
                        <HiStar size={14} className="text-amber-400" />
                      ) : (
                        <HiOutlineStar size={14} className="text-gray-300 dark:text-gray-600" />
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {review.review && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
                  {review.review}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorReviews;
