import {Module} from "@nestjs/common";
import {AdminController} from "./admin.controller";
import {WebtoonModule} from "../webtoon/webtoon.module";
import {UserModule} from "../../user/user.module";

@Module({
    imports: [WebtoonModule, UserModule],
    controllers: [AdminController],
    providers: [],
})
export class AdminModule{}
