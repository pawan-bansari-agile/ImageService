import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';

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

export const UserStorage = {
  storage: diskStorage({
    destination: './upload',
    filename: (req, file, cb) => {
      const filename: string = file.originalname;
      const fileName: string = filename.replace(/\s/g, '');
      const extention: string[] = fileName.split('.');
      cb(
        null,
        `${extention[0]}mainImage&TS:${new Date().getTime()}.${extention[1]}`,
      );
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i; // case-insensitive
    if (!allowedExtensions.test(file.originalname)) {
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
