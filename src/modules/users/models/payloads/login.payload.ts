import {UserEntity} from "../entities/user.entity";

export class LoginPayload{
    user: UserEntity;
    token: string;
}
