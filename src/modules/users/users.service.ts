import {Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import {UserEntity} from "./models/entities/user.entity";
import {PrismaService} from "../misc/prisma.service";
import {Users} from "@prisma/client";
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

    toUserEntity(user: Users): UserEntity{
        return new UserEntity({
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            jwtId: user.jwt_id,
        });
    }

    async getUserById(userId: string): Promise<UserEntity>{
        const user: Users = await this.prismaService.users.findUnique({
            where: {
                id: userId,
            },
        });
        if(!user)
            throw new NotFoundException("User not found");
        return this.toUserEntity(user);
    }

    async login(email: string, password: string): Promise<LoginPayload>{
        const user: Users = await this.prismaService.users.findUnique({
            where: {
                email,
            },
        });
        if(!user)
            throw new NotFoundException("User not found");
        if(!this.miscService.comparePassword(password, user.password))
            throw new UnauthorizedException("Invalid password");
        return {
            user: this.toUserEntity(user),
            token: this.jwtService.sign({}, {
                subject: user.id,
                expiresIn: "30d",
                jwtid: user.jwt_id,
            }),
        };
    }
}
