import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { UserNoPassword, DecodedToken } from '../types';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUserService = {
    register: jest.fn(),
    getFullUserData: jest.fn(),
  };

  const mockJwtService = {
    decode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should call userService.register and return result', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'pass123',
        name: 'Test',
        personalInfo: 'AAAAA',
      };

      const expectedResult = [{ id: 1, email: 'test@example.com' }];
      userService.register.mockResolvedValue(expectedResult);

      const result = await controller.createUser(dto);
      expect(result).toEqual(expectedResult);
      expect(userService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('showUserInformation', () => {
    it('should return user data if valid token is provided', async () => {
      const mockRequest: any = {
        headers: {
          authorization: 'Bearer mock.jwt.token',
        },
      };

      const decoded: DecodedToken = {
        sub: 'user@example.com',
        iat: 5000,
        exp: 100000,
      };
      const expectedUser: UserNoPassword = {
        id: 1,
        email: 'user@example.com',
        name: 'Test User',
        personalInfo: 'AAAAA',
      };

      jwtService.decode.mockReturnValue(decoded);
      userService.getFullUserData.mockResolvedValue(expectedUser);

      const result = await controller.showUserInformation(mockRequest);
      expect(jwtService.decode).toHaveBeenCalledWith('mock.jwt.token');
      expect(userService.getFullUserData).toHaveBeenCalledWith(
        'user@example.com',
      );
      expect(result).toEqual(expectedUser);
    });

    it('should throw UnauthorizedException if no auth header', () => {
      const mockRequest: any = { headers: {} };

      expect(() => controller.showUserInformation(mockRequest)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if no auth header', () => {
      const mockRequest: any = { headers: {} };

      expect(() => controller.showUserInformation(mockRequest)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
