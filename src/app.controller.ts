import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserStorage } from './consts';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', UserStorage))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: object,
  ) {
    try {
      return await this.appService.upload(file, query);
    } catch (error) {
      // If there's an error, delete the uploaded file (if any) to prevent storage
      if (file && file.filename) {
        const filePath = join(process.cwd(), 'upload', file.filename);
        fs.unlinkSync(filePath); // Delete the file
      }

      throw error; // Re-throw the error to be caught by NestJS's error handling
    }
  }

  // @Get('image')
  // getUserProfilePhoto(
  //   @Res({ passthrough: true }) res: Response,
  // ): StreamableFile {
  //   res.set({ 'Content-Type': 'image/jpeg' });

  //   const imageLocation = join(process.cwd(), 'upload', 'wllpmainImage.jpeg');
  //   const file = createReadStream(imageLocation);
  //   return new StreamableFile(file);
  // }

  @Get('image')
  getUserProfilePhoto(
    @Query('name') imageName: string,
    @Query('format') imageFormat: string,
    @Query('size') imageSize: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    let imageLocation = '';

    // Build the image name based on provided search criteria
    if (imageName) {
      imageLocation += `${imageName}`;
    }
    if (imageFormat) {
      imageLocation += `${imageFormat}`;
    }
    if (imageSize) {
      imageLocation += `${imageSize}`;
    }
    imageLocation += '.png'; // Assuming all images have a .png extension

    const contentType = `image/png`;
    res.set({ 'Content-Type': contentType });

    const filePath = join(process.cwd(), 'upload', imageLocation);
    const file = createReadStream(filePath);

    return new StreamableFile(file);
  }
}
