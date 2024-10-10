import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from "@nestjs/common";
import UserTypes from "../models/enums/user-types";

@Injectable()
export class AdminGuard implements CanActivate{

    async canActivate(context: ExecutionContext): Promise<boolean>{
        const request = context.switchToHttp().getRequest();
        if(!request.user)
            throw new UnauthorizedException("No user provided");
        if(request.user.type !== UserTypes.ADMIN)
            throw new UnauthorizedException("User is not an admin");
        return true;
    }
}
