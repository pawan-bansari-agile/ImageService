import { BadRequestException, Injectable } from '@nestjs/common';
import { join } from 'path';
import * as sharp from 'sharp';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async upload(file: Express.Multer.File, query: object) {
    const supportedFormats = ['jpg', 'jpeg', 'png', 'gif']; // List of supported formats

    let userFormats = query['format'] ? [].concat(query['format']) : [];
    if (userFormats.length === 0) {
      userFormats = ['jpg', 'png']; // Default formats
    }

    if (userFormats.some((format) => !supportedFormats.includes(format))) {
      const invalidFormats = userFormats.filter(
        (format) => !supportedFormats.includes(format),
      );
      throw new BadRequestException(
        `Unsupported formats: ${invalidFormats.join(', ')}`,
      );
    }

    let userWidths = query['width'];
    let userHeights = query['height'];

    // Check if parameters are provided before validation
    if (userWidths && userHeights) {
      userWidths = Array.isArray(userWidths) ? userWidths : [userWidths];
      userHeights = Array.isArray(userHeights) ? userHeights : [userHeights];

      if (userWidths.length !== userHeights.length) {
        throw new BadRequestException(
          'Mismatched width and height parameters.',
        );
      }
    }

    const userSizes = userWidths
      ? userWidths.map((width: string, index: number) => {
          const parsedWidth = parseInt(width);
          const parsedHeight = parseInt(userHeights[index]);

          if (
            isNaN(parsedWidth) ||
            isNaN(parsedHeight) ||
            parsedWidth <= 0 ||
            parsedHeight <= 0
          ) {
            throw new BadRequestException(
              `Invalid width or height provided: ${width}x${userHeights[index]}`,
            );
          }

          return { width: parsedWidth, height: parsedHeight };
        })
      : null;

    const image = file.filename;
    const imageLocation = join(process.cwd(), 'upload', `${image}`);
    const imageName = imageLocation.split('.');
    const baseName = imageName[0];

    const sizes = [
      { width: 150, height: 97 },
      { width: 300, height: 194 },
      { width: 450, height: 291 },
      { width: 600, height: 388 },
      { width: 750, height: 485 },
    ];

    const sizesToUse = userSizes ? userSizes : sizes;

    for (const format of userFormats) {
      for (const sizeObj of sizesToUse) {
        const width = sizeObj.width;
        const height = sizeObj.height;

        await sharp(imageLocation)
          .resize(width, height)
          .toFile(`${baseName}_size${width}x${height}.${format}`);
      }
    }

    return 'success';
  }
}
