import {Controller} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";


@Controller("user")
@ApiTags("User")
export class UserController{

    constructor(
        private readonly userService: UserService,
    ){}

}
