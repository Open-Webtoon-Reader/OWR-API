import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class AdminGuard implements CanActivate{
    constructor(
        private readonly configService: ConfigService,
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean>{
        const adminKey = this.configService.get("ADMIN_KEY");
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split(" ")[1];
        if(!token)
            throw new UnauthorizedException("No token provided");
        if(token !== adminKey)
            throw new UnauthorizedException("Invalid token");
        return true;
    }
}
