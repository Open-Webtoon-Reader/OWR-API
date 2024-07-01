import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from "@nestjs/common";
import {AuthService} from "../auth.service";


@Injectable()
export class AuthGuard implements CanActivate{
    constructor(
        private readonly authService: AuthService,
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean>{
        const request = context.switchToHttp().getRequest();
        const sessionUUID = request.cookies.session;
        if(!sessionUUID)
            throw new UnauthorizedException("No session provided");
        const user = await this.authService.verifySession(sessionUUID);
        if(!user)
            throw new UnauthorizedException("Invalid session");
        request.user = user;
        return true;
    }
}
