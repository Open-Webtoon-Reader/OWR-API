import {Module} from "@nestjs/common";
import {AdminController} from "./admin.controller";
import {WebtoonModule} from "../webtoon/webtoon.module";
import {AdminGuard} from "./guard/admin.guard";

@Module({
    imports: [WebtoonModule],
    controllers: [AdminController],
    providers: [AdminGuard],
})
export class AdminModule{}
