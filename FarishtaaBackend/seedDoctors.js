require("dotenv").config();
const mongoose = require("mongoose");
const Doctor = require("./model/Doctor");

const doctors = [
  {
    name: "Dr. Rajesh Patel",
    photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    specialist: "General Physician",
    experience: 12,
    degree: "MBBS, MD (General Medicine)",
    languages: ["English", "Hindi", "Odia"],
    address: "Near District Hospital, Main Road, Bhawanipatna, Kalahandi, Odisha - 766001",
    about: "Experienced general physician with 12 years of practice in Kalahandi district. Specializes in managing chronic diseases, fever, infections and preventive healthcare.",
    location: {
      type: "Point",
      coordinates: [83.1671, 19.9072], // Bhawanipatna, Kalahandi
    },
  },
  {
    name: "Dr. Suman Mishra",
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    specialist: "Cardiologist",
    experience: 15,
    degree: "MBBS, MD, DM (Cardiology)",
    languages: ["English", "Hindi", "Odia"],
    address: "Capital Hospital Road, Unit-6, Bhubaneswar, Khordha, Odisha - 751001",
    about: "Senior cardiologist at Capital Hospital Bhubaneswar with expertise in interventional cardiology, echocardiography and heart failure management.",
    location: {
      type: "Point",
      coordinates: [85.8245, 20.2961], // Bhubaneswar, Khordha
    },
  },
  {
    name: "Dr. Priya Mohanty",
    photoUrl: "https://randomuser.me/api/portraits/women/65.jpg",
    specialist: "Dermatologist",
    experience: 8,
    degree: "MBBS, MD (Dermatology)",
    languages: ["English", "Odia"],
    address: "Station Square, Cuttack, Odisha - 753003",
    about: "Dermatologist specializing in skin allergies, acne treatment, and cosmetic dermatology. 8 years of clinical experience in Cuttack.",
    location: {
      type: "Point",
      coordinates: [85.8830, 20.4625], // Cuttack
    },
  },
  {
    name: "Dr. Amit Das",
    photoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    specialist: "Orthopedic",
    experience: 18,
    degree: "MBBS, MS (Orthopaedics)",
    languages: ["English", "Hindi", "Odia"],
    address: "Medical College Road, Berhampur, Ganjam, Odisha - 760004",
    about: "Senior orthopaedic surgeon with 18 years' experience. Expert in joint replacements, fracture management and sports medicine at MKCG Medical College.",
    location: {
      type: "Point",
      coordinates: [84.7941, 19.3150], // Berhampur, Ganjam
    },
  },
  {
    name: "Dr. Sunita Rath",
    photoUrl: "https://randomuser.me/api/portraits/women/52.jpg",
    specialist: "Pediatrician",
    experience: 10,
    degree: "MBBS, MD (Pediatrics)",
    languages: ["English", "Hindi", "Odia"],
    address: "DHH Road, Dharmagarh, Kalahandi, Odisha - 766015",
    about: "Caring pediatrician dedicated to child health in rural Kalahandi. Specializes in neonatal care, childhood vaccinations and nutrition counseling.",
    location: {
      type: "Point",
      coordinates: [83.3869, 19.8506], // Dharmagarh, Kalahandi
    },
  },
  {
    name: "Dr. Bikash Nayak",
    photoUrl: "https://randomuser.me/api/portraits/men/58.jpg",
    specialist: "Neurologist",
    experience: 14,
    degree: "MBBS, MD, DM (Neurology)",
    languages: ["English", "Odia"],
    address: "SCB Medical College Campus, Mangalabag, Cuttack, Odisha - 753007",
    about: "Consultant neurologist at SCB Medical College. Expert in stroke management, epilepsy, headache disorders and neurodegenerative diseases.",
    location: {
      type: "Point",
      coordinates: [85.8696, 20.4686], // Cuttack
    },
  },
  {
    name: "Dr. Laxmi Pradhan",
    photoUrl: "https://randomuser.me/api/portraits/women/35.jpg",
    specialist: "Gynecologist",
    experience: 11,
    degree: "MBBS, MS (Obstetrics & Gynaecology)",
    languages: ["English", "Hindi", "Odia"],
    address: "Jail Road, Sambalpur, Odisha - 768001",
    about: "Experienced gynecologist providing comprehensive women's healthcare. Specializes in high-risk pregnancies, laparoscopic surgery and infertility treatment.",
    location: {
      type: "Point",
      coordinates: [83.9812, 21.4669], // Sambalpur
    },
  },
  {
    name: "Dr. Mahesh Sahu",
    photoUrl: "https://randomuser.me/api/portraits/men/72.jpg",
    specialist: "Dentist",
    experience: 6,
    degree: "BDS, MDS (Orthodontics)",
    languages: ["English", "Hindi", "Odia"],
    address: "College Road, Junagarh, Kalahandi, Odisha - 766014",
    about: "Skilled dentist in Kalahandi offering orthodontics, root canal treatment, dental implants and cosmetic dentistry services.",
    location: {
      type: "Point",
      coordinates: [83.0640, 19.8635], // Junagarh, Kalahandi
    },
  },
  {
    name: "Dr. Ranjita Behera",
    photoUrl: "https://randomuser.me/api/portraits/women/28.jpg",
    specialist: "Ophthalmologist",
    experience: 9,
    degree: "MBBS, MS (Ophthalmology)",
    languages: ["English", "Odia"],
    address: "VSS Medical College Road, Burla, Sambalpur, Odisha - 768017",
    about: "Eye specialist with expertise in cataract surgery, glaucoma management and retinal diseases. Serves western Odisha from VSS Medical College.",
    location: {
      type: "Point",
      coordinates: [83.8677, 21.5101], // Burla, Sambalpur
    },
  },
  {
    name: "Dr. Deepak Meher",
    photoUrl: "https://randomuser.me/api/portraits/men/15.jpg",
    specialist: "Diabetologist",
    experience: 7,
    degree: "MBBS, MD (Endocrinology)",
    languages: ["English", "Hindi", "Odia"],
    address: "Near Bus Stand, Kesinga, Kalahandi, Odisha - 766012",
    about: "Diabetes and endocrine specialist serving Kalahandi region. Expert in Type 1 & 2 diabetes management, thyroid disorders and hormonal imbalances.",
    location: {
      type: "Point",
      coordinates: [83.2181, 20.1862], // Kesinga, Kalahandi
    },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_DB_DATABASE);
    console.log("Connected to MongoDB");

    const count = await Doctor.countDocuments();
    console.log(`Existing doctors in DB: ${count}`);

    for (const doc of doctors) {
      const exists = await Doctor.findOne({
        name: doc.name,
        "location.coordinates": doc.location.coordinates,
      });
      if (exists) {
        console.log(`  ⏭  Already exists: ${doc.name}`);
        continue;
      }

      const saved = await new Doctor(doc).save();
      console.log(`  ✅ Added: ${saved.name} (${saved.specialist}) — ${saved.address.split(",").slice(-3).join(",").trim()}`);
    }

    const newCount = await Doctor.countDocuments();
    console.log(`\nTotal doctors now: ${newCount}`);
    console.log("Seeding complete!");

    await mongoose.disconnect();
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
