import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CreateSessionDto } from './auth.dto';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { Request as ExpressRequest } from 'express';
import { User } from '../types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn(),
            refreshAccess: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    userService = module.get(UserService);
  });

  describe('login', () => {
    it('should throw BadRequestException if user not found', async () => {
      userService.validateUser.mockResolvedValue(null);
      const dto: CreateSessionDto = { email: 'test@test.com', password: '123' };
      const res: Partial<Response> = { cookie: jest.fn() };

      await expect(controller.login(dto, res as Response)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.validateUser).toHaveBeenCalledWith(dto);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('should return access_token and set refresh_token cookie on success', async () => {
      const dto: CreateSessionDto = { email: 'test@test.com', password: '123' };
      const tokens = { access_token: 'access', refresh_token: 'refresh' };

      userService.validateUser.mockResolvedValue({
        email: dto.email,
        password: dto.password,
      } as User);
      authService.signIn.mockResolvedValue(tokens);

      const cookieMock = jest.fn();
      const res: Partial<Response> = { cookie: cookieMock };

      const result = await controller.login(dto, res as Response);

      expect(userService.validateUser).toHaveBeenCalledWith(dto);
      expect(authService.signIn).toHaveBeenCalledWith(dto.email);
      expect(cookieMock).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refresh_token,
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: 'strict',
          maxAge: 60 * 60 * 1000,
        }),
      );
      expect(result).toEqual({ access_token: tokens.access_token });
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshAccess with refresh token from cookies and return new access_token', async () => {
      interface RequestWithCookies extends ExpressRequest {
        cookies: { [key: string]: string };
      }
      const req: Partial<RequestWithCookies> = {
        cookies: { refresh_token: 'refreshToken' },
      };
      const accessToken = 'newAccessToken';

      authService.refreshAccess.mockResolvedValue(accessToken);

      const result = await controller.refresh(req as RequestWithCookies);

      expect(authService.refreshAccess).toHaveBeenCalledWith('refreshToken');
      expect(result).toEqual({ access_token: accessToken });
    });
  });
});
