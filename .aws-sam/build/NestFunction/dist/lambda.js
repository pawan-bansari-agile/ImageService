"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const app_service_1 = require("./app.service");
const handler = async (event, context, callback) => {
    const appContext = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const appService = appContext.get(app_service_1.AppService);
    return {
        body: appService.getHello(),
        statusCode: common_1.HttpStatus.OK,
    };
};
exports.handler = handler;
//# sourceMappingURL=lambda.js.map