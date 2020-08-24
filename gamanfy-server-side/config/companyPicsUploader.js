const multer = require('multer');
/*
const { uuid } = require('uuidv4');


const DIR = './public/companyPictures';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, DIR);
  },
  filename: (req, file, cb) => {
      const fileName = file.originalname.toLowerCase().split(' ').join('-');
      cb(null, uuid() + '-' + fileName)
  }
});

let companyPicUploader = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
          cb(null, true);
      } else {
          cb(null, false);
          return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
      }
  }
});
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage =  new CloudinaryStorage({
  cloudinary:cloudinary,
  params:{
    folder: 'gamanfy', // The name of the folder in cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg'],
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },  
});

const companyPicUploader = multer({ storage:storage });

module.exports = companyPicUploader





