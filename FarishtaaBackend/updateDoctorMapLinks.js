require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/User");

// Google Maps links for each doctor near Bhawanipatna, Kalahandi, Odisha
const updates = [
  { email: "aarav.sharma@farishtaa.com",    mapLink: "https://maps.app.goo.gl/zFsXFAc21bE3nyhP8" },
  { email: "priya.mohanty@farishtaa.com",   mapLink: "https://maps.app.goo.gl/xmqC5hce3GWPhMmi9" },
  { email: "rahul.panda@farishtaa.com",     mapLink: "https://maps.app.goo.gl/SMb65LmkkwRQAuM37" },
  { email: "sneha.das@farishtaa.com",       mapLink: "https://maps.app.goo.gl/Cq2wb8gGrwxRzLBq8" },
  { email: "vikram.rath@farishtaa.com",     mapLink: "https://maps.app.goo.gl/HbhnBsRpemryZKmi6" },
  { email: "ananya.behera@farishtaa.com",   mapLink: "https://maps.app.goo.gl/bBFhhJctsJyY2ZrQ9" },
  { email: "suresh.nayak@farishtaa.com",    mapLink: "https://maps.app.goo.gl/RLAGqEXqopRPDGAK8" },
  { email: "meera.pradhan@farishtaa.com",   mapLink: "https://maps.app.goo.gl/dwADMN8fs9JnJBz48" },
  { email: "deepak.mishra@farishtaa.com",   mapLink: "https://maps.app.goo.gl/FNY9iZi8m8R2g4c18" },
  { email: "sonia.patnaik@farishtaa.com",   mapLink: "https://maps.app.goo.gl/LKCXmRBhfdxrHASZ9" },
  { email: "rajesh.sahoo@farishtaa.com",    mapLink: "https://maps.app.goo.gl/tWyn7QFFara3cSuMA" },
  { email: "kavita.tripathy@farishtaa.com", mapLink: "https://maps.app.goo.gl/oX4aU21xcu9NPog76" },
];

async function updateMapLinks() {
  try {
    await mongoose.connect(process.env.MONGO_DB_DATABASE);
    console.log("Connected to MongoDB");

    let updated = 0;
    for (const doc of updates) {
      const result = await User.findOneAndUpdate(
        { email: doc.email, userType: "Doctor" },
        { $set: { mapLink: doc.mapLink } },
        { new: true }
      );

      if (result) {
        console.log(`  ✅ Dr. ${result.firstName} ${result.lastName} → ${doc.mapLink}`);
        updated++;
      } else {
        console.log(`  ⚠️  Not found: ${doc.email}`);
      }
    }

    console.log(`\nDone! Updated ${updated} doctors with map links.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Update failed:", err);
    process.exit(1);
  }
}

updateMapLinks();
