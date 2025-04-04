import {Exclude} from "class-transformer";

export class UserEntity{
    id: string;
    username: string;
    email: string;
    avatar: string;
    admin: boolean;

    @Exclude()
    password: string;

    @Exclude()
    jwtId: string;

    constructor(partial: Partial<UserEntity>){
        Object.assign(this, partial);
    }
}
