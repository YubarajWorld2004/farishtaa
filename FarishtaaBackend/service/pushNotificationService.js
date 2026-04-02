const admin = require('firebase-admin');
const User = require('../model/User');

const INVALID_TOKEN_ERRORS = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

let messagingClient = null;

const parseServiceAccountFromEnv = () => {
  const rawJson = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (rawJson) {
    try {
      return JSON.parse(rawJson);
    } catch (error) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n')
    : null;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
};

const getMessagingClient = () => {
  if (messagingClient) {
    return messagingClient;
  }

  const serviceAccount = parseServiceAccountFromEnv();
  if (!serviceAccount) {
    return null;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  messagingClient = admin.messaging();
  return messagingClient;
};

const toStringData = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

exports.sendFcmPushToUser = async ({ userId, title, body, data = {} }) => {
  const messaging = getMessagingClient();
  if (!messaging || !userId || !title || !body) {
    return { sent: false, reason: 'not_configured_or_missing_payload' };
  }

  const user = await User.findById(userId).select('fcmTokens');
  if (!user || !Array.isArray(user.fcmTokens) || user.fcmTokens.length === 0) {
    return { sent: false, reason: 'no_tokens' };
  }

  const payloadData = Object.entries(data || {}).reduce((acc, [key, value]) => {
    if (!key) return acc;
    acc[key] = toStringData(value);
    return acc;
  }, {});

  const response = await messaging.sendEachForMulticast({
    tokens: user.fcmTokens,
    notification: {
      title,
      body,
    },
    data: payloadData,
    webpush: {
      notification: {
        title,
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      },
    },
  });

  const staleTokens = [];
  response.responses.forEach((result, index) => {
    if (result.success || !result.error?.code) return;
    if (INVALID_TOKEN_ERRORS.has(result.error.code)) {
      const token = user.fcmTokens[index];
      if (token) staleTokens.push(token);
    }
  });

  if (staleTokens.length > 0) {
    await User.findByIdAndUpdate(userId, {
      $pull: {
        fcmTokens: { $in: staleTokens },
      },
    });
  }

  return {
    sent: response.successCount > 0,
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
};
