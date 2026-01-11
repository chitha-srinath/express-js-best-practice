import { ErrorMessages } from '../constants/error-messages.constatnts';
import { NotFoundError } from './ErrorUtility';
import { RequestContext, UserContext } from './user-context';

export function getPayloadFromContext<T, P, Q>(): T & P & Q & { userId: string } {
  const userId = UserContext.getUser()?.id;
  if (!userId) {
    throw new NotFoundError(ErrorMessages.USER.USER_NOT_FOUND);
  }

  const body = RequestContext.getBody<T>();
  const params = RequestContext.getParams<P>();
  const query = RequestContext.getQuery<Q>();

  return {
    ...(body ?? {}),
    ...(params ?? {}),
    ...(query ?? {}),
    userId,
  } as unknown as T & P & Q & { userId: string };
}
