import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineVideoCamera,
  HiOutlineXCircle,
} from "react-icons/hi";
import PaymentDetailsModal from "../common/PaymentDetailsModal.jsx";
import { notifyError, notifySuccess } from "../../utils/hotToast.jsx";

const STATUS_BADGE = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
  completed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  closed: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
};

const PAYMENT_BADGE = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  not_required:
    "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  failed: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
  refunded: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
};

const PAYMENT_LABEL = {
  paid: "Paid",
  pending: "Pending",
  not_required: "No Payment",
  failed: "Failed",
  refunded: "Refunded",
};

const getPaymentStatus = (appointment) => {
  if (appointment?.paymentStatus) return appointment.paymentStatus;
  if (appointment?.paymentRequired) return "pending";
  return "not_required";
};

const getAppointmentAmountInRupees = (appointment) => {
  const amountInPaise = Number(appointment?.paymentAmount);
  if (Number.isFinite(amountInPaise) && amountInPaise > 0) {
    return amountInPaise / 100;
  }

  const doctorFee = Number(appointment?.doctor?.fee);
  if (Number.isFinite(doctorFee) && doctorFee > 0) {
    return doctorFee;
  }

  return 0;
};

const formatInr = (amount) => {
  const safeAmount = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

const MyAppointments = () => {
  const { token, userType } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [selectedPaymentAppointment, setSelectedPaymentAppointment] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/patient/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.message || t("myAppointments.errors.loadAppointments");
        setError(message);
        notifyError("Load failed", message);
        return;
      }
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error(err);
      const message = t("myAppointments.errors.loadAppointments");
      setError(message);
      notifyError("Load failed", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || userType !== "Patient") {
      navigate("/login");
      return;
    }
    fetchAppointments();
  }, [token, userType, navigate]);

  useEffect(() => {
    if (!location.state?.successMessage) return;

    notifySuccess("Success", location.state.successMessage, { push: true });
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const cancelAppointment = async (appointmentId) => {
    try {
      setActionId(appointmentId);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/patient/appointments/${appointmentId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        const message = data.message || t("myAppointments.errors.cancelAppointment");
        notifyError("Cancel failed", message, { push: true });
        return;
      }

      notifySuccess("Appointment cancelled", "The appointment has been cancelled.", { push: true });
      await fetchAppointments();
    } catch (error) {
      console.error(error);
      notifyError("Cancel failed", t("myAppointments.errors.cancelAppointment"), { push: true });
    } finally {
      setActionId(null);
    }
  };

  const getStatusLabel = (status) => t(`appointmentStatus.${status}`);

  const paymentSummary = useMemo(() => {
    return appointments.reduce(
      (acc, appointment) => {
        const paymentStatus = getPaymentStatus(appointment);
        const amountInRupees = getAppointmentAmountInRupees(appointment);

        if (paymentStatus === "paid") {
          acc.paidCount += 1;
          acc.totalPaid += amountInRupees;
        } else if (paymentStatus === "pending") {
          acc.pendingCount += 1;
        } else if (paymentStatus === "not_required") {
          acc.noPaymentCount += 1;
        }

        return acc;
      },
      {
        paidCount: 0,
        pendingCount: 0,
        noPaymentCount: 0,
        totalPaid: 0,
      }
    );
  }, [appointments]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <PaymentDetailsModal
        open={Boolean(selectedPaymentAppointment)}
        appointment={selectedPaymentAppointment}
        onClose={() => setSelectedPaymentAppointment(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("myAppointments.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("myAppointments.subtitle")}
          </p>
        </div>
        <button
          onClick={() => navigate("/categories")}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
        >
          {t("myAppointments.bookNewAppointment")}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Paid Appointments</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{paymentSummary.paidCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pending Payments</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{paymentSummary.pendingCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">No Payment Needed</p>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">{paymentSummary.noPaymentCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{formatInr(paymentSummary.totalPaid)}</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center text-gray-500 dark:text-gray-400">
          {t("myAppointments.noAppointments")}
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const doctorName = `${appointment.doctor?.firstName || ""} ${appointment.doctor?.lastName || ""}`.trim();
            const paymentStatus = getPaymentStatus(appointment);
            const paymentAmountInRupees = getAppointmentAmountInRupees(appointment);
            return (
              <div
                key={appointment._id}
                className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${
                          STATUS_BADGE[appointment.status] || STATUS_BADGE.pending
                        }`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${
                          PAYMENT_BADGE[paymentStatus] || PAYMENT_BADGE.pending
                        }`}
                      >
                        Payment: {PAYMENT_LABEL[paymentStatus] || paymentStatus}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {t("myAppointments.doctorName", { name: doctorName || t("auth.doctor") })}
                    </p>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1.5">
                        <HiOutlineCalendar size={15} /> {appointment.appointmentDate}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HiOutlineClock size={15} /> {appointment.slotTime}
                      </span>
                    </div>

                    {appointment.reason && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("common.reason")}: {appointment.reason}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>Amount: {paymentAmountInRupees > 0 ? formatInr(paymentAmountInRupees) : "-"}</span>
                      {appointment.paymentId && <span>Payment ID: {appointment.paymentId}</span>}
                    </div>

                    {appointment.status === "pending" && (
                      <p className="text-xs text-amber-600 dark:text-amber-300">
                        {t("myAppointments.waitingForConfirmation")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedPaymentAppointment(appointment)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      View Payment
                    </button>

                    {appointment.status === "accepted" && appointment.telemedicineSession && (
                      <button
                        onClick={() => navigate(`/telemedicine?session=${appointment.telemedicineSession}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <HiOutlineVideoCamera size={14} /> {t("myAppointments.openTelemedicine")}
                      </button>
                    )}

                    {["pending", "accepted"].includes(appointment.status) && (
                      <button
                        onClick={() => cancelAppointment(appointment._id)}
                        disabled={actionId === appointment._id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                      >
                        <HiOutlineXCircle size={14} /> {t("myAppointments.cancel")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
