import { Resend } from 'resend';
import { env } from '../config/config';
import OTPEmail from '../Emails/verify-email';


export class EmailService {
    private resend: Resend;

    constructor() {
        this.resend = new Resend(env.RESEND_API_KEY);
    }

    async sendEmailVerification(username: string, email: string, otp: string): Promise<void> {
        try {
            if (!env.RESEND_API_KEY) {
                console.warn('RESEND_API_KEY is not set. Email not sent.');
                console.log(`[MOCK EMAIL] To: ${email}, OTP: ${otp}`);
                return;
            }

            await this.resend.emails.send({
                from: 'onboarding@resend.dev',
                to: email,
                subject: 'Verify your email',
                react: <OTPEmail otpCode={otp} userName={username} />,
            });
        } catch (error: unknown) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send verification email');
        }
    }
}


