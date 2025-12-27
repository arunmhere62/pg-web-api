import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CommonHeaders {
  user_id?: number;
}

export const CommonHeadersDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CommonHeaders => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;

    return {
      user_id: headers['x-user-id'] ? Number.parseInt(headers['x-user-id'], 10) : undefined,
    };
  },
);
