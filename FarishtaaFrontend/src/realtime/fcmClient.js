import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const hasFirebaseWebConfig = () =>
  !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    vapidKey
  );

let messagingPromise = null;

const getMessagingInstance = async () => {
  if (typeof window === "undefined") return null;
  if (!hasFirebaseWebConfig()) return null;

  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isSupported();
      if (!supported) return null;

      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      return getMessaging(app);
    })();
  }

  return messagingPromise;
};

export const registerBrowserPushToken = async ({ apiBaseUrl, authToken, userId }) => {
  if (!apiBaseUrl || !authToken || !userId) return null;
  if (typeof window === "undefined" || !window.Notification || !navigator.serviceWorker) return null;

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const currentPermission = Notification.permission;
  let finalPermission = currentPermission;

  if (currentPermission === "default") {
    finalPermission = await Notification.requestPermission();
  }

  if (finalPermission !== "granted") {
    return null;
  }

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const fcmToken = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!fcmToken) return null;

  const tokenStorageKey = `fcm_registered_token_${userId}`;
  const alreadyRegistered = window.localStorage.getItem(tokenStorageKey);
  if (alreadyRegistered === fcmToken) {
    return fcmToken;
  }

  const response = await fetch(`${apiBaseUrl}/api/auth/push-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fcmToken }),
  });

  if (!response.ok) {
    return null;
  }

  window.localStorage.setItem(tokenStorageKey, fcmToken);
  return fcmToken;
};

export const subscribeForegroundFcmMessages = async (callback) => {
  if (typeof callback !== "function") return () => {};

  const messaging = await getMessagingInstance();
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, callback);
};
