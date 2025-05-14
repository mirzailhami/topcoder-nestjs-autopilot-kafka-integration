import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { validationSchema } from './validation';

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor() {
    dotenv.config();
    this.envConfig = this.validateInput(process.env);
  }

  private validateInput(envConfig: { [key: string]: string }): { [key: string]: string } {
    const { error, value } = validationSchema.validate(envConfig);
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return value;
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}