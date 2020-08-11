const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

let storage =  new CloudinaryStorage({
  cloudinary,
  folder: 'gamanfy', // The name of the folder in cloudinary
  allowedFormats: ['jpg', 'png', 'jpeg', 'gif', 'mp3', 'wav', 'pdf'],
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const uploader = multer({ storage });


module.exports = uploader


