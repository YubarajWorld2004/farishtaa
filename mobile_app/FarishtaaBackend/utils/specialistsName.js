const specialistKeywords = {
  cardiologist: [
    "cardio",
    "cardiology",
    "heart",
    "cardiac",
    "heart care"
  ],

  dermatologist: [
    "derma",
    "dermatology",
    "skin",
    "skin care",
    "cosmetic",
    "aesthetic"
  ],

  dentist: [
    "dental",
    "dentist",
    "tooth",
    "teeth",
    "oral",
    "maxillofacial"
  ],

  ent: [
    "ent",
    "ear",
    "nose",
    "throat",
    "otolaryngology"
  ],

  endocrinologist: [
    "endocrine",
    "endocrinology",
    "diabetes",
    "diabetic",
    "thyroid",
    "hormone"
  ],

  ophthalmologist: [
    "eye",
    "ophthalmology",
    "vision",
    "optical",
    "eye care",
    "eye hospital"
  ],

  general_physician: [
    "general",
    "physician",
    "medicine",
    "medical",
    "hospital",
    "clinic",
    "health care"
  ],

  gynecologist: [
    "gyn",
    "gynaec",
    "gynecologist",
    "gynecology",
    "maternity",
    "women",
    "obstetric",
    "obg"
  ],

  neurologist: [
    "neuro",
    "neurology",
    "brain",
    "spine",
    "nerve"
  ],

  orthopedic: [
    "ortho",
    "orthopedic",
    "bone",
    "joint",
    "fracture",
    "spine"
  ],

  pediatrician: [
    "pediatric",
    "paediatric",
    "child",
    "children",
    "kids",
    "neonatal"
  ],

  psychiatrist: [
    "psychiatry",
    "psychiatrist",
    "mental",
    "mental health",
    "depression",
    "anxiety"
  ]
};

export const detectSpecialistsFromName=(name)=>{
    if(!name || typeof(name)!=="string") return ["general_physician"];
    const lowercase=name.toLowerCase();
    const detectedSpecialists=new Set();
    for(const [specialist,keywords] of Object.entries(specialistKeywords)){
     for(const keyword of keywords){
        const regex=new RegExp(`\\b${keyword}\\b`)
        if(regex.test(lowercase)){
            detectedSpecialists.add(specialist);
        break;
        }
     }
    }
    return Array.from(detectedSpecialists);
}