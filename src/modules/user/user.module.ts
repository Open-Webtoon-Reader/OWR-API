import {Module} from "@nestjs/common";
import {UserController} from "./user.controller";
import {UserService} from "./user.service";
import {MiscModule} from "../misc/misc.module";
import {AuthController} from "./auth.controller";
import {AuthService} from "./auth.service";
import {AuthGuard} from "./guard/auth.guard";


@Module({
    imports: [MiscModule],
    controllers: [UserController, AuthController],
    providers: [UserService, AuthService, AuthGuard],
    exports: [],
})
export class UserModule{}
