import { drizzleProvider } from './drizzle.provider';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

jest.mock('pg', () => ({
    Pool: jest.fn().mockImplementation(() => ({
        query: jest.fn(),
    })),
}));

jest.mock('drizzle-orm/node-postgres', () => ({
    drizzle: jest.fn(),
}));

describe('drizzleProvider', () => {
    let configService: ConfigService;

    beforeEach(() => {
        configService = { get: jest.fn() } as any;

        const PoolMock = Pool as unknown as jest.Mock;
        PoolMock.mockClear();

        const drizzleMock = drizzle as unknown as jest.Mock;
        drizzleMock.mockClear();
    });

    it('should create pool, test connection and return drizzle instance', async () => {
        (configService.get as jest.Mock).mockReturnValue('postgres://user:pass@localhost:5432/db');

        const queryMock = jest.fn().mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
        const PoolMock = Pool as unknown as jest.Mock;
        PoolMock.mockImplementation(() => ({
            query: queryMock,
        }));

        const mockDb = {};
        const drizzleMock = drizzle as unknown as jest.Mock;
        drizzleMock.mockReturnValue(mockDb);

        const provider = drizzleProvider[0];
        const result = await provider.useFactory(configService);

        expect(configService.get).toHaveBeenCalledWith('DATABASE_URL');
        expect(PoolMock).toHaveBeenCalledWith({ connectionString: 'postgres://user:pass@localhost:5432/db' });
        expect(queryMock).toHaveBeenCalledWith('SELECT 1');
        expect(drizzleMock).toHaveBeenCalled();
        expect(result).toBe(mockDb);
    });

    it('should throw if pool.query rejects', async () => {
        (configService.get as jest.Mock).mockReturnValue('postgres://user:pass@localhost:5432/db');

        const queryMock = jest.fn().mockRejectedValueOnce(new Error('Connection failed'));
        const PoolMock = Pool as unknown as jest.Mock;
        PoolMock.mockImplementation(() => ({
            query: queryMock,
        }));

        const provider = drizzleProvider[0];

        await expect(provider.useFactory(configService)).rejects.toThrow('Connection failed');

        expect(queryMock).toHaveBeenCalledWith('SELECT 1');
    });
});
