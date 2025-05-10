import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async setValue(key: string, value: string, expirationSeconds: number) {
    await this.redis.set(key, value, 'EX', expirationSeconds);
  }

  async getValue(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async deleteValue(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
