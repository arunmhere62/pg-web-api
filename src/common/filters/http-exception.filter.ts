import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponseDto } from '../dto/response.dto';
import { getApiMs, getPerfStore, shouldIncludePerf } from '../utils/performance-context';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse?.message) {
        message = Array.isArray(exceptionResponse.message)
          ? 'Validation failed'
          : exceptionResponse.message;
      }
    } else if (exception?.message) {
      message = exception.message;
    }

    const includePerf = shouldIncludePerf();
    const store = includePerf ? getPerfStore() : undefined;
    const apiMs = includePerf ? getApiMs() : undefined;
    const meta =
      includePerf && store && typeof apiMs === 'number'
        ? {
            apiMs: Number(apiMs.toFixed(2)),
            dbMs: Number(store.dbMs.toFixed(2)),
            dbQueries: store.dbQueries,
          }
        : undefined;

    const apiResponse = new ApiResponseDto(statusCode, message, undefined, undefined, request?.url, meta);

    response.status(statusCode).json(apiResponse);
  }
}
