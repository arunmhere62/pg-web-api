import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from './common/dto/response.dto';

@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
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

    response.status(statusCode).json({
      statusCode,
      message,
      path: request?.url,
      timestamp: new Date().toISOString(),
    });
  }
}

@Injectable()
class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        if (data instanceof ApiResponseDto) {
          response.status(data.statusCode);
          if (!data.path) {
            data.path = request?.url;
          }
          return data;
        }

        return {
          statusCode: response.statusCode || 200,
          message: 'Success',
          data,
          path: request?.url,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Payload size limit for image uploads (50MB - images are compressed on frontend)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Global prefix
  app.setGlobalPrefix('api/web/v1');

  // Enable CORS - Allow all origins for development
  app.enableCors({
    origin: true,  // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    exposedHeaders: ['Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter - handles all errors consistently
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global response interceptor - wraps all successful responses
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Web API')
    .setDescription('Web API - Health endpoints')
    .setVersion('1.0')
    .addTag('health', 'Health check endpoints')
    .addTag('s3', 'S3 file operations')
    .addTag('organizations', 'Organization endpoints')
    .addTag('subscription-plans', 'Subscription plan endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 5002;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`⚡ Ready for multiple concurrent requests`);
}

bootstrap();
