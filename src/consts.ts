import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
// import multerS3 from 'multer-s3';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const multerS3 = require('multer-s3');
import * as multerS3 from 'multer-s3';
import * as aws from 'aws-sdk';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

// export const UserStorage = {
//   storage: diskStorage({
//     destination: './upload',
//     filename: (req, file, cb) => {
//       const filename: string = file.originalname;
//       const fileName: string = filename.replace(/\s/g, '');
//       const extention: string[] = fileName.split('.');
//       cb(null, `${extention[0]}${new Date().getTime()}.${extention[1]}`);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//       return cb(file, false);
//     }
//     cb(null, true);
//   },
// };

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

let ext;

const s3Storage = multerS3({
  s3: s3 as any,
  bucket: `${process.env.S3_BUCKET_NAME}`,
  acl: 'public-read', // Optional: set the access control level
  // contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically detect and set the content type
  key: (req, file, cb) => {
    // Define the key (filename) for the S3 object
    ext = file.originalname.split('.').pop();
    const key = `uploads/${Date.now()}-${file.originalname}`;
    cb(null, key);
  },
  contentType: (req, file, cb) => {
    // Determine content type based on the file extension
    const contentType = `image/${ext}`;
    cb(null, contentType);
  },
});

export const UserStorage = {
  storage: s3Storage,
  // diskStorage({
  //   destination: './upload',
  //   filename: (req, file, cb) => {
  //     const filename: string = file.originalname;
  //     const fileName: string = filename.replace(/\s/g, '');
  //     const extention: string[] = fileName.split('.');
  //     cb(null, `${extention[0]}.${extention[1]}`);
  //   },
  // }),
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i; // case-insensitive
    const ext = file.originalname.split('.').pop();
    if (!allowedExtensions.test(ext)) {
      console.log('inside s3Storage');

      return cb(
        new BadRequestException(
          'Invalid file type. Only jpg, jpeg, png and gif files are allowed.',
        ),
        false,
      );
    }
    cb(null, true);
  },
};
