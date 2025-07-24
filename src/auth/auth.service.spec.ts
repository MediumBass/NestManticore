import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            setRefreshToken: jest.fn(),
            getRefreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    redisService = module.get(RedisService);
  });

  describe('signIn', () => {
    it('should sign tokens and store refresh token', async () => {
      const email = 'test@example.com';
      const fakeAccessToken = 'access-token';
      const fakeRefreshToken = 'refresh-token';

      jwtService.signAsync
        .mockResolvedValueOnce(fakeAccessToken)
        .mockResolvedValueOnce(fakeRefreshToken);
      redisService.setRefreshToken.mockResolvedValue(undefined);

      const result = await service.signIn(email);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: email },
        { expiresIn: '1m' },
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: email },
        { expiresIn: '1h' },
      );
      expect(redisService.setRefreshToken).toHaveBeenCalledWith(
        email,
        fakeRefreshToken,
      );
      expect(result).toEqual({
        access_token: fakeAccessToken,
        refresh_token: fakeRefreshToken,
      });
    });
  });

  describe('refreshAccess', () => {
    it('should throw UnauthorizedException if no token in redis or tokens mismatch', async () => {
      const cookieToken = 'cookie-token';
      const decodedToken = { sub: 'user@example.com' };

      jwtService.decode.mockReturnValue(decodedToken);
      redisService.getRefreshToken.mockResolvedValue(null);

      await expect(service.refreshAccess(cookieToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // test mismatch
      redisService.getRefreshToken.mockResolvedValue('different-token');
      await expect(service.refreshAccess(cookieToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new access token if refresh token valid', async () => {
      const cookieToken = 'cookie-token';
      const decodedToken = { sub: 'user@example.com' };
      const newAccessToken = 'new-access-token';

      jwtService.decode.mockReturnValue(decodedToken);
      redisService.getRefreshToken.mockResolvedValue(cookieToken);
      jwtService.signAsync.mockResolvedValue(newAccessToken);

      const result = await service.refreshAccess(cookieToken);

      expect(jwtService.decode).toHaveBeenCalledWith(cookieToken);
      expect(redisService.getRefreshToken).toHaveBeenCalledWith(
        decodedToken.sub,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: decodedToken.sub },
        { expiresIn: '1m' },
      );
      expect(result).toBe(newAccessToken);
    });
  });
});
