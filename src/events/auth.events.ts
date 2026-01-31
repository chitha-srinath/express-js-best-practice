export const AuthEvents = {
  USER_REGISTERED: 'user:registered',
} as const;

export interface UserRegisteredPayload {
  id: string;
  email: string;
  name: string;
}
