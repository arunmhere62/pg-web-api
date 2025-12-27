import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CommonHeadersDto } from '../dto/common-headers.dto';

export const REQUIRED_HEADERS_KEY = 'requiredHeaders';

export interface RequiredHeadersOptions {
  user_id?: boolean;
}

@Injectable()
export class HeadersValidationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    const requiredHeaders = this.reflector.getAllAndOverride<RequiredHeadersOptions>(
      REQUIRED_HEADERS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const headerData = {
      user_id: headers['x-user-id'] ? Number.parseInt(headers['x-user-id'], 10) : undefined,
    };

    const headersDto = plainToClass(CommonHeadersDto, headerData);
    const errors = await validate(headersDto);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new BadRequestException(`Invalid headers: ${errorMessages}`);
    }

    if (requiredHeaders) {
      const missingHeaders: string[] = [];

      if (requiredHeaders.user_id && !headerData.user_id) {
        missingHeaders.push('x-user-id');
      }

      if (missingHeaders.length > 0) {
        throw new BadRequestException(
          `Missing required headers: ${missingHeaders.join(', ')}`,
        );
      }
    }

    (request as any).validatedHeaders = headerData;

    return true;
  }
}
