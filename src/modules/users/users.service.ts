import {Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import {UserEntity} from "./models/entities/user.entity";
import {PrismaService} from "../misc/prisma.service";
import {Images, Users} from "@prisma/client";
import {LoginPayload} from "./models/payloads/login.payload";
import {MiscService} from "../misc/misc.service";
import {JwtService} from "@nestjs/jwt";

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
        });
    }

    async getAvailableAvatars(): Promise<Images[]>{
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
        return avatars;
    }

    async randomAvatar(): Promise<Images | undefined>{
        const avatars = await this.getAvailableAvatars();
        if(!avatars.length)
            return undefined;
        const randomWebtoon: any = avatars[Math.floor(Math.random() * avatars.length)];
        return randomWebtoon.thumbnail;
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

    async login(email: string, password: string): Promise<LoginPayload>{
        const user = await this.prismaService.users.findUnique({
            where: {
                email,
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
}
