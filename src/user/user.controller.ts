import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { AuthGuard } from '../conception/auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  @Post('')
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.register(dto);
  }

  @UseGuards(AuthGuard)
  @Get('')
  showUserInformation(@Req() req: Request) {
    const token = req.headers['authorization']?.split(' ')[1];
    const decodedToken = this.jwtService.decode(token);
    return this.userService.getFullUserData(decodedToken.email);
  }
}
