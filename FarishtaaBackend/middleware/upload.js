const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const UPLOADS_BASE_DIR = process.env.UPLOAD_ROOT_DIR
  ? path.resolve(process.env.UPLOAD_ROOT_DIR)
  : process.env.VERCEL
    ? path.join('/tmp', 'farishtaa', 'uploads')
    : path.join(__dirname, '..', 'uploads');

ensureDir(UPLOADS_BASE_DIR);

const toPublicUploadUrl = (absoluteFilePath) => {
  const relative = path.relative(UPLOADS_BASE_DIR, absoluteFilePath);
  const normalized = relative.split(path.sep).join('/');
  const safePath = normalized.startsWith('..') ? path.basename(absoluteFilePath) : normalized;
  return `/uploads/${safePath.replace(/^\/+/, '')}`;
};

const makeUploader = (subDirectory, maxFileSizeBytes = 8 * 1024 * 1024) => {
  const uploadRoot = path.join(UPLOADS_BASE_DIR, subDirectory);
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
  UPLOADS_BASE_DIR,
  toPublicUploadUrl,
  uploadTelemedicineFiles,
  uploadPrescriptionFile,
};
