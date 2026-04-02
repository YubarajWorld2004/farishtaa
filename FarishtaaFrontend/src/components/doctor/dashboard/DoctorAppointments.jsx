import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClipboardCheck,
  HiOutlineVideoCamera,
} from "react-icons/hi";
import PaymentDetailsModal from "../../common/PaymentDetailsModal.jsx";
import { notifyError, notifySuccess } from "../../../utils/hotToast.jsx";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
  completed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  closed: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
};

const PAYMENT_STYLES = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  not_required:
    "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  failed: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
  refunded: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
};

const SUMMARY_STATUSES = ["pending", "accepted", "completed", "closed", "rejected", "cancelled"];
const FILTER_STATUSES = ["all", "pending", "accepted", "completed", "closed", "rejected", "cancelled"];
const PAYMENT_FILTERS = ["all", "paid", "pending", "not_required", "failed", "refunded"];

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

const getAmountInRupees = (appointment) => {
  const amountInPaise = Number(appointment?.paymentAmount);
  if (Number.isFinite(amountInPaise) && amountInPaise > 0) {
    return amountInPaise / 100;
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

const LOAD_ERROR_MESSAGE = "Failed to load appointments";
const UPDATE_ERROR_MESSAGE = "Failed to update appointment status";

const DoctorAppointments = () => {
  const { token } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fetchError, setFetchError] = useState("");
  const [selectedPaymentAppointment, setSelectedPaymentAppointment] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setFetchError("");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/doctor-dashboard/appointments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const message = data.message || LOAD_ERROR_MESSAGE;
        setFetchError(message);
        notifyError("Load failed", message);
        return;
      }
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Failed to fetch appointments", error);
      setFetchError(LOAD_ERROR_MESSAGE);
      notifyError("Load failed", LOAD_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchAppointments();
  }, [token]);

  const updateStatus = async (appointmentId, status) => {
    try {
      setUpdatingId(appointmentId);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/doctor-dashboard/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        notifyError("Update failed", errData.message || UPDATE_ERROR_MESSAGE, { push: true });
        return;
      }

      notifySuccess("Status updated", `Appointment marked as ${status}.`, { push: true });
      await fetchAppointments();
    } catch (error) {
      console.error(UPDATE_ERROR_MESSAGE, error);
      notifyError("Update failed", UPDATE_ERROR_MESSAGE, { push: true });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status) => t(`appointmentStatus.${status}`);

  const summary = useMemo(() => {
    return appointments.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { pending: 0, accepted: 0, rejected: 0, cancelled: 0, completed: 0, closed: 0 }
    );
  }, [appointments]);

  const paymentSummary = useMemo(() => {
    return appointments.reduce(
      (acc, item) => {
        const paymentStatus = getPaymentStatus(item);
        const amountInRupees = getAmountInRupees(item);

        if (paymentStatus === "paid") {
          acc.paidCount += 1;
          acc.totalCollected += amountInRupees;
        } else if (paymentStatus === "pending") {
          acc.pendingCount += 1;
        } else if (paymentStatus === "not_required") {
          acc.noPaymentCount += 1;
        } else if (paymentStatus === "refunded") {
          acc.refundedCount += 1;
        }

        return acc;
      },
      {
        paidCount: 0,
        pendingCount: 0,
        noPaymentCount: 0,
        refundedCount: 0,
        totalCollected: 0,
      }
    );
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const paymentStatus = getPaymentStatus(appointment);
      const matchStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchPayment = paymentFilter === "all" || paymentStatus === paymentFilter;
      return matchStatus && matchPayment;
    });
  }, [appointments, statusFilter, paymentFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PaymentDetailsModal
        open={Boolean(selectedPaymentAppointment)}
        appointment={selectedPaymentAppointment}
        onClose={() => setSelectedPaymentAppointment(null)}
      />

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("doctorAppointments.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("doctorAppointments.subtitle")}
        </p>
      </div>

      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{fetchError}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {SUMMARY_STATUSES.map((key) => (
          <div
            key={key}
            className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">{getStatusLabel(key)}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary[key]}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Revenue Collected</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{formatInr(paymentSummary.totalCollected)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{paymentSummary.paidCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{paymentSummary.pendingCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">No Payment</p>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">{paymentSummary.noPaymentCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Refunded</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{paymentSummary.refundedCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_STATUSES.map((value) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              statusFilter === value
                ? "bg-red-600 text-white border-red-600"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
            }`}
          >
            {value === "all" ? t("common.all") : getStatusLabel(value)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PAYMENT_FILTERS.map((value) => (
          <button
            key={value}
            onClick={() => setPaymentFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              paymentFilter === value
                ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
            }`}
          >
            {value === "all" ? "All Payments" : PAYMENT_LABEL[value] || value}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center text-gray-500 dark:text-gray-400">
          No appointments for this status/payment combination.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => {
            const patientName = `${appointment.patient?.firstName || ""} ${appointment.patient?.lastName || ""}`.trim();
            const paymentStatus = getPaymentStatus(appointment);
            const paymentAmount = getAmountInRupees(appointment);

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
                          STATUS_STYLES[appointment.status] || STATUS_STYLES.pending
                        }`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${
                          PAYMENT_STYLES[paymentStatus] || PAYMENT_STYLES.pending
                        }`}
                      >
                        Payment: {PAYMENT_LABEL[paymentStatus] || paymentStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1.5">
                        <HiOutlineUser size={15} />
                        {patientName || t("auth.patient")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HiOutlineCalendar size={15} />
                        {appointment.appointmentDate}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HiOutlineClock size={15} />
                        {appointment.slotTime}
                      </span>
                    </div>

                    {appointment.reason && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("common.reason")}: {appointment.reason}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>Amount: {paymentAmount > 0 ? formatInr(paymentAmount) : "-"}</span>
                      {appointment.paymentId && <span>Payment ID: {appointment.paymentId}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedPaymentAppointment(appointment)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      View Payment
                    </button>

                    {appointment.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(appointment._id, "accepted")}
                          disabled={updatingId === appointment._id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <HiOutlineCheckCircle size={14} /> {t("doctorAppointments.accept")}
                        </button>
                        <button
                          onClick={() => updateStatus(appointment._id, "rejected")}
                          disabled={updatingId === appointment._id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          <HiOutlineXCircle size={14} /> {t("doctorAppointments.reject")}
                        </button>
                      </>
                    )}

                    {appointment.status === "accepted" && (
                      <>
                        <button
                          onClick={() => updateStatus(appointment._id, "completed")}
                          disabled={updatingId === appointment._id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <HiOutlineClipboardCheck size={14} /> {t("doctorAppointments.markCompleted")}
                        </button>
                        {appointment.telemedicineSession && (
                          <button
                            onClick={() => navigate(`/telemedicine?session=${appointment.telemedicineSession}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                          >
                            <HiOutlineVideoCamera size={14} /> {t("doctorAppointments.openTelemedicine")}
                          </button>
                        )}
                      </>
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

export default DoctorAppointments;
