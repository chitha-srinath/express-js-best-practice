import { Request, Response, NextFunction } from 'express';
import z from 'zod/v4';
import { PayloadError } from '../Utilities/ErrorUtility';
import { PayloadSchemaMap, RequestContext, RequestContextData } from '../Utilities/user-context';

export function validatePayload<S extends PayloadSchemaMap>(schemas: S) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const context = {} as RequestContextData<unknown, unknown, unknown>;

      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        context.body = parsed;
      }

      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        context.params = parsed;
      }

      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        context.query = parsed;
      }

      RequestContext.run(context, next);
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(new PayloadError(err.issues[0]?.message ?? 'Payload validation failed'));
      } else {
        next(err);
      }
    }
  };
}
