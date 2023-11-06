"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const sharp = require("sharp");
const image_schema_1 = require("./image.schema");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const schedule_1 = require("@nestjs/schedule");
const aws_sdk_1 = require("aws-sdk");
let AppService = class AppService {
    constructor(imageModel) {
        this.imageModel = imageModel;
    }
    async deleteImagesWithLowScore() {
        await this.deleteImagesWithScoreLessThanOne();
    }
    getHello() {
        return 'Hello World!';
    }
    async deleteImagesWithScoreLessThanOne() {
        const imagesToDelete = await this.imageModel
            .find({ score: { $lt: 1 } })
            .exec();
        for (const image of imagesToDelete) {
            await this.imageModel.deleteOne({ _id: image._id }).exec();
        }
    }
    async upload(file, query) {
        const s3 = new aws_sdk_1.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });
        const supportedFormats = ['jpg', 'jpeg', 'png', 'gif'];
        const key = `uploads/${Date.now()}-${file.originalname}`;
        const userFormats = query['format']
            ? [].concat(query['format'])
            : ['jpg', 'png'];
        const userWidths = Array.isArray(query['width'])
            ? query['width']
            : [query['width']];
        const userHeights = Array.isArray(query['height'])
            ? query['height']
            : [query['height']];
        if (userFormats.some((format) => !supportedFormats.includes(format)) ||
            userWidths.length !== userHeights.length) {
            throw new common_1.BadRequestException('Invalid format or mismatched width and height parameters.');
        }
        const userSizes = userWidths.map((width, index) => {
            const parsedWidth = parseInt(width);
            const parsedHeight = parseInt(userHeights[index]);
            if (isNaN(parsedWidth) ||
                isNaN(parsedHeight) ||
                parsedWidth <= 0 ||
                parsedHeight <= 0) {
                s3.deleteObject({
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: key,
                });
                throw new common_1.BadRequestException(`Invalid width or height provided: ${width}x${userHeights[index]}`);
            }
            return { width: parsedWidth, height: parsedHeight };
        });
        const image = file.filename;
        const imageLocation = (0, path_1.join)(process.cwd(), 'upload', `${image}`);
        const imageName = imageLocation.split('.');
        const baseName = imageName[0];
        const name = image.split('.');
        const onlyname = name[0];
        const sizes = [
            { width: 150, height: 97 },
            { width: 300, height: 194 },
            { width: 450, height: 291 },
            { width: 600, height: 388 },
            { width: 750, height: 485 },
        ];
        const sizesToUse = userSizes ? userSizes : sizes;
        const imageNamesToStore = [];
        for (const format of userFormats) {
            for (const sizeObj of sizesToUse) {
                const width = sizeObj.width;
                const height = sizeObj.height;
                console.log('onlyname', onlyname);
                const newImageName = `${onlyname}_${width}x${height}.${format}`;
                imageNamesToStore.push({ imageName: newImageName });
                const imgBuffer = await sharp(file.buffer)
                    .resize(width, height)
                    .toBuffer();
                try {
                    await s3
                        .upload({
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: key,
                        Body: imgBuffer,
                        ACL: 'public-read',
                        ContentType: `${format}`,
                    })
                        .promise();
                    return key;
                }
                catch (error) {
                    throw new Error('Error uploading image to S3: ' + error.message);
                }
            }
        }
        console.log('imageNamesToStore', imageNamesToStore);
        imageNamesToStore.push({ imageName: image });
        await this.imageModel.insertMany(imageNamesToStore);
        return 'success';
    }
    async fetchImages(keyword) {
        const searchRegex = new RegExp(keyword, 'i');
        const uploadPath = (0, path_1.join)(process.cwd(), 'upload');
        const files = await (0, promises_1.readdir)(uploadPath);
        console.log('files', files);
        const matchingImages = [];
        for (const file of files) {
            if (searchRegex.test(file)) {
                const filePath = (0, path_1.join)(uploadPath, file);
                console.log('filePath', filePath);
                const stats = (0, fs_1.statSync)(filePath);
                console.log('stats', stats.isFile());
                if (stats.isFile()) {
                    matchingImages.push(file);
                }
            }
        }
        if (matchingImages.length > 0) {
            const urls = [];
            matchingImages.forEach((images) => {
                urls.push(`http://localhost:3000/${images}`);
            });
            console.log('matchingImages', matchingImages);
            await this.imageModel.updateMany({
                imageName: { $in: matchingImages },
            }, {
                $inc: { score: 1 },
            });
            return urls;
        }
        else {
            throw new common_1.BadRequestException('No images found with given keyword');
        }
    }
};
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppService.prototype, "deleteImagesWithLowScore", null);
AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(image_schema_1.Images.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AppService);
exports.AppService = AppService;
//# sourceMappingURL=app.service.js.map