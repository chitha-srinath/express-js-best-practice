import { appEventEmitter } from '../events/event-emitter';
import { AuthEvents, UserRegisteredPayload } from '../events/auth.events';
import { VerificationService } from '../services/verification.service';

const verificationService = new VerificationService();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
appEventEmitter.on(AuthEvents.USER_REGISTERED, async (payload: UserRegisteredPayload) => {
  try {
    const { email, name, id } = payload;
    // eslint-disable-next-line no-console
    console.log(`[AuthSubscriber] Processing USER_REGISTERED event for ${email}`);
    await verificationService.handleEmailVerification(email, name, id);
    // eslint-disable-next-line no-console
    console.log(`[AuthSubscriber] Verification processing completed for ${email}`);
  } catch (error) {
    console.error(
      `[AuthSubscriber] Error processing USER_REGISTERED event for ${payload.email}:`,
      error,
    );
  }
});
