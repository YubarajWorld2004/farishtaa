import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaStar, FaDirections, FaUserMd } from "react-icons/fa";
import { HiArrowLeft } from "react-icons/hi";
import { useTranslation } from "react-i18next";

const DoctorByCategory = () => {
  const { category } = useParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getPosition = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );

  const formatDistance = (d) => (d ? (d / 1000).toFixed(1) : null);

  const openDirections = (e, lat, lng) => {
    e.stopPropagation();
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const pos = await getPosition();
        const res = await fetch(
          `http://localhost:3001/api/doctor/nearby-search/${category}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          }
        );
        const data = await res.json();
        setDoctors(data.data || []);
      } catch (err) {
        console.error(err);
        setError(t('doctorList.fetchError'));
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [category]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate("/categories")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          >
            <HiArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
              {category}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {doctors.length} {t('doctorList.doctor', { count: doctors.length })} {t('doctorList.foundNearby')}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-lg font-bold text-red-600">फरिश्ता</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500">{t('doctorList.findTrusted')}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse border border-gray-100 dark:border-gray-700">
                <div className="flex gap-5">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-50 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-50 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <FaMapMarkerAlt size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              {t('doctorList.tryAgain')}
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <FaUserMd size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('doctorList.noSpecialists', { category })}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('doctorList.expandSearch')}</p>
            <button
              onClick={() => navigate("/categories")}
              className="mt-5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-5 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              {t('doctorList.browseOther')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => {
              const address = doctor.address
                ? typeof doctor.address === "string"
                  ? doctor.address
                  : Object.values(doctor.address).filter(Boolean).join(", ")
                : t('doctorList.addressNA');

              const displayName = doctor.name?.startsWith("Dr.") ? doctor.name : `Dr. ${doctor.name}`;

              return (
                <div
                  key={doctor._id}
                  onClick={() => navigate(`/doctor/${doctor._id}`)}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 hover:shadow-lg hover:shadow-red-50 dark:hover:shadow-red-900/10 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 p-4 sm:p-5">
                    {/* Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={doctor.photoUrl || "https://images.unsplash.com/vector-1739803316910-1de9cb66fc2d"}
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition">
                        {displayName}
                      </h3>

                      <p className="text-sm font-medium text-red-500 dark:text-red-400 mt-0.5">
                        {doctor.specialist}
                      </p>

                      {doctor.degree && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {doctor.degree}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-sm">
                          <FaStar className="text-amber-400" size={13} />
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {doctor.avgRating?.toFixed(1) || "0.0"}
                          </span>
                        </span>

                        {doctor.distance && (
                          <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full">
                            <FaMapMarkerAlt size={11} />
                            {formatDistance(doctor.distance)} km
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
                        📍 {address}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 justify-end sm:justify-center flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/doctor/${doctor._id}`);
                        }}
                        className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-xs sm:text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                      >
                        {t('doctorList.viewProfile')}
                      </button>

                      <button
                        onClick={(e) =>
                          openDirections(
                            e,
                            doctor.location.coordinates[1],
                            doctor.location.coordinates[0]
                          )
                        }
                        className="px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-200 dark:border-gray-600 text-xs sm:text-sm text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all flex items-center justify-center gap-1.5"
                      >
                        <FaDirections size={13} />
                        {t('doctorList.directions')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorByCategory;