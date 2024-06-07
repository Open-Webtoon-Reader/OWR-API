import {Module} from "@nestjs/common";
import {UpdateService} from "./update.service";
import {UpdateController} from "./update.controller";
import {MiscModule} from "../../misc/misc.module";
import {WebtoonModule} from "../webtoon/webtoon.module";


@Module({
    providers: [UpdateService],
    controllers: [UpdateController],
    imports: [MiscModule, WebtoonModule]
})
export class UpdateModule{}
