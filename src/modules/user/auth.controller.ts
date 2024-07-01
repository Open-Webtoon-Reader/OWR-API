import {Controller} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {AuthService} from "./auth.service";


@Controller("auth")
@ApiTags("Auth")
export class AuthController{

    constructor(
        private readonly authService: AuthService,
    ){}

}
