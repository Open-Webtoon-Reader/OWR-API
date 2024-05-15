import {Module} from "@nestjs/common";
import {AdminController} from "./admin.controller";
import {WebtoonModule} from "../webtoon/webtoon.module";

@Module({
    imports: [WebtoonModule],
    controllers: [AdminController],
    providers: [],
})
export class AdminModule{}
