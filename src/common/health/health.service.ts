import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';

@Injectable()
export class HealthService {
  constructor(private kafkaService: KafkaService) {}

  async checkHealth() {
    return {
      status: 'ok',
      kafka: 'connected', // TODO: Implement actual Kafka connection check
      timestamp: new Date().toISOString(),
    };
  }
}