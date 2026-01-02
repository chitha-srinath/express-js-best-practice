import { AsyncLocalStorage } from 'async_hooks';
import { UserDetails, UserSession } from '../interface/user.interface';
import { ZodType } from 'zod/v4';

// Define the shape of the context
interface UserContextData {
  user: UserDetails;
  session: UserSession;
}

export type PayloadSchemaMap = {
  body?: ZodType<unknown>;
  params?: ZodType<unknown>;
  query?: ZodType<unknown>;
};

export interface RequestContextData<B, P, Q> {
  body?: B;
  params?: P;
  query?: Q;
}

// Singleton AsyncLocalStorage instance
const userContextStorage = new AsyncLocalStorage<UserContextData>();
const requestContextStorage = new AsyncLocalStorage<
  RequestContextData<unknown, unknown, unknown>
>();

export const UserContext = {
  run: <T>(context: UserContextData, callback: () => T): T => {
    return userContextStorage.run(context, callback);
  },
  getUser: (): UserDetails | undefined => {
    const store = userContextStorage.getStore();
    return store?.user;
  },
  getSession: (): UserSession | undefined => {
    const store = userContextStorage.getStore();
    return store?.session;
  },
  setUser: (user: UserDetails): void => {
    const store = userContextStorage.getStore();
    if (store && store.user) {
      store.user = user;
    }
  },
  setSession: (session: UserSession): void => {
    const store = userContextStorage.getStore();
    if (store && store.session) {
      store.session = session;
    }
  },
};

export const RequestContext = {
  run: (context: RequestContextData<unknown, unknown, unknown>, callback: () => void): void => {
    requestContextStorage.run(context, callback);
  },

  getBody: <T>(): T | undefined => {
    return requestContextStorage.getStore()?.body as T | undefined;
  },

  getParams: <P>(): P | undefined => {
    return requestContextStorage.getStore()?.params as P | undefined;
  },

  getQuery: <Q>(): Q | undefined => {
    return requestContextStorage.getStore()?.query as Q | undefined;
  },
};
