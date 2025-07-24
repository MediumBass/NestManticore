import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateSessionDto } from './auth.dto';
import { Response, Request } from 'express';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: CreateSessionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ access_token: string }> {
    const user = await this.userService.validateUser(dto);
    if (!user) throw new BadRequestException('Wrong email or password');
    const { access_token, refresh_token } = await this.authService.signIn(
      user.email,
    );

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return { access_token };
  }

  @Post('refresh')
  async refresh(@Req() req: Request): Promise<{ access_token: string }> {
    const cookieToken: string = req.cookies?.refresh_token;
    const access_token: string =
      await this.authService.refreshAccess(cookieToken);

    return { access_token };
  }
}
