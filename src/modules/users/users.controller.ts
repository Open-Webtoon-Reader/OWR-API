import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards} from "@nestjs/common";
import {UserEntity} from "./models/entities/user.entity";
import {LoginPayload} from "./models/payloads/login.payload";
import {User} from "./decorators/user.decorator";
import {LoginDto} from "./models/dto/login.dto";
import {ApiBearerAuth} from "@nestjs/swagger";
import {UsersService} from "./users.service";
import {AuthGuard} from "@nestjs/passport";
import {EpisodeProgressionDto} from "./models/dto/episode-progression.dto";
import {ChangePasswordDto} from "./models/dto/change-password.dto";

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

    @Patch("avatar/:sum")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    async setAvatar(@User() user: UserEntity, @Param("sum") sum: string): Promise<void>{
        return this.usersService.setAvatar(user, sum);
    }

    @Patch("password")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    async changePassword(@User() user: UserEntity, @Body() changePasswordDto: ChangePasswordDto): Promise<void>{
        return this.usersService.changePassword(user, changePasswordDto);
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

    @Post("progression/episode/:episode_id")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async setEpisodeProgression(@User() user: UserEntity, @Param("episode_id") episodeId: number, @Body() progression: EpisodeProgressionDto): Promise<void>{
        await this.usersService.setEpisodeProgression(user, episodeId, progression.progression);
    }

    @Delete("progression")
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async deleteAllProgressions(@User() user: UserEntity): Promise<void>{
        await this.usersService.deleteAllProgressions(user);
    }

    @Delete("progression/webtoon/:webtoon_id")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async deleteWebtoonProgression(@User() user: UserEntity, @Param("webtoon_id") webtoonId: number): Promise<void>{
        await this.usersService.deleteWebtoonProgression(user, webtoonId);
    }

    @Delete("progression/episode/:episode_id")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async deleteEpisodeProgression(@User() user: UserEntity, @Param("episode_id") episodeId: number): Promise<void>{
        await this.usersService.deleteEpisodeProgression(user, episodeId);
    }

    @Get("likes/webtoons")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async getLikedWebtoons(@User() user: UserEntity): Promise<number[]>{
        return await this.usersService.getLikedWebtoons(user);
    }

    @Post("likes/webtoon/:webtoon_id")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    async likeWebtoon(@User() user: UserEntity, @Param("webtoon_id") webtoonId: number): Promise<void>{
        await this.usersService.likeWebtoon(user, webtoonId);
    }

    @Delete("likes/webtoon/:webtoon_id")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    async unlikeWebtoon(@User() user: UserEntity, @Param("webtoon_id") webtoonId: number): Promise<void>{
        await this.usersService.unlikeWebtoon(user, webtoonId);
    }
}
