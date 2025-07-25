import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CreateSessionDto } from './auth.dto';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
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

    authService = moduleRef.get(AuthService);
    userService = moduleRef.get(UserService);

    app = moduleRef.createNestApplication();
    app.use(cookieParser()); // Required to parse cookies in requests
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    const url = '/auth/login';

    it('should return 400 if user is not valid', async () => {
      userService.validateUser.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post(url)
        .send({ email: 'invalid@test.com', password: 'wrongpass' })
        .expect(400);
    });

    it('should return access_token and set refresh_token cookie', async () => {
      const dto: CreateSessionDto = { email: 'test@test.com', password: '123' };
      const tokens = { access_token: 'access123', refresh_token: 'refresh123' };

      userService.validateUser.mockResolvedValue({ email: dto.email } as any);
      authService.signIn.mockResolvedValue(tokens);

      const response = await request(app.getHttpServer())
        .post(url)
        .send(dto)
        .expect(201);

      expect(response.body).toEqual({ access_token: 'access123' });
      const setCookies = response.get('Set-Cookie');
      expect(setCookies).toBeDefined();

      const cookie = setCookies?.[0] ?? '';
      expect(cookie).toContain('refresh_token=refresh123');
      expect(cookie).toContain('refresh_token=refresh123');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Strict');
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should return new access_token using refresh_token cookie', async () => {
      authService.refreshAccess.mockResolvedValue('new-access-token');

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refresh_token=refresh123')
        .expect(201); // or 200

      expect(authService.refreshAccess).toHaveBeenCalledWith('refresh123');
      expect(response.body).toEqual({ access_token: 'new-access-token' });
    });
  });
});
