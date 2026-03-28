import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { HiOutlineCheck, HiOutlinePhotograph, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi";

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
const DAYS = ["All Days", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_OPTIONS = [
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM"
];

const DoctorProfileEdit = () => {
  const { token } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isHospitalDoctor, setIsHospitalDoctor] = useState(false);

  const [form, setForm] = useState({
    specialist: "",
    experience: "",
    degree: "",
    languages: [],
    about: "",
    address: "",
    photoUrl: "",
    mapLink: "",
    fee: "",
    latitude: "",
    longitude: "",
    clinicName: "",
    availability: [],
  });
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/doctor-dashboard/profile`, {
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
          mapLink: d.mapLink || "",
          fee: d.fee || "",
          latitude: d.location?.coordinates?.[1]?.toString() || "",
          longitude: d.location?.coordinates?.[0]?.toString() || "",
          clinicName: d.clinicName || "",
          availability: d.availability || [],
        });
        setIsHospitalDoctor(!!d.addedByHospital);
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

  const addAvailabilityRow = () => {
    setForm((prev) => ({
      ...prev,
      availability: [
        ...(prev.availability || []),
        { day: "Monday", startTime: "09:00 AM", endTime: "05:00 PM" },
      ],
    }));
    setSaved(false);
  };

  const removeAvailabilityRow = (index) => {
    setForm((prev) => ({
      ...prev,
      availability: (prev.availability || []).filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const updateAvailabilityRow = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      availability: (prev.availability || []).map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      ),
    }));
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/doctor-dashboard/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          experience: form.experience ? Number(form.experience) : undefined,
          fee: form.fee ? Number(form.fee) : undefined,
          availability: (form.availability || []).filter(
            (slot) => slot.day && slot.startTime && slot.endTime
          ),
          location: form.latitude && form.longitude ? {
            type: "Point",
            coordinates: [Number(form.longitude), Number(form.latitude)],
          } : undefined,
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
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Consultation Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={form.fee}
                onChange={(e) => handleChange("fee", e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition"
                placeholder="e.g. 500"
              />
            </div>
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
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Clinic / Hospital Name</label>
              <input
                type="text"
                value={form.clinicName}
                onChange={(e) => handleChange("clinicName", e.target.value)}
                disabled={isHospitalDoctor}
                className={`w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition ${isHospitalDoctor ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder="e.g. City Care Hospital"
              />
              {isHospitalDoctor && (
                <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">This field is managed by your hospital and cannot be edited.</p>
              )}
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

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Clinic Location (Coordinates)</label>
            <div className="flex gap-3 mt-1">
              <input
                type="number"
                value={form.latitude}
                onChange={(e) => handleChange("latitude", e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition"
                placeholder="Latitude (e.g. 19.9158)"
                step="any"
              />
              <input
                type="number"
                value={form.longitude}
                onChange={(e) => handleChange("longitude", e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition"
                placeholder="Longitude (e.g. 83.1050)"
                step="any"
              />
            </div>
            <button
              type="button"
              disabled={geoLoading}
              onClick={() => {
                setGeoLoading(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    handleChange("latitude", pos.coords.latitude.toString());
                    handleChange("longitude", pos.coords.longitude.toString());
                    setGeoLoading(false);
                  },
                  () => { setGeoLoading(false); }
                );
              }}
              className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              {geoLoading ? "Getting location..." : "📍 Use current location"}
            </button>
            <p className="text-xs text-gray-400 mt-1">Required for nearby search. You can use the button above or enter manually.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Google Maps Link</label>
            <input
              type="url"
              value={form.mapLink}
              onChange={(e) => handleChange("mapLink", e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-red-400 transition"
              placeholder="https://maps.google.com/..."
            />
            <p className="text-xs text-gray-400 mt-1">Paste your Google Maps link so patients can get directions to your clinic.</p>
          </div>
        </div>

        {/* Submit */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Availability Slots</h3>
            <button
              type="button"
              onClick={addAvailabilityRow}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400"
            >
              <HiOutlinePlus size={14} /> Add slot window
            </button>
          </div>

          {(form.availability || []).length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No availability added yet. Add at least one slot window so patients can book appointments.
            </p>
          ) : (
            <div className="space-y-3">
              {(form.availability || []).map((row, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={row.day || "Monday"}
                    onChange={(e) => updateAvailabilityRow(index, "day", e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>

                  <select
                    value={row.startTime || "09:00 AM"}
                    onChange={(e) => updateAvailabilityRow(index, "startTime", e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>

                  <select
                    value={row.endTime || "05:00 PM"}
                    onChange={(e) => updateAvailabilityRow(index, "endTime", e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeAvailabilityRow(index)}
                    className="inline-flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-300"
                  >
                    <HiOutlineTrash size={14} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
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
