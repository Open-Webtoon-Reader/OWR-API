import {Body, Controller, Get, Param, Post, UseGuards} from "@nestjs/common";
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
        return await this.usersService.login(body.usernameOrEmail, body.password);
    }

    @Get("me")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    getMe(@User() user: UserEntity): UserEntity{
        return user;
    }

    @Get("avatars")
    async getAvailableAvatars(): Promise<string[]>{
        const avatars: string[] = await this.usersService.getAvailableAvatars();
        if(!avatars.length)
            return undefined;
        return avatars;
    }

    @Post("avatar/:sum")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async setAvatar(@User() user: UserEntity, @Param("sum") sum: string): Promise<void>{
        await this.usersService.setAvatar(user, sum);
    }
}
