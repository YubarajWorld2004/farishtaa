import React from "react";

const STATUS_LABELS = {
  not_required: "No Payment Required",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const normalizePaymentStatus = (appointment) => {
  if (appointment?.paymentStatus) return appointment.paymentStatus;
  if (appointment?.paymentRequired) return "pending";
  return "not_required";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const formatInr = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const PaymentDetailsModal = ({ open, appointment, onClose }) => {
  if (!open || !appointment) return null;

  const paymentStatus = normalizePaymentStatus(appointment);
  const amountRupees =
    Number.isFinite(Number(appointment.paymentAmount)) && Number(appointment.paymentAmount) > 0
      ? Number(appointment.paymentAmount) / 100
      : Number(appointment.doctor?.fee || 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Details</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Appointment {appointment.appointmentDate || "-"} at {appointment.slotTime || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300"
            aria-label="Close payment details"
          >
            X
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Payment Status</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{STATUS_LABELS[paymentStatus] || paymentStatus}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{formatInr(amountRupees)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Currency</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{appointment.paymentCurrency || "INR"}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Paid At</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{formatDateTime(appointment.paidAt)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 sm:col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Payment ID</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1 break-all">{appointment.paymentId || "-"}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 sm:col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Order ID</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1 break-all">{appointment.paymentOrderId || "-"}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
