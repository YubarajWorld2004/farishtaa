const Doctor=require('../model/Doctor');
const Hospital = require('../model/Hospital');
const Reviews = require('../model/Reviews');
const User = require('../model/User');
const specialistsName=require('../utils/specialistsName');

const OSM_SYNC_TTL_MS = 10 * 60 * 1000;
const SEARCH_RESULT_LIMIT = 80;
const OSM_SYNC_CACHE = new Map();

const toFiniteNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildOsmCacheKey = (lat, lng, radius) =>
  `${lat.toFixed(3)}:${lng.toFixed(3)}:${Math.round(radius / 500)}`;

const parseNearbySearchInput = ({ lat, lng, radius }) => {
  const parsedLat = toFiniteNumber(lat);
  const parsedLng = toFiniteNumber(lng);
  const parsedRadius = toFiniteNumber(radius ?? 15000);

  if (parsedLat === null || parsedLng === null || parsedRadius === null) {
    return null;
  }

  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    return null;
  }

  return {
    lat: parsedLat,
    lng: parsedLng,
    radius: Math.max(1000, Math.min(parsedRadius, 30000)),
  };
};

const normalizeSpecialistTerm = (value) =>
  String(value || '').trim().replace(/\s+/g, ' ');

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createSpecialistRegex = (value) => {
  const normalized = normalizeSpecialistTerm(value);
  if (!normalized) {
    return null;
  }

  const escaped = escapeRegex(normalized).replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${escaped}\\b`, 'i');
};

exports.postAddDoctor=async (req,res,next)=>{
const {name ,photoUrl,specialist,experience,degree,languages,address,about,location }=req.body;
const doctor=new Doctor({
   name ,photoUrl,specialist,experience,degree,languages,address,about,location 
});
await doctor.save();
res.status(201).json({message : "Doctor Created", doctor : doctor});
}


exports.getCategories=async (req,res,next)=>{
try{
    
    const doctorcategories=await Doctor.distinct("specialist");
    const hospitalcategories=await Hospital.distinct('specialists');
    const userDoctorCategories=await User.distinct("specialist", { userType: "Doctor", profileCompleted: true, specialist: { $ne: null } });
    const categories=[...new Set([...doctorcategories,...hospitalcategories,...userDoctorCategories])];
    return res.status(200).json({categories});
}
catch(error){
    res.status(404).json({message : error});
}
}

exports.searchNearbyBySpecialist=async (req,res,next)=>{
 try{ 
 const {category}=req.params;
 if(!category || typeof(category)!== "string")
    return res.status(400).json({message : "Type Error : not string"})
 const nearbyInput = parseNearbySearchInput(req.body || {});
 if(!nearbyInput)
  return res.status(400).json({message : "Invalid lat/lng/radius"})

 const { lat, lng, radius } = nearbyInput;
const specialistRegex=createSpecialistRegex(category);
if(!specialistRegex)
  return res.status(400).json({message : "Type Error : invalid specialist"})

const [doctorsNearby, hospitalsNearby, userDoctorsNearby] = await Promise.all([
  findDoctorsNearby(lat,lng,specialistRegex,radius),
  findHospitalsNearby(lat,lng,specialistRegex,radius),
  findUserDoctorsNearby(lat,lng,specialistRegex,radius),
]);
const storedResults=[...doctorsNearby,...hospitalsNearby,...userDoctorsNearby];
 res.status(200).json({data : storedResults});

loadFromOsm(lat,lng,radius).catch((error) => {
  console.error('OSM sync failed:', error.message);
});
 }catch(error){
    console.error('Nearby specialist search failed:', error.message);
    return res.status(500).json({ message: 'Failed to search nearby specialists' });
 }
}

const findDoctorsNearby=async (lat,lng,specialistRegex,radius)=>{
return Doctor.find({
specialist : {
  $regex : specialistRegex,
},
location : {
    $near : {
        $geometry :{
            type : "Point",
            coordinates : [lng,lat]
        },
         $maxDistance : radius,
    },
}
})
  .limit(SEARCH_RESULT_LIMIT);
}

const findUserDoctorsNearby=async (lat,lng,specialistRegex,radius)=>{
  const users = await User.find({
    userType: "Doctor",
    profileCompleted: true,
    specialist: { $regex: specialistRegex },
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    },
  }, 'firstName lastName specialist experience degree languages address about photoUrl location mapLink fee clinicName doctorReviews availability')
    .limit(SEARCH_RESULT_LIMIT);
  // Map to match Doctor model shape so frontend works seamlessly
  return users.map(u => ({
    _id: u._id,
    name: `${u.firstName} ${u.lastName}`,
    specialist: u.specialist,
    experience: u.experience,
    degree: u.degree,
    languages: u.languages,
    address: u.address,
    about: u.about,
    photoUrl: u.photoUrl,
    location: u.location,
    mapLink: u.mapLink,
    fee: u.fee,
    clinicName: u.clinicName,
    reviews: u.doctorReviews,
    availability: u.availability,
    _isUserDoctor: true,
    canBookAppointment: true,
  }));
}
const loadFromOsm = async (lat, lng, radius) => {
  const cacheKey = buildOsmCacheKey(lat, lng, radius);
  const now = Date.now();
  const lastSyncedAt = OSM_SYNC_CACHE.get(cacheKey);
  if (lastSyncedAt && now - lastSyncedAt < OSM_SYNC_TTL_MS) {
    return;
  }

  OSM_SYNC_CACHE.set(cacheKey, now);

  try {
    const fetchedHospitals = await fetchDatafromOSM(lat, lng, radius);
    if (!Array.isArray(fetchedHospitals) || fetchedHospitals.length === 0) {
      return;
    }

    const operations = [];

    for (const place of fetchedHospitals) {
      if (!place?.tags?.name) continue;
      const placeLat = toFiniteNumber(place.lat);
      const placeLon = toFiniteNumber(place.lon);
      if (placeLat === null || placeLon === null) continue;

      let specialists = [];
      const detectedSpecialists = specialistsName.detectSpecialistsFromName(place.tags.name);
      specialists = [...new Set([...detectedSpecialists])];

      operations.push({
        updateOne: {
          filter: {
            name: place.tags.name || 'Unknown',
            'location.coordinates': [placeLon, placeLat],
          },
          update: {
            $set: {
              name: place.tags.name || 'Unknown',
              type: place.tags.amenity || place.tags.healthcare || 'doctor',
              address: {
                street: place.tags?.['addr:full'] || '',
                district: place.tags?.['addr:district'] || '',
                state: place.tags?.['addr:state'] || '',
                postcode: place.tags?.['addr:postcode'] || '',
              },
              location: {
                type: 'Point',
                coordinates: [placeLon, placeLat],
              },
              specialists,
            },
          },
          upsert: true,
        },
      });
    }

    if (operations.length > 0) {
      await Hospital.bulkWrite(operations, { ordered: false });
    }
  } catch (error) {
    OSM_SYNC_CACHE.delete(cacheKey);
    throw error;
  }
};


async function fetchDatafromOSM(lat,lng,radius){
    
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:${radius}, ${lat}, ${lng});
        node["amenity"="clinic"](around:${radius}, ${lat}, ${lng});
        node["healthcare"="doctor"](around:${radius}, ${lat}, ${lng});
      );
      out body;
    `;
  
        const response = await fetch(`https://overpass-api.de/api/interpreter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: query,
    });

    if (!response.ok) {
      throw new Error(`OSM request failed with status ${response.status}`);
    }

    const data=await response.json();
    return Array.isArray(data?.elements) ? data.elements : [];
}


const findHospitalsNearby=(lat,lng,specialistRegex,radius)=>{
    return Hospital.aggregate([
      {
        $geoNear : {
          near :{
              type :"Point",
              coordinates : [lng,lat],
          },
          distanceField : "distance",
          maxDistance : radius,
          spherical : true,
          query: {
            specialists : {$regex : specialistRegex},
          },
        }
      },
      { $limit: SEARCH_RESULT_LIMIT },
    ]);
}





exports.postAddReview=async (req,res,next)=>{
    const {doctorId,patientId,rating,review}=req.body;
try{
  // Determine which model the doctor belongs to
  let targetModel = null;
  let targetDoc = null;

  targetDoc = await Doctor.findById(doctorId);
  if (targetDoc) {
    targetModel = "Doctor";
  } else {
    targetDoc = await Hospital.findById(doctorId);
    if (targetDoc) {
      targetModel = "Hospital";
    } else {
      targetDoc = await User.findOne({ _id: doctorId, userType: "Doctor" });
      if (targetDoc) {
        targetModel = "Doctor"; // stored as Doctor type in review
      }
    }
  }

  if (!targetDoc) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  let newreview = new Reviews({
    targetId: doctorId,
    targetModel,
    patientId,
    rating,
    review,
  });

  await newreview.save();

  await newreview.populate({
    path: "patientId",
    select: "firstName lastName",
  });

  // Push review to the correct collection
  if (targetModel === "Hospital") {
    targetDoc.reviews.push(newreview._id);
    await targetDoc.save();
  } else if (targetDoc.doctorReviews) {
    // User-model doctor
    targetDoc.doctorReviews.push(newreview._id);
    await targetDoc.save();
  } else {
    // Doctor-model doctor
    targetDoc.reviews.push(newreview._id);
    await targetDoc.save();
  }

  return res.status(201).json({ message: "Review Created", newreview });
} catch (error) {
  console.error("Review error:", error);
  res.status(400).json({ message: "Error creating review", error: error.message });
}
}

exports.getDoctorById=async (req,res,next)=>{
    
   try{
    const {doctorId}=req.params;
   let details;
   let sourceModel = null;
        details=await Doctor.findById(doctorId).populate({
            path : 'reviews',
            select : "rating review createdAt",
            populate : {
                path : 'patientId',
                select : "firstName lastName"
            }
        });
          if(details){
            sourceModel = "legacyDoctor";
          }
          if(!details){
             details=await Hospital.findById(doctorId).populate({
                path : 'reviews',
            select : "rating review createdAt",
            populate : {
                path : 'patientId',
                select : "firstName lastName"
            }
            });
            if(details){
              sourceModel = "hospital";
            }

          }
          if(!details){
            // Also check User model for registered doctors
            const userDoc = await User.findOne({ _id: doctorId, userType: "Doctor", profileCompleted: true })
              .populate({ path: 'doctorReviews', select: 'rating review createdAt', populate: { path: 'patientId', select: 'firstName lastName' } });
            if(userDoc) {
              sourceModel = "userDoctor";
              details = {
                _id: userDoc._id,
                name: `${userDoc.firstName} ${userDoc.lastName}`,
                specialist: userDoc.specialist,
                experience: userDoc.experience,
                degree: userDoc.degree,
                languages: userDoc.languages,
                address: userDoc.address,
                about: userDoc.about,
                photoUrl: userDoc.photoUrl,
                location: userDoc.location,
                mapLink: userDoc.mapLink,
                fee: userDoc.fee,
                clinicName: userDoc.clinicName,
                availability: userDoc.availability,
                reviews: userDoc.doctorReviews,
                _isUserDoctor: true,
                canBookAppointment: true,
              };
            }
          }
          if(!details){
          return res.status(404).json({error : "Doctor Not Found"});
          }

    const doctorPayload = typeof details.toObject === "function" ? details.toObject() : details;
    if(sourceModel !== "userDoctor"){
      doctorPayload._isUserDoctor = false;
      doctorPayload.canBookAppointment = false;
    }

    return res.status(200).json({doctor:doctorPayload});
    }catch(error){
      res.status(400).json({error : "Not known"});
    }
}
