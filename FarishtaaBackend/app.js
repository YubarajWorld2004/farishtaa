require('dotenv').config();

const express = require("express");
const http = require('http');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorController = require("./controllers/errorController");
const patientRouter = require("./routers/patientRouter");
const authRouter = require("./routers/authRouter");
const doctorRouter = require("./routers/doctorRouter");
const doctorDashboardRouter = require("./routers/doctorDashboardRouter");
const hospitalDashboardRouter = require("./routers/hospitalDashboardRouter");
const { UPLOADS_BASE_DIR } = require("./middleware/upload");
const { isLoggedIn, isPatient, isDoctor, isHospital } = require("./middleware/auth");
const { initSocketServer, getSocketRedisStatus } = require('./service/socketService');

const app = express();

const PORT = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_DB_DATABASE;
const fallbackMongoUri = process.env.MONGO_DB_DATABASE_FALLBACK;
const isServerlessRuntime = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT
);

let mongoConnectionPromise = null;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const mongoConnectOptions = {
  maxPoolSize: parsePositiveInt(process.env.MONGO_MAX_POOL_SIZE, 40),
  minPoolSize: parsePositiveInt(process.env.MONGO_MIN_POOL_SIZE, 5),
  serverSelectionTimeoutMS: parsePositiveInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10000),
};

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    skip: (req) => req.method === 'OPTIONS',
  });

const generalLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: parsePositiveInt(process.env.RATE_LIMIT_API_MAX, 1200),
  message: 'Too many requests. Please slow down and try again shortly.',
});

const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: parsePositiveInt(process.env.RATE_LIMIT_AUTH_MAX, 60),
  message: 'Too many auth attempts. Please try again after a short break.',
});

const symptomLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: parsePositiveInt(process.env.RATE_LIMIT_SYMPTOM_MAX, 80),
  message: 'Too many symptom-check requests. Please try again in a few minutes.',
});

const nearbySearchLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: parsePositiveInt(process.env.RATE_LIMIT_NEARBY_SEARCH_MAX, 120),
  message: 'Too many nearby search requests. Please try again shortly.',
});

/* -------------------- MIDDLEWARE -------------------- */
app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(cors());
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());

if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_HTTP_LOGS === 'true') {
  app.use(morgan('dev'));
}

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/patient/symptoms', symptomLimiter);
app.use('/api/doctor/nearby-search', nearbySearchLimiter);
app.use('/uploads', express.static(UPLOADS_BASE_DIR));

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoConnectionPromise) {
    return mongoConnectionPromise;
  }

  mongoConnectionPromise = (async () => {
    if (!mongoUri && !fallbackMongoUri) {
      throw new Error("Missing MONGO_DB_DATABASE and MONGO_DB_DATABASE_FALLBACK environment variables");
    }

    try {
      if (!mongoUri) {
        throw new Error("Primary MongoDB URI is missing");
      }
      await mongoose.connect(mongoUri, mongoConnectOptions);
      console.log("MongoDB Connected Successfully (primary URI)");
    } catch (err) {
      const isFallbackEligible =
        !!fallbackMongoUri &&
        (!mongoUri ||
          err?.code === "ECONNREFUSED" ||
          err?.code === "ENOTFOUND" ||
          err?.message?.includes("querySrv") ||
          err?.message?.includes("ENOTFOUND") ||
          err?.message?.includes("URI") ||
          err?.message?.includes("invalid"));

      if (isFallbackEligible) {
        console.warn("Primary MongoDB connection failed. Retrying with fallback URI...");
        await mongoose.connect(fallbackMongoUri, mongoConnectOptions);
        console.log("MongoDB Connected Successfully (fallback URI)");
      } else {
        throw err;
      }
    }

    return mongoose.connection;
  })().catch((err) => {
    mongoConnectionPromise = null;
    throw err;
  });

  return mongoConnectionPromise;
}

app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    return res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

const mongoStateLabels = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

app.get('/health', (_req, res) => {
  const mongoState = mongoose.connection.readyState;
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    mongo: mongoStateLabels[mongoState] || 'unknown',
    socketRedis: getSocketRedisStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  if (!mongoReady) {
    return res.status(503).json({
      status: 'not_ready',
      mongo: mongoStateLabels[mongoose.connection.readyState] || 'unknown',
    });
  }

  return res.status(200).json({ status: 'ready' });
});

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRouter);
app.use("/api/patient", isLoggedIn, isPatient, patientRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/doctor-dashboard", isLoggedIn, isDoctor, doctorDashboardRouter);
app.use("/api/hospital-dashboard", isLoggedIn, isHospital, hospitalDashboardRouter);

/* -------------------- ERROR HANDLER -------------------- */
app.use(errorController.getError);

if (require.main === module && !isServerlessRuntime) {
  connectMongo()
    .then(() => {
      const server = http.createServer(app);
      initSocketServer(server);

      server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("MongoDB Connection Error:", err.message);
      if (err?.code) {
        console.error("Error Code:", err.code);
      }
      process.exit(1);
    });
}

module.exports = app;
module.exports.connectMongo = connectMongo;
