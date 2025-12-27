import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ValidatedHeaders {
  user_id?: number;
}

export const ValidatedHeaders = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ValidatedHeaders => {
    const request = ctx.switchToHttp().getRequest();
    return (request as any).validatedHeaders || {};
  },
);
