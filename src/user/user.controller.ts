import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { AuthGuard } from '../conception/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { DecodedToken, UserNoPassword } from '../types';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  @Post('')
  createUser(
    @Body() dto: CreateUserDto,
  ): Promise<{ id: number; email: string }[]> {
    return this.userService.register(dto);
  }

  @UseGuards(AuthGuard)
  @Get('')
  showUserInformation(@Req() req: Request): Promise<UserNoPassword> {
    if (
      typeof req.headers['authorization'] !== 'string'
    )
      throw new UnauthorizedException('Invalid Authorization header');
    const token: string = req.headers['authorization']?.split(' ')[1];
    const decodedToken: DecodedToken = this.jwtService.decode(token);
    return this.userService.getFullUserData(decodedToken.sub);
  }
}
