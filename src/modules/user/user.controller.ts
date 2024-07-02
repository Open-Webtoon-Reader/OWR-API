import {Controller, Get, Req, UseGuards} from "@nestjs/common";
import {ApiCookieAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";
import {AuthGuard} from "./guard/auth.guard";
import {HttpStatusCode} from "axios";
import {UserEntity} from "./models/entities/user.entity";

@Controller("user")
@ApiTags("User")
export class UserController{

    constructor(
        private readonly userService: UserService,
    ){}

    @Get("me")
    @UseGuards(AuthGuard)
    @ApiCookieAuth()
    @ApiResponse({status: HttpStatusCode.Ok, description: "Returns the user's information", type: UserEntity})
    @ApiResponse({status: HttpStatusCode.Unauthorized, description: "Invalid session"})
    @ApiResponse({status: HttpStatusCode.NotFound, description: "User not found"})
    async getMe(@Req() request: any){
        return request.user;
    }
}
