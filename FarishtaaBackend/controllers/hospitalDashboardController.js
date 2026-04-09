const User = require('../model/User');
const Reviews = require('../model/Reviews');
const bcrypt = require('bcryptjs');

const parsePagination = (pageValue, limitValue, defaultLimit = 20, maxLimit = 100) => {
  const parsedPage = Number.parseInt(pageValue, 10);
  const parsedLimit = Number.parseInt(limitValue, 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, maxLimit)
    : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// GET /api/hospital-dashboard/profile
exports.getHospitalProfile = async (req, res) => {
  try {
    const hospital = await User.findById(req.userId)
      .select('-password -chats')
      .populate({
        path: 'doctors',
        select: 'firstName lastName specialist experience degree profileCompleted photoUrl',
      });

    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    return res.status(200).json({ hospital });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching hospital profile', error: err.message });
  }
};

// PUT /api/hospital-dashboard/profile
exports.updateHospitalProfile = async (req, res) => {
  try {
    const { hospitalName, hospitalAddress, hospitalPhone, hospitalAbout } = req.body;

    const updateData = {};
    if (hospitalName) updateData.hospitalName = hospitalName;
    if (hospitalAddress) updateData.hospitalAddress = hospitalAddress;
    if (hospitalPhone) updateData.hospitalPhone = hospitalPhone;
    if (hospitalAbout) updateData.hospitalAbout = hospitalAbout;
    updateData.profileCompleted = true;

    const hospital = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password -chats');

    return res.status(200).json({ hospital, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

// GET /api/hospital-dashboard/stats
exports.getHospitalStats = async (req, res) => {
  try {
    const hospital = await User.findById(req.userId)
      .select('doctors')
      .populate({
        path: 'doctors',
        select: 'doctorReviews profileCompleted',
      });

    const totalDoctors = hospital?.doctors?.length || 0;
    const completedProfiles = hospital?.doctors?.filter(d => d.profileCompleted).length || 0;

    // Calculate total reviews across all doctors
    let totalReviews = 0;
    let totalRatingSum = 0;
    for (const doc of (hospital?.doctors || [])) {
      totalReviews += doc.doctorReviews?.length || 0;
    }

    // Get actual ratings
    if (totalReviews > 0) {
      const doctorIds = hospital.doctors.map(d => d._id);
      const reviews = await Reviews.find({ targetId: { $in: doctorIds }, targetModel: 'Doctor' });
      totalRatingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    }

    return res.status(200).json({
      stats: {
        totalDoctors,
        completedProfiles,
        totalReviews,
        averageRating: totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
};

// GET /api/hospital-dashboard/doctors
exports.getDoctors = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20, 100);
    const hospital = await User.findById(req.userId)
      .select('doctors');

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const doctorIds = Array.isArray(hospital.doctors) ? hospital.doctors : [];
    const total = doctorIds.length;
    const pagedDoctorIds = doctorIds.slice(skip, skip + limit);

    const doctors = await User.find({ _id: { $in: pagedDoctorIds } })
      .select('-password -chats')
      .populate({
        path: 'doctorReviews',
        select: 'rating review createdAt',
        populate: { path: 'patientId', select: 'firstName lastName' },
      });

    const doctorById = new Map(doctors.map((doctor) => [String(doctor._id), doctor]));
    const orderedDoctors = pagedDoctorIds
      .map((doctorId) => doctorById.get(String(doctorId)))
      .filter(Boolean);

    return res.status(200).json({
      doctors: orderedDoctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching doctors', error: err.message });
  }
};

// POST /api/hospital-dashboard/doctors — Add a new doctor under this hospital
exports.addDoctor = async (req, res) => {
  try {
    const {
      firstName, lastName, email, password,
      specialist, experience, degree, languages,
      about, address, photoUrl, availability, mapLink, fee, location,
    } = req.body;

    // Validate required fields
    if (!firstName || !email || !password) {
      return res.status(422).json({ message: 'First name, email, and password are required' });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(422).json({ message: 'A user with this email already exists' });
    }

    // Fetch hospital name to auto-set clinicName
    const hospital = await User.findById(req.userId).select('hospitalName firstName');
    const hospitalClinicName = hospital?.hospitalName || hospital?.firstName || '';

    const hashedPassword = await bcrypt.hash(password, 12);

    const doctor = new User({
      firstName,
      lastName: lastName || '',
      email,
      password: hashedPassword,
      userType: 'Doctor',
      specialist: specialist || '',
      experience: experience || 0,
      degree: degree || '',
      languages: languages || [],
      about: about || '',
      address: address || '',
      photoUrl: photoUrl || '',
      mapLink: mapLink || '',
      fee: fee || undefined,
      clinicName: hospitalClinicName,
      addedByHospital: req.userId,
      availability: availability || [],
      location: location && location.coordinates ? location : undefined,
      profileCompleted: !!(specialist && experience && degree),
    });

    await doctor.save();

    // Add doctor to hospital's doctors array
    await User.findByIdAndUpdate(req.userId, {
      $push: { doctors: doctor._id },
    });

    // Return doctor without password
    const doctorObj = doctor.toObject();
    delete doctorObj.password;

    return res.status(201).json({ doctor: doctorObj, message: 'Doctor added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding doctor', error: err.message });
  }
};

// DELETE /api/hospital-dashboard/doctors/:doctorId
exports.removeDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Remove doctor from hospital's array
    await User.findByIdAndUpdate(req.userId, {
      $pull: { doctors: doctorId },
    });

    return res.status(200).json({ message: 'Doctor removed from hospital' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing doctor', error: err.message });
  }
};

// GET /api/hospital-dashboard/doctors/:doctorId
exports.getDoctorDetail = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findById(doctorId)
      .select('-password -chats')
      .populate({
        path: 'doctorReviews',
        select: 'rating review createdAt',
        populate: { path: 'patientId', select: 'firstName lastName' },
      });

    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    return res.status(200).json({ doctor });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching doctor details', error: err.message });
  }
};

// GET /api/hospital-dashboard/doctors/:doctorId/reviews
exports.getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20, 100);

    const filter = { targetId: doctorId, targetModel: 'Doctor' };

    const [reviews, total] = await Promise.all([
      Reviews.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('patientId', 'firstName lastName'),
      Reviews.countDocuments(filter),
    ]);

    return res.status(200).json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
};
