import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-consumer';

const globalForConsumerPrisma = global as unknown as {
  consumerPrisma?: ConsumerPrismaService;
};

@Injectable()
export class ConsumerPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const existing = globalForConsumerPrisma.consumerPrisma;
    if (existing) {
      return existing;
    }

    super({
      datasources: {
        db: {
          url: process.env.DATABASE_CONSUMER_URL,
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForConsumerPrisma.consumerPrisma = this;
    }
  }

  async onModuleInit() {
    if (!process.env.DATABASE_CONSUMER_URL) {
      throw new Error('DATABASE_CONSUMER_URL is not set');
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
