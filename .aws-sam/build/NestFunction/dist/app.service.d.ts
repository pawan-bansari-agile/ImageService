/// <reference types="multer" />
import { ImageDocument } from './image.schema';
import { Model } from 'mongoose';
export declare class AppService {
    private imageModel;
    constructor(imageModel: Model<ImageDocument>);
    deleteImagesWithLowScore(): Promise<void>;
    getHello(): string;
    deleteImagesWithScoreLessThanOne(): Promise<void>;
    upload(file: Express.Multer.File, query: object): Promise<string>;
    fetchImages(keyword: string): Promise<any[]>;
}
