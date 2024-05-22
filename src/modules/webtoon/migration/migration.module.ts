import {Module} from "@nestjs/common";
import {MigrationController} from "./migration.controller";
import {MigrationService} from "./migration.service";

@Module({
    providers: [MigrationService],
    controllers: [MigrationController],
})
export class MigrationModule{}
