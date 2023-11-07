import { BadRequestException, Injectable } from '@nestjs/common';
import { join } from 'path';
import * as sharp from 'sharp';
import { ImageDocument, Images } from './image.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { statSync } from 'fs';
import { readdir } from 'fs/promises';
import { Cron, CronExpression } from '@nestjs/schedule';
import { S3 } from 'aws-sdk';
import * as fs from 'fs';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Images.name) private imageModel: Model<ImageDocument>,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async deleteImagesWithLowScore() {
    await this.deleteImagesWithScoreLessThanOne();
  }

  getHello(): string {
    return 'Hello World!';
  }

  async deleteImagesWithScoreLessThanOne() {
    const imagesToDelete = await this.imageModel
      .find({ score: { $lt: 1 } })
      .exec();

    for (const image of imagesToDelete) {
      // Delete from local storage (implement this)
      // Example: fs.unlinkSync(image.path);

      // Delete from the database
      await this.imageModel.deleteOne({ _id: image._id }).exec();
    }
  }

  async upload(file: Express.Multer.File, query: object) {
    console.log('from service');

    const s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    const supportedFormats = ['jpg', 'jpeg', 'png', 'gif']; // List of supported formats
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

    if (
      userFormats.some((format) => !supportedFormats.includes(format)) ||
      userWidths.length !== userHeights.length
    ) {
      throw new BadRequestException(
        'Invalid format or mismatched width and height parameters.',
      );
    }

    const userSizes = userWidths.map((width: string, index: number) => {
      const parsedWidth = parseInt(width);
      const parsedHeight = parseInt(userHeights[index]);

      if (
        isNaN(parsedWidth) ||
        isNaN(parsedHeight) ||
        parsedWidth <= 0 ||
        parsedHeight <= 0
      ) {
        s3.deleteObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
        });

        throw new BadRequestException(
          `Invalid width or height provided: ${width}x${userHeights[index]}`,
        );
      }

      return { width: parsedWidth, height: parsedHeight };
    });

    // let userFormats = query['format'] ? [].concat(query['format']) : [];
    // if (userFormats.length === 0) {
    //   userFormats = ['jpg', 'png']; // Default formats
    // }

    // if (userFormats.some((format) => !supportedFormats.includes(format))) {
    //   const invalidFormats = userFormats.filter(
    //     (format) => !supportedFormats.includes(format),
    //   );
    //   throw new BadRequestException(
    //     `Unsupported formats: ${invalidFormats.join(', ')}`,
    //   );
    // }

    // let userWidths = query['width'];
    // let userHeights = query['height'];

    // // Check if parameters are provided before validation
    // if (userWidths && userHeights) {
    //   userWidths = Array.isArray(userWidths) ? userWidths : [userWidths];
    //   userHeights = Array.isArray(userHeights) ? userHeights : [userHeights];

    //   if (userWidths.length !== userHeights.length) {
    //     throw new BadRequestException(
    //       'Mismatched width and height parameters.',
    //     );
    //   }
    // }

    // const userSizes = userWidths
    //   ? userWidths.map((width: string, index: number) => {
    //       const parsedWidth = parseInt(width);
    //       const parsedHeight = parseInt(userHeights[index]);

    //       if (
    //         isNaN(parsedWidth) ||
    //         isNaN(parsedHeight) ||
    //         parsedWidth <= 0 ||
    //         parsedHeight <= 0
    //       ) {
    //         throw new BadRequestException(
    //           `Invalid width or height provided: ${width}x${userHeights[index]}`,
    //         );
    //       }

    //       return { width: parsedWidth, height: parsedHeight };
    //     })
    //   : null;

    const image = file.filename;
    const imageLocation = join(process.cwd(), 'upload', `${image}`);
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
        console.log('reached sharp');

        const imgBuffer = await sharp(file.buffer)
          .resize(width, height)
          .toBuffer();
        // .toFile(`${baseName}_${width}x${height}.${format}`);

        try {
          await s3
            .upload({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: key,
              Body: imgBuffer, // Assuming you're using buffer for the uploaded file
              ACL: 'public-read', // Optional: set the access control level
              ContentType: `${format}`, // Set the content type based on the uploaded file
            })
            .promise();

          return key;
        } catch (error) {
          throw new Error('Error uploading image to S3: ' + error.message);
        }
      }
    }

    console.log('imageNamesToStore', imageNamesToStore);
    imageNamesToStore.push({ imageName: image });
    await this.imageModel.insertMany(imageNamesToStore);

    return 'success';
  }

  async fetchImages(keyword: string) {
    const searchRegex = new RegExp(keyword, 'i');
    const uploadPath = join(process.cwd(), 'upload');
    const files = await readdir(uploadPath);
    console.log('files', files);
    const matchingImages = [];
    for (const file of files) {
      if (searchRegex.test(file)) {
        const filePath = join(uploadPath, file);
        console.log('filePath', filePath);

        const stats = statSync(filePath);
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

      await this.imageModel.updateMany(
        {
          imageName: { $in: matchingImages },
        },
        {
          $inc: { score: 1 },
        },
      );

      return urls;
    } else {
      throw new BadRequestException('No images found with given keyword');
    }
  }
}
