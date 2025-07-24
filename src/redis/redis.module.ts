import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { Redis } from 'ioredis';

@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: 'localhost', // Ваш хост Redis
          port: 6379, // Порт Redis
        });
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}