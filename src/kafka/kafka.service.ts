import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer, Partitioners } from 'kafkajs';
import { ConfigService } from '../config/configuration';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get('KAFKA_BROKERS').split(',');
    console.log('Connecting to Kafka brokers:', brokers);
    this.kafka = new Kafka({
      clientId: this.configService.get('KAFKA_CLIENT_ID'),
      brokers,
      retry: {
        retries: 10,
        initialRetryTime: 1000,
      },
    });
    this.producer = this.kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.createTopics({
        topics: [
          { topic: 'autopilot.phase.transition', numPartitions: 1, replicationFactor: 1 },
          { topic: 'autopilot.challenge.update', numPartitions: 1, replicationFactor: 1 },
          { topic: 'autopilot.command', numPartitions: 1, replicationFactor: 1 },
        ],
      });
      await admin.disconnect();
    } catch (error) {
      console.error('Failed to initialize Kafka:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }
  }

  async produce(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
    } catch (error) {
      throw new Error(`Failed to produce message to ${topic}: ${error.message}`);
    }
  }

  async consume(topic: string, groupId: string, handler: (args: { topic: string; partition: number; message: any; payload: any }) => Promise<void>) {
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
    this.consumers.set(`${topic}-${groupId}`, consumer); // Unique key for each consumer
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });
    console.log(`Subscribed to topic: ${topic} with groupId: ${groupId}`);
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = message.value ? JSON.parse(message.value.toString()) : null;
          console.log(`Processing message from ${topic} on partition ${partition}`);
          await handler({ topic, partition, message, payload });
        } catch (error) {
          console.error(`Error processing message from ${topic}: ${error.message}`);
        }
      },
    });
  }
}