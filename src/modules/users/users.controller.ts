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

    @Get("progression/webtoon/:webtoon_id")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async getWebtoonProgression(@User() user: UserEntity, @Param("webtoon_id") webtoonId: number){
        return await this.usersService.getWebtoonProgression(user, webtoonId);
    }

    @Get("progression/episode/:episode_id")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async getEpisodeProgression(@User() user: UserEntity, @Param("episode_id") episodeId: number){
        return await this.usersService.getEpisodeProgression(user, episodeId);
    }

    @Post("progression/:episode_id")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async setEpisodeProgression(@User() user: UserEntity, @Param("episode_id") episodeId: number, @Body("progression") progression: number): Promise<void>{
        await this.usersService.setEpisodeProgression(user, episodeId, progression);
    }
}
