import {Injectable} from "@nestjs/common";
import {PrismaService} from "../misc/prisma.service";


@Injectable()
export class UserService{

    constructor(
        private readonly prismaService: PrismaService,
    ){}

    async getMe(): Promise<any>{
        const user = await this.prismaService.users.findUnique({
            where: {
                id: 1,
            },
        });
        delete user.password;
        return user;
    }
}
