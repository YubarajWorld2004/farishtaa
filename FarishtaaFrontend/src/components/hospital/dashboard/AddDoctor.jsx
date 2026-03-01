import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HiOutlineUserAdd, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi";

const SPECIALIZATIONS = [
  "Cardiologist", "Dermatologist", "Dentist", "ENT", "Gastroenterologist",
  "General Physician", "Gynecologist", "Neurologist", "Oncologist",
  "Ophthalmologist", "Orthopedic", "Pediatrician", "Psychiatrist",
  "Pulmonologist", "Urologist",
];

const DAYS = ["All Days", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_OPTIONS = [
  "Any Time",
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM",
  "10:00 PM",
];

const AddDoctor = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    specialist: "", experience: "", degree: "",
    languages: "", about: "", address: "", photoUrl: "",
  });
  const [availability, setAvailability] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.firstName || !form.email || !form.password) {
      setError("First name, email, and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("http://localhost:3001/api/hospital-dashboard/doctors", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          experience: form.experience ? Number(form.experience) : undefined,
          languages: form.languages ? form.languages.split(",").map((l) => l.trim()) : [],
          availability,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to add doctor");
        return;
      }

      setSuccess(`Dr. ${data.doctor.firstName} has been added successfully!`);
      setForm({
        firstName: "", lastName: "", email: "", password: "",
        specialist: "", experience: "", degree: "",
        languages: "", about: "", address: "", photoUrl: "",
      });
      setAvailability([]);

      // Navigate to doctors list after a short delay
      setTimeout(() => navigate("/hospital-dashboard/doctors"), 1500);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full mt-1 p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none bg-white dark:bg-gray-700 dark:text-white text-sm transition";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <HiOutlineUserAdd size={22} className="text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add New Doctor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Register a doctor under your hospital</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
          <HiOutlineExclamation size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
          <HiOutlineCheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" name="firstName" value={form.firstName} onChange={handleChange}
              placeholder="Enter first name" className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
            <input
              type="text" name="lastName" value={form.lastName} onChange={handleChange}
              placeholder="Enter last name" className={inputClass}
            />
          </div>
        </div>

        {/* Email & Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="doctor@email.com" className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="Temporary password" className={inputClass}
            />
          </div>
        </div>

        {/* Specialization & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specialization</label>
            <select
              name="specialist" value={form.specialist} onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select specialization</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Experience (years)</label>
            <input
              type="number" name="experience" value={form.experience} onChange={handleChange}
              placeholder="e.g. 5" min="0" className={inputClass}
            />
          </div>
        </div>

        {/* Degree */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Degree</label>
          <input
            type="text" name="degree" value={form.degree} onChange={handleChange}
            placeholder="e.g. MBBS, MD" className={inputClass}
          />
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Languages</label>
          <input
            type="text" name="languages" value={form.languages} onChange={handleChange}
            placeholder="e.g. English, Hindi, Odia" className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
          <input
            type="text" name="address" value={form.address} onChange={handleChange}
            placeholder="Clinic / hospital address" className={inputClass}
          />
        </div>

        {/* Photo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo URL</label>
          <input
            type="url" name="photoUrl" value={form.photoUrl} onChange={handleChange}
            placeholder="https://example.com/photo.jpg" className={inputClass}
          />
          {form.photoUrl && (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={form.photoUrl}
                alt="Preview"
                className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-600"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="text-xs text-gray-400">Preview</span>
            </div>
          )}
        </div>

        {/* Availability / Timing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Availability</label>
            <button
              type="button"
              onClick={() => setAvailability([...availability, { day: "Monday", startTime: "09:00 AM", endTime: "05:00 PM" }])}
              className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 transition"
            >
              <HiOutlinePlus size={14} /> Add Slot
            </button>
          </div>

          {availability.length === 0 ? (
            <div className="border border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">No availability added yet. Click "Add Slot" to set available days and times.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availability.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  {/* Day */}
                  <select
                    value={slot.day}
                    onChange={(e) => {
                      const updated = [...availability];
                      updated[idx] = { ...updated[idx], day: e.target.value };
                      setAvailability(updated);
                    }}
                    className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  {/* Start Time */}
                  <select
                    value={slot.startTime}
                    onChange={(e) => {
                      const updated = [...availability];
                      updated[idx] = { ...updated[idx], startTime: e.target.value };
                      setAvailability(updated);
                    }}
                    className="w-[120px] p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <span className="text-xs text-gray-400">to</span>

                  {/* End Time */}
                  <select
                    value={slot.endTime}
                    onChange={(e) => {
                      const updated = [...availability];
                      updated[idx] = { ...updated[idx], endTime: e.target.value };
                      setAvailability(updated);
                    }}
                    className="w-[120px] p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => setAvailability(availability.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">About</label>
          <textarea
            name="about" value={form.about} onChange={handleChange} rows={3}
            placeholder="Brief description about the doctor..."
            className={inputClass + " resize-none"}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          {submitting ? "Adding Doctor..." : "Add Doctor"}
        </button>
      </form>
    </div>
  );
};

export default AddDoctor;
