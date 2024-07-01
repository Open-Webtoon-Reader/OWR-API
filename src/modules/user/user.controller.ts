import {Controller, Get, Req, UseGuards} from "@nestjs/common";
import {ApiCookieAuth, ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";
import {AuthGuard} from "./guard/auth.guard";


@Controller("user")
@ApiTags("User")
export class UserController{

    constructor(
        private readonly userService: UserService,
    ){}

    @Get("me")
    @UseGuards(AuthGuard)
    @ApiCookieAuth()
    async getMe(@Req() request: any){
        return request.user;
    }
}
