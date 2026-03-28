require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const errorController = require("./controllers/errorController");
const patientRouter = require("./routers/patientRouter");
const authRouter = require("./routers/authRouter");
const doctorRouter = require("./routers/doctorRouter");
const doctorDashboardRouter = require("./routers/doctorDashboardRouter");
const hospitalDashboardRouter = require("./routers/hospitalDashboardRouter");
const { isLoggedIn, isPatient, isDoctor, isHospital } = require("./middleware/auth");

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log("Request Received:", req.method, req.url);
  next();
});

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRouter);
app.use("/api/patient", isLoggedIn, isPatient, patientRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/doctor-dashboard", isLoggedIn, isDoctor, doctorDashboardRouter);
app.use("/api/hospital-dashboard", isLoggedIn, isHospital, hospitalDashboardRouter);

/* -------------------- ERROR HANDLER -------------------- */
app.use(errorController.getError);

/* -------------------- SERVER + DB -------------------- */
const PORT = process.env.PORT || 3001;

const mongoUri = process.env.MONGO_DB_DATABASE;
const fallbackMongoUri = process.env.MONGO_DB_DATABASE_FALLBACK;

async function connectMongo() {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected Successfully (SRV URI)");
  } catch (err) {
    const isSrvDnsError =
      err?.code === "ECONNREFUSED" ||
      err?.code === "ENOTFOUND" ||
      err?.message?.includes("querySrv") ||
      err?.message?.includes("ENOTFOUND");

    if (isSrvDnsError && fallbackMongoUri) {
      console.warn("⚠️ SRV DNS lookup failed. Retrying with fallback URI...");
      await mongoose.connect(fallbackMongoUri);
      console.log("✅ MongoDB Connected Successfully (fallback URI)");
      return;
    }

    throw err;
  }
}

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    if (err?.code) {
      console.error("Error Code:", err.code);
    }
  });
