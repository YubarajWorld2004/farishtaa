import toast from "react-hot-toast";

const TYPE_STYLES = {
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  error: {
    wrapper: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  info: {
    wrapper: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
    dot: "bg-blue-500",
  },
};

const canUseBrowserNotification =
  typeof window !== "undefined" && typeof Notification !== "undefined";

const triggerBrowserNotification = (title, message) => {
  if (!canUseBrowserNotification) return;

  const show = () => {
    try {
      new Notification(title || "Farishtaa", {
        body: message || "",
      });
    } catch (error) {
      console.error("Browser notification failed", error);
    }
  };

  if (Notification.permission === "granted") {
    show();
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission()
      .then((permission) => {
        if (permission === "granted") show();
      })
      .catch((error) => {
        console.error("Notification permission request failed", error);
      });
  }
};

export const showHotToast = ({ type = "info", title, message, duration = 4500, push = false } = {}) => {
  const style = TYPE_STYLES[type] || TYPE_STYLES.info;

  if (push) {
    triggerBrowserNotification(title, message);
  }

  return toast.custom(
    (toastItem) => (
      <div
        className={`pointer-events-auto w-[min(92vw,360px)] rounded-xl border px-3 py-2.5 shadow-lg backdrop-blur-sm transition-all duration-200 ${style.wrapper} ${
          toastItem.visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${style.dot}`} />
          <div className="min-w-0 flex-1">
            {title ? <p className="text-sm font-semibold leading-5">{title}</p> : null}
            {message ? <p className="text-sm leading-5">{message}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(toastItem.id)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
            aria-label="Dismiss toast"
          >
            X
          </button>
        </div>
      </div>
    ),
    {
      duration,
      position: "top-right",
    }
  );
};

export const notifySuccess = (title, message, options = {}) =>
  showHotToast({ type: "success", title, message, ...options });

export const notifyError = (title, message, options = {}) =>
  showHotToast({ type: "error", title, message, ...options });

export const notifyInfo = (title, message, options = {}) =>
  showHotToast({ type: "info", title, message, ...options });
