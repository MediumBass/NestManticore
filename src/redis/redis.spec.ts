import { RedisService } from './redis.service';
import { Redis } from 'ioredis';

describe('RedisService', () => {
    let service: RedisService;
    let redisClient: jest.Mocked<Redis>;

    beforeEach(() => {
        redisClient = {
            set: jest.fn(),
            get: jest.fn(),
        } as unknown as jest.Mocked<Redis>;

        service = new RedisService(redisClient);
    });

    describe('setRefreshToken', () => {
        it('should call redis.set with correct key, token and expiration', async () => {
            redisClient.set.mockResolvedValue('OK');

            await service.setRefreshToken('user123', 'tokenValue', 3600);

            expect(redisClient.set).toHaveBeenCalledWith('refresh:user123', 'tokenValue', 'EX', 3600);
        });

        it('should use default ttlSeconds if not provided', async () => {
            redisClient.set.mockResolvedValue('OK');

            await service.setRefreshToken('user123', 'tokenValue');

            expect(redisClient.set).toHaveBeenCalledWith('refresh:user123', 'tokenValue', 'EX', 3600);
        });
    });

    describe('getRefreshToken', () => {
        it('should return token from redis.get', async () => {
            redisClient.get.mockResolvedValue('tokenValue');

            const result = await service.getRefreshToken('user123');

            expect(redisClient.get).toHaveBeenCalledWith('refresh:user123');
            expect(result).toBe('tokenValue');
        });

        it('should return null if redis.get returns null', async () => {
            redisClient.get.mockResolvedValue(null);

            const result = await service.getRefreshToken('user123');

            expect(result).toBeNull();
        });
    });
});
