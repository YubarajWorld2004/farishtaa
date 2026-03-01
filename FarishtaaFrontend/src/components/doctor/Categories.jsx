import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Stethoscope,
  HeartPulse,
  Brain,
  Baby,
  Syringe,
  Eye,
  Activity,
  Bone,
  HandHeart,
  Smile,
  Search,
  ArrowRight,
} from "lucide-react";

// Icon mapping (keys in lowercase)
const iconMap = {
  "general physician": Stethoscope,
  "cardiologist": HeartPulse,
  "neurologist": Brain,
  "pediatrician": Baby,
  "dermatologist": HandHeart,
  "dentist": Smile,
  "orthopedic": Bone,
  "ophthalmologist": Eye,
  "physician": Activity,
  "diabetologist": Syringe,
  "gynecologist": HandHeart,
  "psychiatrist": Brain,
};

// Color pairs for category cards
const colorPairs = [
  { bg: "bg-red-50", icon: "bg-red-100", text: "text-red-600", hover: "hover:border-red-200 hover:shadow-red-100/50" },
  { bg: "bg-blue-50", icon: "bg-blue-100", text: "text-blue-600", hover: "hover:border-blue-200 hover:shadow-blue-100/50" },
  { bg: "bg-emerald-50", icon: "bg-emerald-100", text: "text-emerald-600", hover: "hover:border-emerald-200 hover:shadow-emerald-100/50" },
  { bg: "bg-purple-50", icon: "bg-purple-100", text: "text-purple-600", hover: "hover:border-purple-200 hover:shadow-purple-100/50" },
  { bg: "bg-amber-50", icon: "bg-amber-100", text: "text-amber-600", hover: "hover:border-amber-200 hover:shadow-amber-100/50" },
  { bg: "bg-pink-50", icon: "bg-pink-100", text: "text-pink-600", hover: "hover:border-pink-200 hover:shadow-pink-100/50" },
  { bg: "bg-teal-50", icon: "bg-teal-100", text: "text-teal-600", hover: "hover:border-teal-200 hover:shadow-teal-100/50" },
  { bg: "bg-indigo-50", icon: "bg-indigo-100", text: "text-indigo-600", hover: "hover:border-indigo-200 hover:shadow-indigo-100/50" },
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/doctor/categories`);
        const { categories } = await response.json();

        if (Array.isArray(categories)) {
          const filtered = [...new Set(
            categories
              .filter(cat => cat && cat.toString().trim() !== "")
              .map(cat => cat.toString().trim())
          )];
          setCategories(filtered);
        }
      } catch (error) {
        console.log("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleClick = (category) => {
    navigate(`/nearby-search/${category}`);
  };

  const filtered = categories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-red-600 via-red-500 to-rose-500 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-16">
          <h1 className="text-2xl sm:text-4xl font-bold">
            {t('categories.title')}
          </h1>
          <p className="mt-2 text-red-100 text-sm sm:text-lg max-w-xl">
            {t('categories.subtitle')}
          </p>

          {/* Search */}
          <div className="mt-6 max-w-md">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t('categories.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/95 backdrop-blur text-gray-700 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse border border-gray-100 dark:border-gray-700">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4"></div>
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-50 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('categories.noResults')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {t('categories.tryDifferent')}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mb-5">
              {filtered.length} {t('categories.specialty', { count: filtered.length })} {t('categories.available')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((category, idx) => {
                const Icon = iconMap[category.toLowerCase()] || Stethoscope;
                const colors = colorPairs[idx % colorPairs.length];

                return (
                  <button
                    key={idx}
                    onClick={() => handleClick(category)}
                    className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-left cursor-pointer
                               border border-gray-100 dark:border-gray-700 ${colors.hover}
                               hover:shadow-lg transition-all duration-300
                               group flex flex-col`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colors.icon} dark:opacity-80 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon size={18} className={`${colors.text} sm:hidden`} />
                      <Icon size={22} className={`${colors.text} hidden sm:block`} />
                    </div>

                    <p className="text-gray-800 dark:text-gray-200 font-semibold text-xs sm:text-sm leading-tight">
                      {category}
                    </p>

                    <div className="flex items-center gap-1 mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors">
                      <span>{t('categories.findNearby')}</span>
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Categories;