import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { KafkaModule } from './kafka/kafka.module';
import { AutopilotModule } from './autopilot/autopilot.module';
import { HealthModule } from './common/health/health.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule, KafkaModule, AutopilotModule, HealthModule, AuthModule],
})
export class AppModule {}
