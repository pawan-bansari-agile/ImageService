/// <reference types="multer" />
import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    uploadImage(file: Express.Multer.File, query: object): Promise<string>;
    getUserProfilePhoto(searchTerm: string): Promise<any[]>;
}
