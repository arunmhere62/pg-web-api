import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-management';

const globalForManagementPrisma = global as unknown as {
  managementPrisma?: ManagementPrismaService;
};

@Injectable()
export class ManagementPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const existing = globalForManagementPrisma.managementPrisma;
    if (existing) {
      return existing;
    }

    super({
      datasources: {
        db: {
          url: process.env.DATABASE_MANAGEMENT_URL,
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForManagementPrisma.managementPrisma = this;
    }
  }

  async onModuleInit() {
    if (!process.env.DATABASE_MANAGEMENT_URL) {
      throw new Error('DATABASE_MANAGEMENT_URL is not set');
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
