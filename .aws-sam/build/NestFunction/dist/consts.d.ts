/// <reference types="multer" />
export declare const UserStorage: {
    storage: import("multer").StorageEngine;
    fileFilter: (req: any, file: any, cb: any) => any;
};
