import { SetMetadata } from '@nestjs/common';
import { REQUIRED_HEADERS_KEY, RequiredHeadersOptions } from '../guards/headers-validation.guard';

export const RequireHeaders = (options: RequiredHeadersOptions = {}) =>
  SetMetadata(REQUIRED_HEADERS_KEY, options);
