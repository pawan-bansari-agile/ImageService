import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ImageSchema, Images } from './image.schema';
import { ScheduleModule } from '@nestjs/schedule';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

@Module({
  imports: [
    MongooseModule.forRoot(
      `mongodb+srv://images:K22D7LgnNN8zSiRI@images.d31vf0v.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp`,
    ),
    MongooseModule.forFeature([{ name: Images.name, schema: ImageSchema }]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
