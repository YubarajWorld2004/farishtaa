const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const makeUploader = (subDirectory, maxFileSizeBytes = 8 * 1024 * 1024) => {
  const uploadRoot = path.join(__dirname, '..', 'uploads', subDirectory);
  ensureDir(uploadRoot);

  const storage = multer.diskStorage({
    destination: (_, __, cb) => {
      ensureDir(uploadRoot);
      cb(null, uploadRoot);
    },
    filename: (_, file, cb) => {
      const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniquePrefix}-${sanitizeFileName(file.originalname)}`);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: maxFileSizeBytes,
      files: 5,
    },
  });
};

const uploadTelemedicineFiles = makeUploader(path.join('telemedicine', 'chat'), 10 * 1024 * 1024);
const uploadPrescriptionFile = makeUploader('prescriptions', 15 * 1024 * 1024);

module.exports = {
  uploadTelemedicineFiles,
  uploadPrescriptionFile,
};
