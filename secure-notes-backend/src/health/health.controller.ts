import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      async () => {
        try {
          // Redis ping simulation via cache manager
          await this.cacheManager.set('ping', 'pong', 1000);
          const val = await this.cacheManager.get('ping');
          return { redis: { status: val === 'pong' ? 'up' : 'down' } };
        } catch (e) {
          return { redis: { status: 'down', message: e.message } };
        }
      },
    ]);
  }
}
