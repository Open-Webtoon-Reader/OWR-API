import {ApiProperty} from "@nestjs/swagger";


export class UserEntity{
    @ApiProperty()
        id: number;
    @ApiProperty()
        email: string;
    @ApiProperty()
        username: string;
    @ApiProperty()
        avatar_sum: string;
    @ApiProperty()
        type: string;
    @ApiProperty()
        created_at: Date;
    @ApiProperty()
        updated_at: Date;

    constructor(
        id: number,
        email: string,
        username: string,
        avatar_sum: string,
        type: string,
        created_at: Date,
        updated_at: Date
    ){
        this.id = id;
        this.email = email;
        this.username = username;
        this.avatar_sum = avatar_sum;
        this.type = type;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}
