import {
    Body,
    ConflictException,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {UsersService} from "../../users/users.service";
import {UserEntity} from "../../users/models/entities/user.entity";
import {CreateUserDto} from "../../users/models/dto/create-user.dto";
import {HttpStatusCode} from "axios";
import {User} from "../../users/decorators/user.decorator";
import {ChangePasswordDto} from "../../users/models/dto/change-password.dto";

@Controller("admin/users")
@ApiTags("Admin users")
@UseGuards(AuthGuard("admin-jwt"))
export class AdminUsersController{
    constructor(
        private readonly usersService: UsersService,
    ){}

    @Get("")
    @ApiBearerAuth()
    async getUsers(): Promise<UserEntity[]>{
        return this.usersService.getUsers();
    }

    @Post("new")
    @ApiBearerAuth()
    async createUser(@Body() user: CreateUserDto): Promise<UserEntity>{
        return this.usersService.createUser(user);
    }

    @Delete(":id")
    @ApiBearerAuth()
    @HttpCode(HttpStatusCode.NoContent)
    async deleteUser(@User() user: UserEntity, @Param("id") userId: string): Promise<void>{
        if(user.id === userId)
            throw new ConflictException("You cannot delete your own account");
        return this.usersService.deleteUserById(userId);
    }

    @Patch(":id/password")
    @ApiBearerAuth()
    @HttpCode(HttpStatusCode.NoContent)
    async setUserPassword(@User() user: UserEntity, @Body() changePasswordDto: ChangePasswordDto, @Param("id") userId: string): Promise<void>{
        if(user.id === userId)
            throw new ConflictException("You cannot change your own password through this endpoint. Use the user profile endpoint instead.");
        return this.usersService.changeUserPassword(userId, changePasswordDto.newPassword);
    }
}
