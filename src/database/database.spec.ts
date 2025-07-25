import { drizzleProvider } from './drizzle.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Test } from '@nestjs/testing';

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
  })),
}));

jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn(),
}));

describe('drizzleProvider ', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
      providers: [ConfigService],
    }).compile();

    configService = moduleRef.get(ConfigService);

    const PoolMock = Pool as unknown as jest.Mock;
    PoolMock.mockClear();

    const drizzleMock = drizzle as unknown as jest.Mock;
    drizzleMock.mockClear();
  });

  it('should create pool, test connection and return drizzle instance', async () => {
    const user: string | undefined = configService.get('POSTGRES_USER');
    const pass: string | undefined = configService.get('POSTGRES_PASSWORD');
    const db: string | undefined = configService.get('POSTGRES_DB');
    const port: number | undefined = configService.get('POSTGRES_PORT');
    const host: string = configService.get('POSTGRES_HOST', 'localhost');

    const dbUrl = `postgresql://${user}:${pass}@${host}:${port}/${db}`;

    const queryMock = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    const PoolMock = Pool as unknown as jest.Mock;
    PoolMock.mockImplementation(() => ({ query: queryMock }));

    const mockDb = {};
    const drizzleMock = drizzle as unknown as jest.Mock;
    drizzleMock.mockReturnValue(mockDb);

    const provider = drizzleProvider[0];
    const result = await provider.useFactory(configService);

    expect(PoolMock).toHaveBeenCalledWith({
      connectionString: dbUrl,
    });
    expect(queryMock).toHaveBeenCalledWith('SELECT 1');
    expect(result).toBe(mockDb);
  });

  it('should throw if pool.query rejects', async () => {
    const queryMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('Connection failed'));
    const PoolMock = Pool as unknown as jest.Mock;
    PoolMock.mockImplementation(() => ({ query: queryMock }));

    const provider = drizzleProvider[0];

    await expect(provider.useFactory(configService)).rejects.toThrow(
      'Connection failed',
    );
    expect(queryMock).toHaveBeenCalledWith('SELECT 1');
  });
});
