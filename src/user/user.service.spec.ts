import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DrizzleAsyncProvider } from '../database/drizzle.provider';
import { CreateUserDto } from './user.dto';
import { CreateSessionDto } from '../auth/auth.dto';
import { hash, compare } from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let dbMock: any;

  beforeEach(async () => {
    dbMock = {
      query: {
        users: {
          findFirst: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: DrizzleAsyncProvider,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('register', () => {
    const dto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test',
      password: 'password123',
      personalInfo: '',
    };

    it('should throw ConflictException if user already exists', async () => {
      dbMock.query.users.findFirst.mockResolvedValue(dto);
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerError if SALT_ROUNDS is invalid', async () => {
      dbMock.query.users.findFirst.mockResolvedValue(undefined);
      process.env.SALT_ROUNDS = 'not-a-number';

      await expect(service.register(dto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should create a user and return id/email', async () => {
      dbMock.query.users.findFirst.mockResolvedValue(undefined);
      (hash as jest.Mock).mockResolvedValue('hashed_password');
      process.env.SALT_ROUNDS = '10';

      const result = [{ id: 1, email: dto.email }];
      dbMock.returning.mockResolvedValue(result);

      const res = await service.register(dto);
      expect(res).toEqual(result);
      expect(hash).toHaveBeenCalledWith(dto.password, 10);
    });
  });

  describe('getFullUserData', () => {
    it('should throw ConflictException if user not found', async () => {
      dbMock.query.users.findFirst.mockResolvedValue(undefined);
      await expect(service.getFullUserData('notfound@example.com')).rejects.toThrow(ConflictException);
    });

    it('should return user without password', async () => {
      const user = {
        id: 1,
        email: 'user@example.com',
        name: 'User',
        personalInfo: 'info',
        password: 'secret',
      };

      dbMock.query.users.findFirst.mockResolvedValue(user);

      const res = await service.getFullUserData(user.email);
      expect(res).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        personalInfo: user.personalInfo,
      });
    });
  });

  describe('validateUser', () => {
    const dto: CreateSessionDto = {
      email: 'login@example.com',
      password: 'pass123',
    };

    it('should return null if user not found', async () => {
      dbMock.query.users.findFirst.mockResolvedValue(undefined);
      const result = await service.validateUser(dto);
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      dbMock.query.users.findFirst.mockResolvedValue({
        ...dto,
        password: 'hashed_pw',
      });

      (compare as jest.Mock).mockResolvedValue(false);
      const result = await service.validateUser(dto);
      expect(result).toBeNull();
    });

    it('should return user if password is valid', async () => {
      const user = {
        ...dto,
        name: 'Test User',
        personalInfo: '',
        password: 'hashed_pw',
      };

      dbMock.query.users.findFirst.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(dto);
      expect(result).toEqual(user);
    });
  });
});