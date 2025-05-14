import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import * as Joi from 'joi';

@Injectable()
export class AutopilotService implements OnModuleInit {
  private readonly phaseTransitionSchema = Joi.object({
    projectId: Joi.number().required(),
    phaseId: Joi.number().required(),
    phaseTypeName: Joi.string().required(),
    state: Joi.string().valid('START', 'END').required(),
    operator: Joi.string().required(),
    projectStatus: Joi.string().required(),
    date: Joi.string().isoDate().optional(),
  });

  private readonly challengeUpdateSchema = Joi.object({
    projectId: Joi.number().required(),
    challengeId: Joi.number().required(),
    status: Joi.string().required(),
    operator: Joi.string().required(),
    date: Joi.string().isoDate().optional(),
  });

  private readonly commandSchema = Joi.object({
    command: Joi.string().required(),
    operator: Joi.string().required(),
    projectId: Joi.number().optional(),
    date: Joi.string().isoDate().optional(),
  });

  constructor(private kafkaService: KafkaService) {}

  async onModuleInit() {
    await this.startConsumer();
  }

  async handlePhaseTransition(message: any) {
    const payload = message.payload || message;
    const { error } = this.phaseTransitionSchema.validate(payload);
    if (error) {
      throw new Error(`Invalid phase transition payload: ${error.message}`);
    }

    console.log('Validated phase transition:', payload);

    // Skip producing if the message is from auto_pilot to prevent loop
    if (message.originator === 'auto_pilot') {
      console.log('Skipping production for auto_pilot message');
      return;
    }

    await this.kafkaService.produce('autopilot.phase.transition', {
      timestamp: new Date().toISOString(),
      originator: 'auto_pilot',
      'mime-type': 'application/json',
      payload,
    });
  }

  async handleChallengeUpdate(message: any) {
    const payload = message.payload || message;
    const { error } = this.challengeUpdateSchema.validate(payload);
    if (error) {
      throw new Error(`Invalid challenge update payload: ${error.message}`);
    }

    console.log('Validated challenge update:', payload);
    // Placeholder for future logic
  }

  async handleCommand(message: any) {
    const payload = message.payload || message;
    const { error } = this.commandSchema.validate(payload);
    if (error) {
      throw new Error(`Invalid command payload: ${error.message}`);
    }

    console.log('Validated command:', payload);
    // Placeholder for future logic
  }

  async startConsumer() {
    await this.kafkaService.consume('autopilot.phase.transition', 'autopilot-phase-group', async ({ topic, partition, payload }) => {
      console.log(`Received phase transition on ${topic} partition ${partition}:`, payload?.payload || payload);
      try {
        await this.handlePhaseTransition(payload);
      } catch (error) {
        console.error(`Failed to handle phase transition: ${error.message}`);
      }
    });

    await this.kafkaService.consume('autopilot.challenge.update', 'autopilot-challenge-group', async ({ topic, partition, payload }) => {
      console.log(`Received challenge update on ${topic} partition ${partition}:`, payload?.payload || payload);
      try {
        await this.handleChallengeUpdate(payload);
      } catch (error) {
        console.error(`Failed to handle challenge update: ${error.message}`);
      }
    });

    await this.kafkaService.consume('autopilot.command', 'autopilot-command-group', async ({ topic, partition, payload }) => {
      console.log(`Received command on ${topic} partition ${partition}:`, payload?.payload || payload);
      try {
        await this.handleCommand(payload);
      } catch (error) {
        console.error(`Failed to handle command: ${error.message}`);
      }
    });
  }
}