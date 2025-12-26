import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';
import { permissions_master_action } from '@prisma/client-consumer';

export class BulkUpsertPermissionsDto {
  @ApiProperty({ example: 'tenants' })
  @IsString()
  @IsNotEmpty()
  screen_name: string;

  @ApiProperty({
    isArray: true,
    enum: permissions_master_action,
    example: [permissions_master_action.VIEW, permissions_master_action.EDIT],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(permissions_master_action, { each: true })
  actions: permissions_master_action[];

  @ApiPropertyOptional({ example: 'Allows managing tenants' })
  @IsOptional()
  @IsString()
  description?: string;
}
