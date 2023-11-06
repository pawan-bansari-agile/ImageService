"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStorage = void 0;
const common_1 = require("@nestjs/common");
const multer_s3_1 = require("multer-s3");
const aws = require("aws-sdk");
require('dotenv').config();
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const s3Storage = (0, multer_s3_1.default)({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        const key = `uploads/${Date.now()}-${file.originalname}`;
        cb(null, key);
    },
});
exports.UserStorage = {
    storage: s3Storage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;
        const ext = file.originalname.split('.').pop();
        if (!allowedExtensions.test(ext)) {
            return cb(new common_1.BadRequestException('Invalid file type. Only jpg, jpeg, png and gif files are allowed.'), false);
        }
        cb(null, true);
    },
};
//# sourceMappingURL=consts.js.map