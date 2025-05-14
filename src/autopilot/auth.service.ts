import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '../config/configuration';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAuthToken(service: 'kafka' | 'topcoder'): Promise<string> {
    const url = this.configService.get(`AUTH_${service.toUpperCase()}_API_URL`);
    const clientId = this.configService.get(`AUTH_${service.toUpperCase()}_CLIENT_ID`);
    const clientSecret = this.configService.get(`AUTH_${service.toUpperCase()}_CLIENT_SECRET`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${url}/token`,
          {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
      return response.data.access_token;
    } catch (error) {
      throw new Error(`Failed to obtain ${service} auth token: ${error.message}`);
    }
  }
}