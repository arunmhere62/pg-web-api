import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateLegalDocumentDto {
  @ApiPropertyOptional({ example: 'TERMS_AND_CONDITIONS' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Terms & Conditions' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'v2' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 'https://example.com/terms' })
  @IsOptional()
  @IsString()
  url?: string;

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
