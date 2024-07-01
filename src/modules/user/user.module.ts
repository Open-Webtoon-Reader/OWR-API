import {Module} from "@nestjs/common";
import {UserController} from "./user.controller";
import {UserService} from "./user.service";
import {MiscModule} from "../misc/misc.module";
import {AuthController} from "./auth.controller";
import {AuthService} from "./auth.service";


@Module({
    imports: [MiscModule],
    controllers: [UserController, AuthController],
    providers: [UserService, AuthService],
    exports: [],
})
export class UserModule{}
