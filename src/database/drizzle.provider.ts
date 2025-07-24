import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { InternalServerErrorException } from "@nestjs/common";
export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';
export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const user: string | undefined = configService.get('POSTGRES_USER');
      const pass: string | undefined = configService.get('POSTGRES_PASSWORD');
      const db: string | undefined = configService.get('POSTGRES_DB');
      const port: number | undefined = configService.get('POSTGRES_PORT');
      const host: string = configService.get('POSTGRES_HOST', 'localhost');
      if (!user || !pass || !db || !port || !host)
        throw new InternalServerErrorException(
          'Missing required environment variables: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT, POSTGRES_HOST',
        );
      const connectionString = `postgresql://${user}:${pass}@${host}:${port}/${db}`;
      const pool = new Pool({
        connectionString,
      });
      await pool.query('SELECT 1'); // throws if connection fails

      return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
    },
  },
];
