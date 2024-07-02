import {Module} from "@nestjs/common";
import {UpdateService} from "./update.service";
import {UpdateController} from "./update.controller";
import {MiscModule} from "../../misc/misc.module";
import {WebtoonModule} from "../webtoon/webtoon.module";
import {UserModule} from "../../user/user.module";


@Module({
    providers: [UpdateService],
    controllers: [UpdateController],
    imports: [MiscModule, WebtoonModule, UserModule]
})
export class UpdateModule{}
