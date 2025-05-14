import { Module } from '@nestjs/common';
import { ConfigService } from './configuration';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}