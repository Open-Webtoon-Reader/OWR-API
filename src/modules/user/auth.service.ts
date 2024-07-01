import {Injectable} from "@nestjs/common";
import {PrismaService} from "../misc/prisma.service";


@Injectable()
export class AuthService{

    constructor(
        private readonly prismaService: PrismaService,
    ){}

}
