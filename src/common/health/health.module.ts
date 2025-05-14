import { Module } from '@nestjs/common';
import { KafkaModule } from '../../kafka/kafka.module';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';

@Module({
  imports: [KafkaModule],
  providers: [HealthService],
  controllers: [HealthController],
  exports: [HealthService],
})
export class HealthModule {}