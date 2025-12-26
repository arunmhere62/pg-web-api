import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly smsApiUrl: string;
  private readonly smsUser: string;
  private readonly smsPassword: string;
  private readonly smsSenderId: string;
  private readonly smsChannel: string;
  private readonly smsRoute: string;

  constructor() {
    this.smsApiUrl = process.env.SMS_API_URL ?? 'http://cannyinfotech.in/api/mt/SendSMS';
    this.smsUser = process.env.SMS_API_USER ?? 'SATZTECHNOSOLUTIONS';
    this.smsPassword = process.env.SMS_API_PASSWORD ?? 'demo1234';
    this.smsSenderId = process.env.SMS_SENDER_ID ?? 'SATZTH';
    this.smsChannel = process.env.SMS_CHANNEL ?? 'Trans';
    this.smsRoute = process.env.SMS_ROUTE ?? '10';
  }

  private isBypassEnabled() {
    return process.env.NODE_ENV !== 'production';
  }

  private sanitizePhone(phoneNumber: string) {
    return String(phoneNumber ?? '').replace(/[^0-9]/g, '');
  }

  private normalizeForProvider(phoneNumber: string) {
    const digits = this.sanitizePhone(phoneNumber);
    if (!digits) return '';

    // Common India formats:
    // +91XXXXXXXXXX -> 91XXXXXXXXXX
    // 91XXXXXXXXXX  -> 91XXXXXXXXXX
    // XXXXXXXXXX    -> XXXXXXXXXX
    // Some gateways expect 10-digit mobile number.
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }

    return digits;
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const sanitizedNumber = this.normalizeForProvider(phoneNumber);
      const bypass = this.isBypassEnabled();

      if (!sanitizedNumber) {
        this.logger.error('Phone number is empty after sanitization');
        return false;
      }

      if (!this.smsUser || !this.smsPassword) {
        const msg = 'SMS credentials missing (SMS_API_USER / SMS_API_PASSWORD)';
        if (bypass) {
          this.logger.warn(`${msg}. Bypass enabled, not sending SMS. OTP: ${otp}`);
          return true;
        }

        this.logger.error(msg);
        return false;
      }

      const message = `Your OTP number for registration is ${otp}. Please verify your OTP - SATZ/TNYADAVS.COM`;

      const url = new URL(this.smsApiUrl);
      url.searchParams.append('user', this.smsUser);
      url.searchParams.append('password', this.smsPassword);
      url.searchParams.append('senderid', this.smsSenderId);
      url.searchParams.append('channel', this.smsChannel);
      url.searchParams.append('DCS', '0');
      url.searchParams.append('flashsms', '0');
      url.searchParams.append('number', sanitizedNumber);
      url.searchParams.append('text', message);
      url.searchParams.append('route', this.smsRoute);

      this.logger.log(`Sending OTP to ${phoneNumber}`);

      const response = await fetch(url.toString());
      const result = await response.text();

      this.logger.log(`SMS API Response: ${result}`);

      if (response.ok) {
        this.logger.log(`OTP sent successfully to ${phoneNumber}`);
        return true;
      }

      if (bypass) {
        this.logger.warn(`SMS provider failed but bypass enabled. OTP: ${otp}. Response: ${result}`);
        return true;
      }

      this.logger.error(`Failed to send OTP to ${phoneNumber}: ${result}`);
      return false;
    } catch (error: any) {
      const bypass = this.isBypassEnabled();
      if (bypass) {
        this.logger.warn(`SMS exception but bypass enabled. OTP: ${otp}. Error: ${error?.message ?? String(error)}`);
        return true;
      }

      this.logger.error(`Error sending OTP: ${error?.message ?? String(error)}`);
      return false;
    }
  }
}
