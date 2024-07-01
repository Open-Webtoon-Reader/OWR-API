import {Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import {PrismaService} from "../misc/prisma.service";
import {CipherService} from "../misc/cipher.service";
import * as uuid from "uuid";


@Injectable()
export class AuthService{

    constructor(
        private readonly prismaService: PrismaService,
        private readonly cipherService: CipherService,
    ){}

    async loginUser(email: string, password: string): Promise<string>{
        const user = await this.prismaService.users.findUnique({
            where: {
                email,
            },
        });
        if(!user)
            throw new NotFoundException("User not found");
        if(!await this.cipherService.compareHash(user.password, password))
            throw new UnauthorizedException("Invalid password");
        const sessionUUID = uuid.v7();
        await this.prismaService.sessions.create({
            data: {
                uuid: sessionUUID,
                user_id: user.id,
            },
        });
        return sessionUUID;
    }

    async verifySession(sessionUUID: string): Promise<any>{
        const session: any = await this.prismaService.sessions.findUnique({
            where: {
                uuid: sessionUUID,
            },
            include: {
                user: true,
            }
        });
        if(!session)
            throw new UnauthorizedException("Invalid session");
        delete session.user.password;
        return session.user;
    }

}
