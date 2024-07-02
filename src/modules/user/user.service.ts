import {Injectable, NotFoundException} from "@nestjs/common";
import {PrismaService} from "../misc/prisma.service";
import {UserEntity} from "./models/entities/user.entity";


@Injectable()
export class UserService{

    constructor(
        private readonly prismaService: PrismaService,
    ){}

    async getMe(userId: number): Promise<any>{
        const user = await this.prismaService.users.findUnique({
            where: {
                id: userId,
            },
            include: {
                type: true,
                avatar: true,
            }
        });
        if(!user)
            throw new NotFoundException("User not found");
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
}
