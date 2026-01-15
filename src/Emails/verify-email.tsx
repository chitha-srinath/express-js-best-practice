import * as React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Heading,
    Hr,
    Tailwind,
} from '@react-email/components';

const OTPEmail = ({ otpCode, userName }: { otpCode: string; userName: string }) => {
    return (
        <Html lang="en" dir="ltr">
            <Tailwind>
                <Head />
                <Body className="bg-gray-100 font-sans py-[40px]">
                    <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
                        {/* Header */}
                        <Section className="text-center mb-[32px]">
                            <Heading className="text-[28px] font-bold text-gray-900 m-0 mb-[8px]">
                                Verification Code
                            </Heading>
                            <Text className="text-[16px] text-gray-600 m-0">
                                Your one-time password for secure access
                            </Text>
                        </Section>

                        {/* Greeting */}
                        <Section className="mb-[32px]">
                            <Text className="text-[16px] text-gray-800 m-0 mb-[16px]">
                                Hello {userName},
                            </Text>
                            <Text className="text-[16px] text-gray-700 m-0 leading-[24px]">
                                We received a request to verify your account. Please use the verification code below to complete your authentication:
                            </Text>
                        </Section>

                        {/* OTP Code Display */}
                        <Section className="text-center mb-[32px]">
                            <div className="bg-gray-50 border-[2px] border-solid border-gray-200 rounded-[12px] py-[24px] px-[32px] inline-block">
                                <Text className="text-[36px] font-bold text-gray-900 m-0 letter-spacing-[8px] font-mono">
                                    {otpCode}
                                </Text>
                            </div>
                        </Section>

                        {/* Instructions */}
                        <Section className="mb-[32px]">
                            <Text className="text-[16px] text-gray-700 m-0 mb-[16px] leading-[24px]">
                                Enter this code in the verification field to proceed. This code will expire in <strong>10 minutes</strong> for your security.
                            </Text>
                            <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                                If you didn't request this code, please ignore this email or contact our support team if you have concerns about your account security.
                            </Text>
                        </Section>

                        {/* Security Notice */}
                        <Section className="bg-blue-50 border-l-[4px] border-solid border-blue-400 p-[16px] mb-[32px]">
                            <Text className="text-[14px] text-blue-800 m-0 font-medium mb-[4px]">
                                Security Reminder
                            </Text>
                            <Text className="text-[14px] text-blue-700 m-0 leading-[20px]">
                                Never share this code with anyone. Our team will never ask for your verification code via email or phone.
                            </Text>
                        </Section>

                        <Hr className="border-gray-200 my-[32px]" />

                        {/* Footer */}
                        <Section className="text-center">
                            <Text className="text-[14px] text-gray-600 m-0 mb-[8px]">
                                Best regards,<br />
                                The Security Team
                            </Text>
                            <Text className="text-[12px] text-gray-500 m-0 mb-[16px]">
                                123 Security Street, Tech City, TC 12345
                            </Text>
                            <Text className="text-[12px] text-gray-500 m-0">
                                © {new Date().getFullYear()} Your Company Name. All rights reserved.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

OTPEmail.PreviewProps = {
    otpCode: "123456",
    userName: "John Doe",
};

export default OTPEmail;