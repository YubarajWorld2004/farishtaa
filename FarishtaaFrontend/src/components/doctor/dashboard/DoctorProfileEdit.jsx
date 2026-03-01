import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { HiOutlineCheck, HiOutlinePhotograph } from "react-icons/hi";

const SPECIALIST_OPTIONS = [
  "Cardiologist",
  "Dermatologist",
  "ENT Specialist",
  "Endocrinologist",
  "General Physician",
  "General Practitioner",
  "Gynecologist",
  "Neurologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "Psychiatrist",
];

const LANGUAGE_OPTIONS = ["English", "Hindi", "Odia", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati"];

const DoctorProfileEdit = () => {
  const { token } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    specialist: "",
    experience: "",
    degree: "",
    languages: [],
    about: "",
    address: "",
    photoUrl: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/doctor-dashboard/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const d = data.doctor;
        setForm({
          specialist: d.specialist || "",
          experience: d.experience || "",
          degree: d.degree || "",
          languages: d.languages || [],
          about: d.about || "",
          address: d.address || "",
          photoUrl: d.photoUrl || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const toggleLanguage = (lang) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("http://localhost:3001/api/doctor-dashboard/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          experience: form.experience ? Number(form.experience) : undefined,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Keep your profile updated so patients can find you easily.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo URL */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Profile Photo URL</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-600">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <HiOutlinePhotograph size={24} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <input
              type="url"
              value={form.photoUrl}
              onChange={(e) => handleChange("photoUrl", e.target.value)}
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition"
              placeholder="https://example.com/photo.jpg"
            />
          </div>
        </div>

        {/* Specialist & Experience */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Professional Details</h3>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Specialization</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIST_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleChange("specialist", s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    form.specialist === s
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Years of Experience</label>
              <input
                type="number"
                min="0"
                value={form.experience}
                onChange={(e) => handleChange("experience", e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition"
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Degree / Qualification</label>
              <input
                type="text"
                value={form.degree}
                onChange={(e) => handleChange("degree", e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition"
                placeholder="e.g. MBBS, MD"
              />
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Languages Spoken</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1 ${
                  form.languages.includes(lang)
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {form.languages.includes(lang) && <HiOutlineCheck size={12} />}
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* About & Address */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Additional Information</h3>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">About</label>
            <textarea
              rows={4}
              value={form.about}
              onChange={(e) => handleChange("about", e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition resize-none"
              placeholder="Write a short bio about yourself..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Clinic / Hospital Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition"
              placeholder="Full address"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-[fadeIn_0.3s_ease-out]">
              <HiOutlineCheck size={16} /> Saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default DoctorProfileEdit;
