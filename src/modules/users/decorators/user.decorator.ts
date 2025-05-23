import {createParamDecorator, ExecutionContext} from "@nestjs/common";
import {UserEntity} from "../models/entities/user.entity";

export const User = createParamDecorator(
    (_: unknown, ctx: ExecutionContext): UserEntity => {
        const request: any = ctx.switchToHttp().getRequest();
        if(request.user.user)
            return request.user.user as UserEntity;
        return request.user as UserEntity;
    },
);
