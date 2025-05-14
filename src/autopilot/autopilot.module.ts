import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KafkaModule } from '../kafka/kafka.module';
import { ConfigModule } from '../config/config.module';
import { AutopilotService } from './autopilot.service';
import { AuthService } from './auth.service';

@Module({
  imports: [HttpModule, KafkaModule, ConfigModule],
  providers: [AutopilotService, AuthService],
  exports: [AutopilotService, AuthService],
})
export class AutopilotModule {}