import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; app: string; timestamp: string } {
    return {
      status: 'online',
      app: 'Krumly Manager API',
      timestamp: new Date().toISOString(),
    };
  }
}
