const multer = require('multer');

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
    folder: 'gamanfy-curriculums', 
    allowedFormats: ['pdf'],
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '-' + Date.now());
  },  
});

const uploader = multer({ storage:storage });

module.exports = uploader



/* const { uuid } = require('uuidv4');


const DIR = './public/uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, DIR);
  },
  filename: (req, file, cb) => {
      const fileName = file.originalname.toLowerCase().split(' ').join('-');
      cb(null, uuid() + '-' + fileName)
  }
});

var uploader = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == 'application/pdf') {
          cb(null, true);
      } else {
          cb(null, false);
          return cb(new Error('Only .png, .jpg and .jpeg .pdf format allowed!'));
      }
  }
}); */


