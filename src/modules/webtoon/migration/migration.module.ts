import {Module} from "@nestjs/common";
import {MigrationController} from "./migration.controller";
import {MigrationService} from "./migration.service";
import {WebtoonModule} from "../webtoon/webtoon.module";
import {MiscModule} from "../../misc/misc.module";
import {UserModule} from "../../user/user.module";

@Module({
    providers: [MigrationService],
    controllers: [MigrationController],
    imports: [WebtoonModule, MiscModule, UserModule]
})
export class MigrationModule{}
