import {Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import {PrismaService} from "../misc/prisma.service";
import {CipherService} from "../misc/cipher.service";
import * as uuid from "uuid";
import {ConfigService} from "@nestjs/config";
import {UserEntity} from "./models/entities/user.entity";


@Injectable()
export class AuthService{

    constructor(
        private readonly prismaService: PrismaService,
        private readonly cipherService: CipherService,
        private readonly configService: ConfigService,
    ){}

    async loginUser(email: string, password: string, userAgent: string): Promise<string>{
        const user = await this.prismaService.users.findUnique({
            where: {
                email,
            },
        });
        if(!user)
            throw new NotFoundException("User not found");
        if(!await this.cipherService.compareHash(user.password, password))
            throw new UnauthorizedException("Invalid password");
        // Check if user has more than the maximum number of sessions
        const userSessions = await this.prismaService.sessions.findMany({
            where: {
                user_id: user.id,
            },
            select: {
                uuid: true,
            }
        });
        if(userSessions.length >= this.configService.get<number>("MAX_SESSIONS")){
            await this.prismaService.sessions.delete({
                where: {
                    uuid: userSessions[0].uuid,
                },
            });
        }
        // Create a new session
        const sessionUUID = uuid.v7();
        const userAgentSum = this.cipherService.getSum(userAgent);
        await this.prismaService.sessions.create({
            data: {
                uuid: sessionUUID,
                user_id: user.id,
                user_agent_sum: userAgentSum,
            },
        });
        return sessionUUID;
    }

    async verifySession(sessionUUID: string, userAgent: string): Promise<UserEntity>{
        const userAgentSum = this.cipherService.getSum(userAgent);
        const session = await this.prismaService.sessions.findUnique({
            where: {
                uuid: sessionUUID,
            }
        });
        if(!session)
            throw new UnauthorizedException("Invalid session");
        if(session.user_agent_sum !== userAgentSum){
            await this.prismaService.sessions.delete({
                where: {
                    uuid: sessionUUID,
                },
            });
            throw new UnauthorizedException("Invalid session");
        }
        const sessionExpiration = parseInt(this.configService.get("SESSION_EXPIRATION")) * 1000;
        if(session.created_at.getTime() + sessionExpiration < Date.now()){
            await this.prismaService.sessions.delete({
                where: {
                    uuid: sessionUUID,
                },
            });
            throw new UnauthorizedException("Session expired");
        }
        const user = await this.prismaService.users.findUnique({
            where: {
                id: session.user_id,
            },
            include: {
                type: true,
                avatar: true,
            }
        });
        return new UserEntity(
            user.id,
            user.email,
            user.username,
            user.avatar?.sum,
            user.type.name,
            user.created_at,
            user.updated_at,
        );
    }

    async cleanSessions(): Promise<number>{
        const {count} = await this.prismaService.sessions.deleteMany({
            where: {
                created_at: {
                    lt: new Date(Date.now() - parseInt(this.configService.get("SESSION_EXPIRATION")) * 1000),
                },
            },
        });
        return count;
    }

    async logoutUser(userId: number, sessionUUID: string){
        await this.prismaService.sessions.delete({
            where: {
                uuid: sessionUUID,
                user_id: userId,
            },
        });
    }

    async logoutAllUser(userId: number){
        await this.prismaService.sessions.deleteMany({
            where: {
                user_id: userId,
            },
        });
    }
}
