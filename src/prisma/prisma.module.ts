import { Global, Module } from '@nestjs/common';
import { ConsumerPrismaService } from './consumer-prisma.service';
import { ManagementPrismaService } from './management-prisma.service';

@Global()
@Module({
  providers: [ConsumerPrismaService, ManagementPrismaService],
  exports: [ConsumerPrismaService, ManagementPrismaService],
})
export class PrismaModule {}
