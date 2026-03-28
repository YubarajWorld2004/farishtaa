require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const errorController = require("./controllers/errorController");
const patientRouter = require("./routers/patientRouter");
const authRouter = require("./routers/authRouter");
const doctorRouter = require("./routers/doctorRouter");
const doctorDashboardRouter = require("./routers/doctorDashboardRouter");
const hospitalDashboardRouter = require("./routers/hospitalDashboardRouter");
const { UPLOADS_BASE_DIR } = require("./middleware/upload");
const { isLoggedIn, isPatient, isDoctor, isHospital } = require("./middleware/auth");

const app = express();

const PORT = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_DB_DATABASE;
const fallbackMongoUri = process.env.MONGO_DB_DATABASE_FALLBACK;
const isServerlessRuntime = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT
);

let mongoConnectionPromise = null;

/* -------------------- MIDDLEWARE -------------------- */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(UPLOADS_BASE_DIR));

app.use((req, res, next) => {
  console.log("Request Received:", req.method, req.url);
  next();
});

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
      await mongoose.connect(mongoUri);
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
        await mongoose.connect(fallbackMongoUri);
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
      app.listen(PORT, () => {
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
