import {Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import {UserEntity} from "../models/entities/user.entity";
import {UsersService} from "../users.service";
import {ExtractJwt, Strategy} from "passport-jwt";
import {PassportStrategy} from "@nestjs/passport";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        private readonly usersService: UsersService,
    ){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.APP_SECRET,
            issuer: "OWR",
            algorithms: ["HS512"],
        });
    }

    async validate(payload: any): Promise<UserEntity>{
        console.log(payload);
        const user: UserEntity = await this.usersService.getUserById(payload.sub);
        if(!user)
            throw new NotFoundException("User not found");
        if(user.jwtId !== payload.jti)
            throw new UnauthorizedException("Invalid token");
        return user;
    }
}
