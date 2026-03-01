import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { HiOutlineCog, HiOutlineCheckCircle, HiOutlineExclamation } from "react-icons/hi";

const HospitalSettings = () => {
  const { token } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    hospitalName: "", hospitalAddress: "", hospitalPhone: "", hospitalAbout: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/hospital-dashboard/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const h = data.hospital;
        setForm({
          hospitalName: h?.hospitalName || h?.firstName || "",
          hospitalAddress: h?.hospitalAddress || "",
          hospitalPhone: h?.hospitalPhone || "",
          hospitalAbout: h?.hospitalAbout || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);
      const res = await fetch("http://localhost:3001/api/hospital-dashboard/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to save");
        return;
      }

      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("Something went wrong.");
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

  const inputClass =
    "w-full mt-1 p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none bg-white dark:bg-gray-700 dark:text-white text-sm transition";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <HiOutlineCog size={22} className="text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hospital Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update your hospital profile information</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
          <HiOutlineExclamation size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
          <HiOutlineCheckCircle size={18} className="text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hospital Name</label>
          <input
            type="text" name="hospitalName" value={form.hospitalName} onChange={handleChange}
            placeholder="Enter hospital name" className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
          <input
            type="text" name="hospitalAddress" value={form.hospitalAddress} onChange={handleChange}
            placeholder="Full hospital address" className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
          <input
            type="text" name="hospitalPhone" value={form.hospitalPhone} onChange={handleChange}
            placeholder="Contact number" className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">About</label>
          <textarea
            name="hospitalAbout" value={form.hospitalAbout} onChange={handleChange} rows={4}
            placeholder="Brief description about your hospital..."
            className={inputClass + " resize-none"}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default HospitalSettings;
