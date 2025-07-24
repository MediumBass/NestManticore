import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { DecodedToken } from '../types';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async signIn(email: string) {
    const payload = { sub: email };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '1m',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    await this.redisService.setRefreshToken(email, refresh_token);

    return { access_token, refresh_token };
  }

  async refreshAccess(cookieToken: string) {
    const decodedToken: DecodedToken = this.jwtService.decode(cookieToken);
    const redisToken: string | null = await this.redisService.getRefreshToken(
      decodedToken.sub,
    );
    if (!redisToken || redisToken !== cookieToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const payload = { sub: decodedToken.sub };
    return this.jwtService.signAsync(payload, { expiresIn: '1m' });
  }
}
