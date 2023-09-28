import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImageDocument = HydratedDocument<Images>;

@Schema()
export class Images {
  @Prop({ required: true })
  imageName: string;

  @Prop({ required: true, default: 0 })
  score: number;
}

export const ImageSchema = SchemaFactory.createForClass(Images);
