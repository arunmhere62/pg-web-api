import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { S3Module } from './s3/s3.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';

@Module({
  imports: [PrismaModule, S3Module, OrganizationsModule, SubscriptionPlansModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
