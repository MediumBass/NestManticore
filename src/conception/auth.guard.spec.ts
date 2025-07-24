import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() } as any;
    guard = new AuthGuard(jwtService);
  });

  function createMockExecutionContext(
    authorizationHeader?: string,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: authorizationHeader,
          },
        }),
      }),
    } as any;
  }

  it('should throw UnauthorizedException if no authorization header', async () => {
    const ctx = createMockExecutionContext(undefined);

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if authorization header is invalid', async () => {
    const ctx = createMockExecutionContext('InvalidToken');

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if jwt verification fails', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('fail'));
    const ctx = createMockExecutionContext('Bearer validtoken');

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
