const User = require('../model/User');
const Reviews = require('../model/Reviews');

// GET /api/doctor-dashboard/profile
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await User.findById(req.userId)
      .select('-password -chats')
      .populate({
        path: 'doctorReviews',
        select: 'rating review createdAt',
        populate: {
          path: 'patientId',
          select: 'firstName lastName',
        },
      });

    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    return res.status(200).json({ doctor });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

// PUT /api/doctor-dashboard/profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const {
      specialist, experience, degree, languages,
      about, address, photoUrl, location,
    } = req.body;

    const updateData = {};
    if (specialist) updateData.specialist = specialist;
    if (experience !== undefined) updateData.experience = experience;
    if (degree) updateData.degree = degree;
    if (languages) updateData.languages = languages;
    if (about) updateData.about = about;
    if (address) updateData.address = address;
    if (photoUrl) updateData.photoUrl = photoUrl;
    if (location) updateData.location = location;
    updateData.profileCompleted = true;

    const doctor = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password -chats');

    return res.status(200).json({ doctor, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

// GET /api/doctor-dashboard/stats
exports.getDoctorStats = async (req, res) => {
  try {
    const doctor = await User.findById(req.userId).select('doctorReviews');
    const reviewCount = doctor?.doctorReviews?.length || 0;

    let avgRating = 0;
    if (reviewCount > 0) {
      const reviews = await Reviews.find({ _id: { $in: doctor.doctorReviews } });
      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      avgRating = (total / reviews.length).toFixed(1);
    }

    return res.status(200).json({
      stats: {
        totalReviews: reviewCount,
        averageRating: parseFloat(avgRating),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
};

// GET /api/doctor-dashboard/reviews
exports.getDoctorReviews = async (req, res) => {
  try {
    const doctor = await User.findById(req.userId).select('doctorReviews');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const reviews = await Reviews.find({ _id: { $in: doctor.doctorReviews || [] } })
      .populate({ path: 'patientId', select: 'firstName lastName' })
      .sort({ createdAt: -1 });

    return res.status(200).json({ reviews });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
};
