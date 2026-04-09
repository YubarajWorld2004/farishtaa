import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { jsPDF } from "jspdf";
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineDownload,
} from "react-icons/hi";

const toAbsoluteFileUrl = (relativeUrl) => {
  if (!relativeUrl) return "#";
  if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl;
  return `${import.meta.env.VITE_API_BASE_URL}${relativeUrl}`;
};

const emptyMedicine = () => ({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });

const toSafeText = (value, fallback = "N/A") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const toDateTimeText = (value, fallback = "N/A", locale) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleString(locale || undefined);
};

const sanitizeFileNamePart = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const FARISHTAA_LOGO_WITH_NAME_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="100" viewBox="0 0 360 100" fill="none">
  <g fill="none" stroke="#E50914" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(0 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(51.42857142857143 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(102.85714285714286 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(154.28571428571428 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(205.71428571428572 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(257.14285714285717 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(308.57142857142856 50 50)" />
    <circle cx="50" cy="50" r="6" stroke="#E50914" />
  </g>
  <text
    x="94"
    y="63"
    fill="#E50914"
    font-family="Arial, Helvetica, sans-serif"
    font-size="44"
    font-weight="700"
  >Farishtaa</text>
</svg>
`;

let cachedLogoPngDataUrl = null;
let cachedPrescriptionWatermarkDataUrl = null;

const PRESCRIPTION_WATERMARK_LABELS = ["फरिश्ता", "Farishtaa", "ଫରିଶ୍ତା"];

const toSvgDataUrl = (svgMarkup) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup.trim())}`;

const loadImageFromUrl = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load SVG logo image"));
    image.src = src;
  });

const getFarishtaaLogoPngDataUrl = async () => {
  if (cachedLogoPngDataUrl) return cachedLogoPngDataUrl;

  const image = await loadImageFromUrl(toSvgDataUrl(FARISHTAA_LOGO_WITH_NAME_SVG));
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 100;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to create logo canvas context");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  cachedLogoPngDataUrl = canvas.toDataURL("image/png");

  return cachedLogoPngDataUrl;
};

const getPrescriptionWatermarkDataUrl = async () => {
  if (cachedPrescriptionWatermarkDataUrl) return cachedPrescriptionWatermarkDataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1273;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to create watermark canvas context");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((-32 * Math.PI) / 180);
  context.font =
    '700 52px "Noto Sans Devanagari", "Noto Sans Oriya", "Nirmala UI", "Mangal", "Kalinga", "Arial Unicode MS", "Arial", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(148, 163, 184, 0.12)";

  for (let row = -7; row <= 7; row += 1) {
    for (let col = -6; col <= 6; col += 1) {
      const index = ((row + col) % PRESCRIPTION_WATERMARK_LABELS.length + PRESCRIPTION_WATERMARK_LABELS.length) %
        PRESCRIPTION_WATERMARK_LABELS.length;
      context.fillText(PRESCRIPTION_WATERMARK_LABELS[index], col * 260, row * 150);
    }
  }

  context.restore();
  cachedPrescriptionWatermarkDataUrl = canvas.toDataURL("image/png");

  return cachedPrescriptionWatermarkDataUrl;
};

const getPrescriptionPdfFileName = (prescription) => {
  const issued = new Date(prescription?.issuedAt);
  const datePart = Number.isNaN(issued.getTime())
    ? "undated"
    : issued.toISOString().slice(0, 10);
  const idPart = sanitizeFileNamePart((prescription?._id || "").slice(-8)) || "record";
  return `prescription-${datePart}-${idPart}.pdf`;
};

const PrescriptionCenter = () => {
  const { token, userType } = useSelector((state) => state.auth);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isDoctor = userType === "Doctor";
  const isPatient = userType === "Patient";
  const requestedDoctorId = searchParams.get("doctorId") || "";
  const requestedAppointmentId = searchParams.get("appointmentId") || "";

  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    appointmentId: "",
    patientId: "",
    diagnosis: "",
    notes: "",
    file: null,
  });
  const [medicines, setMedicines] = useState([emptyMedicine()]);

  const basePath = isDoctor
    ? `${import.meta.env.VITE_API_BASE_URL}/api/doctor-dashboard`
    : `${import.meta.env.VITE_API_BASE_URL}/api/patient`;

  const prescriptionListQuery = new URLSearchParams({ page: "1", limit: "100" }).toString();
  const acceptedAppointmentsQuery = new URLSearchParams({
    status: "accepted",
    page: "1",
    limit: "100",
  }).toString();

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${basePath}/prescriptions?${prescriptionListQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return;
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      console.error(t("prescription.errors.fetchPrescriptions"), error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async () => {
    if (!isDoctor) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/doctor-dashboard/appointments?${acceptedAppointmentsQuery}`,
        {
        headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) return;

      const allowed = (data.appointments || []).filter((item) =>
        item.status === "accepted"
      );
      setAppointments(allowed);
    } catch (error) {
      console.error(t("prescription.errors.fetchAppointments"), error);
    }
  };

  useEffect(() => {
    if (!token || (!isDoctor && !isPatient)) {
      navigate("/login");
      return;
    }

    fetchPrescriptions();
    fetchDoctorAppointments();
  }, [token, isDoctor, isPatient]);

  const selectedAppointment = useMemo(
    () => appointments.find((appt) => appt._id === form.appointmentId),
    [appointments, form.appointmentId]
  );

  const filteredPrescriptions = useMemo(() => {
    if (requestedDoctorId) {
      return prescriptions.filter((prescription) => {
        const doctorRef = prescription?.doctor;
        if (!doctorRef) {
          return false;
        }

        if (typeof doctorRef === "string") {
          return doctorRef === requestedDoctorId;
        }

        return doctorRef?._id === requestedDoctorId || doctorRef?.id === requestedDoctorId;
      });
    }

    if (!requestedAppointmentId) {
      return prescriptions;
    }

    return prescriptions.filter((prescription) => {
      const appointmentRef = prescription?.appointment;
      if (!appointmentRef) {
        return false;
      }

      if (typeof appointmentRef === "string") {
        return appointmentRef === requestedAppointmentId;
      }

      return appointmentRef?._id === requestedAppointmentId;
    });
  }, [prescriptions, requestedDoctorId, requestedAppointmentId]);

  useEffect(() => {
    if (!selectedAppointment) return;
    setForm((prev) => ({ ...prev, patientId: selectedAppointment.patient?._id || "" }));
  }, [selectedAppointment]);

  useEffect(() => {
    if (!isDoctor || !form.appointmentId) {
      return;
    }

    const stillExists = appointments.some((appointment) => appointment._id === form.appointmentId);
    if (stillExists) {
      return;
    }

    setForm((prev) => ({ ...prev, appointmentId: "", patientId: "" }));
  }, [isDoctor, appointments, form.appointmentId]);

  useEffect(() => {
    if (!isDoctor || !requestedAppointmentId || appointments.length === 0) {
      return;
    }

    const matchedAppointment = appointments.find((appointment) => appointment._id === requestedAppointmentId);
    if (!matchedAppointment) {
      return;
    }

    setForm((prev) => {
      if (prev.appointmentId === matchedAppointment._id) {
        return prev;
      }

      return {
        ...prev,
        appointmentId: matchedAppointment._id,
      };
    });
  }, [isDoctor, requestedAppointmentId, appointments]);

  const clearActiveFilter = () => {
    if (!requestedDoctorId && !requestedAppointmentId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("doctorId");
    nextParams.delete("appointmentId");
    setSearchParams(nextParams);
  };

  const updateMedicine = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addMedicine = () => setMedicines((prev) => [...prev, emptyMedicine()]);

  const removeMedicine = (index) => {
    setMedicines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!isDoctor) return;

    const cleanMeds = medicines.filter((item) => item.name.trim());
    if (!form.patientId) {
      alert(t("prescription.errors.selectPatientFirst"));
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("patientId", form.patientId);
      if (form.appointmentId) formData.append("appointmentId", form.appointmentId);
      formData.append("diagnosis", form.diagnosis);
      formData.append("notes", form.notes);
      formData.append("medicines", JSON.stringify(cleanMeds));
      if (form.file) formData.append("file", form.file);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/doctor-dashboard/prescriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || t("prescription.errors.createFailed"));
        return;
      }

      setForm({ appointmentId: "", patientId: "", diagnosis: "", notes: "", file: null });
      setMedicines([emptyMedicine()]);
      await fetchPrescriptions();
      alert(t("prescription.messages.created"));
    } catch (error) {
      console.error(t("prescription.errors.createRequestFailed"), error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPrescriptionPdf = async (prescription) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const lineWidth = pageWidth - margin * 2;
    const valueOffset = 96;
    let y = margin;
    const locale = i18n.resolvedLanguage || undefined;
    const pdfNa = t("prescription.pdf.na");
    const generatedAt = new Date();
    const generatedAtText = generatedAt.toLocaleString(locale);

    let watermarkDataUrl = null;
    try {
      watermarkDataUrl = await getPrescriptionWatermarkDataUrl();
    } catch (error) {
      console.error(t("prescription.errors.watermarkFailed"), error);
    }

    const drawWatermark = () => {
      if (!watermarkDataUrl) return;
      doc.addImage(watermarkDataUrl, "PNG", 0, 0, pageWidth, pageHeight);
    };

    const ensureSpace = (required = 24) => {
      if (y + required <= pageHeight - margin) return;
      doc.addPage();
      drawWatermark();
      y = margin;
    };

    const addDivider = () => {
      ensureSpace(16);
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y, pageWidth - margin, y);
      y += 16;
    };

    const addSectionTitle = (title) => {
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text(title, margin, y);
      y += 16;
    };

    const addField = (label, value) => {
      ensureSpace(22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`${label}:`, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(17, 24, 39);
      const valueLines = doc.splitTextToSize(toSafeText(value, pdfNa), lineWidth - valueOffset);
      doc.text(valueLines, margin + valueOffset, y);
      y += Math.max(14, valueLines.length * 13 + 3);
    };

    drawWatermark();

    const doctorName = toSafeText(
      `${prescription?.doctor?.firstName || ""} ${prescription?.doctor?.lastName || ""}`,
      pdfNa
    );
    const patientName = toSafeText(
      `${prescription?.patient?.firstName || ""} ${prescription?.patient?.lastName || ""}`,
      t("prescription.pdf.registeredPatient")
    );
    const appointmentLabel = prescription?.appointment
      ? `${toSafeText(prescription.appointment.appointmentDate, t("prescription.pdf.unknownDate"))} ${
          prescription.appointment.slotTime ? `${t("prescription.pdf.at")} ${prescription.appointment.slotTime}` : ""
        }`.trim()
      : t("prescription.pdf.notLinked");

    try {
      const logoDataUrl = await getFarishtaaLogoPngDataUrl();
      const logoWidth = 220;
      const logoHeight = 62;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoDataUrl, "PNG", logoX, y - 8, logoWidth, logoHeight);
      y += logoHeight + 6;
    } catch (error) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(220, 38, 38);
      doc.text("Farishtaa", pageWidth / 2, y + 18, { align: "center" });
      y += 30;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(220, 38, 38);
    doc.text(t("prescription.pdf.title"), margin, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(t("prescription.pdf.generatedAt", { date: generatedAtText }), margin, y);
    y += 18;

    addDivider();

    addSectionTitle(t("prescription.pdf.sections.header"));
    addField(t("prescription.pdf.fields.prescriptionId"), prescription?._id || "");
    addField(t("prescription.pdf.fields.appointment"), appointmentLabel);

    addSectionTitle(t("prescription.pdf.sections.doctorDetails"));
    addField(t("prescription.pdf.fields.doctor"), doctorName);
    addField(t("prescription.pdf.fields.speciality"), prescription?.doctor?.specialist);
    addField(t("prescription.pdf.fields.clinic"), prescription?.doctor?.clinicName || t("prescription.pdf.notSpecified"));

    addSectionTitle(t("prescription.pdf.sections.patientDetails"));
    addField(t("prescription.pdf.fields.patient"), patientName);

    addSectionTitle(t("prescription.pdf.sections.clinicalSummary"));
    addField(t("prescription.pdf.fields.diagnosis"), prescription?.diagnosis || t("prescription.pdf.notProvided"));
    addField(t("prescription.pdf.fields.notes"), prescription?.notes || t("prescription.pdf.notProvided"));

    addSectionTitle(t("prescription.pdf.sections.medicationPlan"));
    if (!Array.isArray(prescription?.medicines) || prescription.medicines.length === 0) {
      addField(t("prescription.pdf.fields.medicines"), t("prescription.pdf.noMedicinesListed"));
    } else {
      prescription.medicines.forEach((medicine, index) => {
        ensureSpace(62);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        doc.text(`${index + 1}. ${toSafeText(medicine?.name, t("prescription.pdf.unnamedMedicine"))}`, margin, y);
        y += 14;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 65, 81);
        const medicineDetail = [
          `${t("prescription.form.dosage")}: ${toSafeText(medicine?.dosage, t("prescription.pdf.emptyValue"))}`,
          `${t("prescription.form.frequency")}: ${toSafeText(medicine?.frequency, t("prescription.pdf.emptyValue"))}`,
          `${t("prescription.form.duration")}: ${toSafeText(medicine?.duration, t("prescription.pdf.emptyValue"))}`,
          `${t("prescription.form.instructions")}: ${toSafeText(medicine?.instructions, t("prescription.pdf.emptyValue"))}`,
        ].join(" | ");

        const medicineLines = doc.splitTextToSize(medicineDetail, lineWidth - 12);
        doc.text(medicineLines, margin + 12, y);
        y += medicineLines.length * 12 + 8;
      });
    }

    addSectionTitle(t("prescription.pdf.sections.attachments"));
    addField(t("prescription.pdf.fields.attachedFile"), prescription?.file?.fileName || t("prescription.pdf.noFileAttached"));

    addDivider();
    const signedDoctorName =
      doctorName && doctorName !== pdfNa
        ? doctorName.replace(/^dr\.?\s*/i, "")
        : t("prescription.pdf.unknownDoctor");

    const signatureBoxWidth = 240;
    const signatureBoxHeight = 58;
    const signatureBoxX = pageWidth - margin - signatureBoxWidth;
    let signatureBoxY = pageHeight - margin - signatureBoxHeight;

    if (y + 24 > signatureBoxY - 8) {
      doc.addPage();
      drawWatermark();
      y = margin;
      signatureBoxY = pageHeight - margin - signatureBoxHeight;
    }

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.8);
    doc.roundedRect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(t("prescription.pdf.signatureValid"), signatureBoxX + 10, signatureBoxY + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(t("prescription.pdf.digitallySignedBy", { name: signedDoctorName }), signatureBoxX + 10, signatureBoxY + 27);
    doc.text(
      t("prescription.pdf.dateLabel", { date: generatedAtText }),
      signatureBoxX + 10,
      signatureBoxY + 38
    );
    doc.text(t("prescription.pdf.reasonApprovedPrescription"), signatureBoxX + 10, signatureBoxY + 49);

    const iconSize = 18;
    const iconX = signatureBoxX + signatureBoxWidth - iconSize - 10;
    const iconY = signatureBoxY + 9;

    doc.setFillColor(34, 197, 94);
    doc.roundedRect(iconX, iconY, iconSize, iconSize, 4, 4, "F");

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.line(iconX + 4, iconY + 10, iconX + 8, iconY + 14);
    doc.line(iconX + 8, iconY + 14, iconX + 14, iconY + 6);

    doc.save(getPrescriptionPdfFileName(prescription));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("prescription.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isDoctor
            ? t("prescription.subtitleDoctor")
            : t("prescription.subtitlePatient")}
        </p>
      </div>

      {(requestedDoctorId || requestedAppointmentId) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
          <span>
            {requestedDoctorId
              ? "Showing prescriptions for the selected doctor."
              : "Showing prescriptions for the selected appointment."}
          </span>
          <button
            type="button"
            onClick={clearActiveFilter}
            className="inline-flex items-center rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            Show All
          </button>
        </div>
      )}

      {isDoctor && (
        <form
          onSubmit={handleCreatePrescription}
          className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t("prescription.create")}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("prescription.form.appointment")}</span>
              <select
                value={form.appointmentId}
                onChange={(e) => setForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
                className="mt-1.5 w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">{t("prescription.form.selectAppointment")}</option>
                {appointments.map((appointment) => (
                  <option key={appointment._id} value={appointment._id}>
                    {appointment.patient?.firstName} {appointment.patient?.lastName} • {appointment.appointmentDate} {appointment.slotTime}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("prescription.form.patientIdFallback")}</span>
              <input
                value={form.patientId}
                onChange={(e) => setForm((prev) => ({ ...prev, patientId: e.target.value }))}
                className="mt-1.5 w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={t("prescription.form.patientIdPlaceholder")}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("prescription.form.diagnosis")}</span>
            <textarea
              rows={2}
              value={form.diagnosis}
              onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
              className="mt-1.5 w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("prescription.form.medicines")}</p>
              <button
                type="button"
                onClick={addMedicine}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600"
              >
                <HiOutlinePlus size={14} /> {t("prescription.form.addMedicine")}
              </button>
            </div>

            {medicines.map((medicine, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  value={medicine.name}
                  onChange={(e) => updateMedicine(index, "name", e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t("prescription.form.medicine")}
                />
                <input
                  value={medicine.dosage}
                  onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t("prescription.form.dosage")}
                />
                <input
                  value={medicine.frequency}
                  onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t("prescription.form.frequency")}
                />
                <input
                  value={medicine.duration}
                  onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t("prescription.form.duration")}
                />
                <div className="flex gap-2">
                  <input
                    value={medicine.instructions}
                    onChange={(e) => updateMedicine(index, "instructions", e.target.value)}
                    className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={t("prescription.form.instructions")}
                  />
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="px-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300"
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("prescription.form.additionalNotes")}</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="mt-1.5 w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("prescription.form.attachFile")}</span>
            <input
              type="file"
              onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              className="mt-1.5 block w-full text-xs text-gray-500 dark:text-gray-300"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? t("prescription.form.creating") : t("prescription.form.createPrescription")}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white inline-flex items-center gap-2">
          <HiOutlineDocumentText size={18} className="text-red-600" />
          {isDoctor ? t("prescription.issuedPrescriptions") : t("prescription.myPrescriptions")}
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("prescription.loadingPrescriptions")}</p>
        ) : filteredPrescriptions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("prescription.noPrescriptions")}</p>
        ) : (
          <div className="space-y-3">
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription._id}
                className="rounded-xl border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {isDoctor
                        ? `${prescription.patient?.firstName || ""} ${prescription.patient?.lastName || ""}`.trim()
                        : t("prescription.doctorName", {
                            name: `${prescription.doctor?.firstName || ""} ${prescription.doctor?.lastName || ""}`.trim(),
                          })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("prescription.issuedOn")} {new Date(prescription.issuedAt).toLocaleString(i18n.resolvedLanguage || undefined)}
                    </p>
                    {prescription.diagnosis && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{t("prescription.form.diagnosis")}: {prescription.diagnosis}</p>
                    )}
                    {prescription.medicines?.length > 0 && (
                      <ul className="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                        {prescription.medicines.map((med, idx) => (
                          <li key={idx}>
                            {med.name}
                            {med.dosage ? ` • ${med.dosage}` : ""}
                            {med.frequency ? ` • ${med.frequency}` : ""}
                            {med.duration ? ` • ${med.duration}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {prescription.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t("prescription.form.additionalNotes")}: {prescription.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    {isPatient && (
                      <button
                        type="button"
                        onClick={() => handleDownloadPrescriptionPdf(prescription)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                      >
                        <HiOutlineDownload size={14} />
                          {t("prescription.downloadPdf")}
                      </button>
                    )}

                    {prescription.file?.fileUrl && (
                      <a
                        href={toAbsoluteFileUrl(prescription.file.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                      >
                        <HiOutlineDownload size={14} />
                        {prescription.file.fileName || t("prescription.downloadFile")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionCenter;
