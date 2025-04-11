import {BadRequestException, Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import ImageTypes from "../webtoon/webtoon/models/enums/image-types";
import {LoginPayload} from "./models/payloads/login.payload";
import {UserEntity} from "./models/entities/user.entity";
import {PrismaService} from "../misc/prisma.service";
import {MiscService} from "../misc/misc.service";
import {EpisodeProgressions, Images, Users} from "@prisma/client";
import {JwtService} from "@nestjs/jwt";
import {EpisodeProgressionPayload} from "./models/payloads/episode-progression.payload";

@Injectable()
export class UsersService{
    constructor(
        private readonly prismaService: PrismaService,
        private readonly miscService: MiscService,
        private readonly jwtService: JwtService,
    ){}

    toUserEntity(user: Users, avatar: string): UserEntity{
        return new UserEntity({
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            avatar: avatar,
            jwtId: user.jwt_id,
            admin: user.admin,
        });
    }

    async getAvailableAvatars(): Promise<string[]>{
        const webtoons: any[] = await this.prismaService.webtoons.findMany({
            include: {
                thumbnail: true,
            },
        });
        if(!webtoons.length)
            return [];
        const avatars: Images[] = [];
        for(const webtoon of webtoons)
            if(webtoon.thumbnail)
                avatars.push(webtoon.thumbnail);
        return avatars.map((avatar: Images): string => avatar.sum);
    }

    async setAvatar(user: UserEntity, sum: string){
        const avatar = await this.prismaService.images.findUnique({
            where: {
                sum,
            },
            include: {
                type: true,
            },
        });
        if(!avatar)
            throw new NotFoundException("Image not found");
        if(avatar.type.name !== ImageTypes.WEBTOON_THUMBNAIL)
            throw new BadRequestException("Specified image is not a webtoon thumbnail");
        await this.prismaService.users.update({
            where: {
                id: user.id,
            },
            data: {
                avatar_id: avatar.id,
            },
        });
    }

    async getUserById(userId: string): Promise<UserEntity>{
        const user = await this.prismaService.users.findUnique({
            where: {
                id: userId,
            },
            include: {
                avatar: true,
            },
        });
        if(!user)
            throw new NotFoundException("User not found");
        return this.toUserEntity(user, user.avatar?.sum);
    }

    async login(usernameOrEmail: string, password: string): Promise<LoginPayload>{
        const user = await this.prismaService.users.findFirst({
            where: {
                OR: [
                    {
                        username: usernameOrEmail,
                    },
                    {
                        email: usernameOrEmail,
                    },
                ],
            },
            include: {
                avatar: true,
            },
        });
        if(!user)
            throw new NotFoundException("User not found");
        if(!this.miscService.comparePassword(password, user.password))
            throw new UnauthorizedException("Invalid password");
        return {
            user: this.toUserEntity(user, user.avatar?.sum),
            token: this.jwtService.sign({}, {
                subject: user.id,
                expiresIn: "30d",
                jwtid: user.jwt_id,
            }),
        };
    }

    async getWebtoonProgression(user: UserEntity, webtoonId: number): Promise<EpisodeProgressionPayload[]>{
        const episodeProgressions: EpisodeProgressions[] = await this.prismaService.episodeProgressions.findMany({
            where: {
                user_id: user.id,
                episode: {
                    webtoon_id: webtoonId,
                },
            },
        });
        if(!episodeProgressions.length)
            return [];
        return episodeProgressions.map((episodeProgression: EpisodeProgressions): EpisodeProgressionPayload => ({
            episodeId: episodeProgression.episode_id,
            progression: episodeProgression.progression,
        }));
    }

    async getEpisodeProgression(user: UserEntity, episodeId: number): Promise<EpisodeProgressionPayload>{
        const episodeProgression: EpisodeProgressions = await this.prismaService.episodeProgressions.findUnique({
            where: {
                user_id_episode_id: {
                    user_id: user.id,
                    episode_id: episodeId,
                },
            },
        });
        if(!episodeProgression)
            throw new NotFoundException("Episode progression not found");
        return {
            episodeId,
            progression: episodeProgression.progression,
        } as EpisodeProgressionPayload;
    }

    async setEpisodeProgression(user: UserEntity, episodeId: number, progression: number){
        const episodeProgression: EpisodeProgressions | undefined = await this.prismaService.episodeProgressions.findUnique({
            where: {
                user_id_episode_id: {
                    user_id: user.id,
                    episode_id: episodeId,
                },
            },
        });
        if(progression < 0)
            throw new BadRequestException("Invalid progression");
        if(progression < (episodeProgression?.progression || 0))
            throw new BadRequestException("New progression must be greater than existing one");
        await this.prismaService.episodeProgressions.upsert({
            where: {
                user_id_episode_id: {
                    user_id: user.id,
                    episode_id: episodeId,
                },
            },
            create: {
                user_id: user.id,
                episode_id: episodeId,
                progression,
            },
            update: {
                progression,
            },
        });
    }

    async deleteAllProgressions(user: UserEntity){
        await this.prismaService.episodeProgressions.deleteMany({
            where: {
                user_id: user.id,
            },
        });
    }

    async deleteWebtoonProgression(user: UserEntity, webtoonId: number){
        await this.prismaService.episodeProgressions.deleteMany({
            where: {
                user_id: user.id,
                episode: {
                    webtoon_id: webtoonId,
                },
            },
        });
    }

    async deleteEpisodeProgression(user: UserEntity, episodeId: number){
        await this.prismaService.episodeProgressions.deleteMany({
            where: {
                user_id: user.id,
                episode_id: episodeId,
            },
        });
    }
}
