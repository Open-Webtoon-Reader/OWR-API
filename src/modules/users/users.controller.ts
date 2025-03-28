import {Body, Controller, Get, Post, UseGuards} from "@nestjs/common";
import {UserEntity} from "./models/entities/user.entity";
import {LoginPayload} from "./models/payloads/login.payload";
import {User} from "./decorators/user.decorator";
import {LoginDto} from "./models/dto/login.dto";
import {ApiBearerAuth} from "@nestjs/swagger";
import {UsersService} from "./users.service";
import {AuthGuard} from "@nestjs/passport";

@Controller("user")
export class UsersController{
    constructor(
        private readonly usersService: UsersService,
    ){}

    @Post("login")
    async login(@Body() body: LoginDto): Promise<LoginPayload>{
        return await this.usersService.login(body.email, body.password);
    }

    @Get("me")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    getMe(@User() user: UserEntity): UserEntity{
        return user;
    }
}
