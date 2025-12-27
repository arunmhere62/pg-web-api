import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTicketDto {
  @ApiPropertyOptional({ example: 'OPEN' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Resolved by restarting the app' })
  @IsOptional()
  @IsString()
  resolution?: string;
}
