import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserStorage } from './consts';
import { join } from 'path';
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
      if (file && file.filename) {
        const filePath = join(process.cwd(), 'upload', file.filename);
        fs.unlinkSync(filePath);
      }

      throw error;
    }
  }

  @Get('image')
  async getUserProfilePhoto(@Query('searchTerm') searchTerm: string) {
    console.log('controller log', searchTerm);

    return await this.appService.fetchImages(searchTerm);
  }
}
