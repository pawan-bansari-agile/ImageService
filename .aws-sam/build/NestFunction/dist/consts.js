"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStorage = void 0;
const common_1 = require("@nestjs/common");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
require('dotenv').config();
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
let ext;
const s3Storage = multerS3({
    s3: s3,
    bucket: `${process.env.S3_BUCKET_NAME}`,
    acl: 'public-read',
    key: (req, file, cb) => {
        ext = file.originalname.split('.').pop();
        const key = `uploads/${Date.now()}-${file.originalname}`;
        cb(null, key);
    },
    contentType: (req, file, cb) => {
        const contentType = `image/${ext}`;
        cb(null, contentType);
    },
});
exports.UserStorage = {
    storage: s3Storage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;
        const ext = file.originalname.split('.').pop();
        if (!allowedExtensions.test(ext)) {
            console.log('inside s3Storage');
            return cb(new common_1.BadRequestException('Invalid file type. Only jpg, jpeg, png and gif files are allowed.'), false);
        }
        cb(null, true);
    },
};
//# sourceMappingURL=consts.js.map