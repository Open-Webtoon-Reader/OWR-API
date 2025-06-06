import {Module} from "@nestjs/common";
import {AdminController} from "./admin.controller";
import {WebtoonModule} from "../webtoon/webtoon.module";
import {UsersModule} from "../../users/users.module";
import {AdminUsersController} from "./admin-users.controller";

@Module({
    imports: [WebtoonModule, UsersModule],
    controllers: [AdminController, AdminUsersController],
    providers: [],
})
export class AdminModule{}
