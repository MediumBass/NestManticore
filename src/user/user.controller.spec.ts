import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../conception/auth.guard';

describe('UserController (integration)', () => {
  let app: INestApplication;
  const mockUserService = {
    register: jest.fn(),
    getFullUserData: jest.fn(),
  };

  const mockJwtService = {
    decode: jest.fn(),
  };

  // Custom AuthGuard mock that just allows requests to pass through
  class MockAuthGuard {
    canActivate(context) {
      const req = context.switchToHttp().getRequest();
      req.headers['authorization'] = 'Bearer mocked_token'; // Inject fake token
      return true;
    }
  }

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /user', () => {
    it('should create a user', async () => {
      const dto = { email: 'test@example.com', password: '123456' };
      const createdUser = [{ id: 1, email: dto.email }];
      mockUserService.register.mockResolvedValue(createdUser);

      const response = await request(app.getHttpServer())
        .post('/user')
        .send(dto)
        .expect(201);

      expect(response.body).toEqual(createdUser);
      expect(mockUserService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('GET /user', () => {
    it('should return 401 if no Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .expect(401);

      expect(response.body.message).toBe('Invalid Authorization header');
    });
    it('should return user info from token', async () => {
      const decoded = { sub: 42 };
      const userData = { id: 42, email: 'test@example.com' };

      mockJwtService.decode.mockReturnValue(decoded);
      mockUserService.getFullUserData.mockResolvedValue(userData);

      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', 'Bearer mocked_token')
        .expect(200);

      expect(response.body).toEqual(userData);
      expect(mockJwtService.decode).toHaveBeenCalledWith('mocked_token');
      expect(mockUserService.getFullUserData).toHaveBeenCalledWith(42);
    });
  });
});
