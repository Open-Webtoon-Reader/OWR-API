import {Module} from "@nestjs/common";
import {MigrationController} from "./migration.controller";
import {MigrationService} from "./migration.service";
import {MiscModule} from "../../misc/misc.module";
import {WebtoonModule} from "../webtoon/webtoon.module";

@Module({
    providers: [MigrationService],
    controllers: [MigrationController],
    imports: [WebtoonModule]
})
export class MigrationModule{}
