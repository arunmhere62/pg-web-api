import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLegalDocumentDto {
  @ApiProperty({ example: 'TERMS_AND_CONDITIONS' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Terms & Conditions' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'v1' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ example: 'https://example.com/terms' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  effective_date?: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  expiry_date?: string | null;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  organization_id?: number | null;
}
