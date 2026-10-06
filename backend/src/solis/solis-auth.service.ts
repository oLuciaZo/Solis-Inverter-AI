import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface SolisSignedHeaders {
  'Content-Type': string;
  'Content-MD5': string;
  Date: string;
  Authorization: string;
  [key: string]: string;
}

@Injectable()
export class SolisAuthService {
  private readonly logger = new Logger(SolisAuthService.name);

  /**
   * Generates GMT string in exact Solis RFC 1123 format:
   * "EEE, d MMM yyyy HH:mm:ss 'GMT'", Locale.US
   */
  public getGMTTime(): string {
    const d = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[d.getUTCDay()];
    const day = d.getUTCDate();
    const monthName = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');
    return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} GMT`;
  }

  /**
   * Generates SolisCloud API V2.0.3 compliant authorization headers
   * As specified in official Ginlong Authorization.java:
   * StringToSign = "POST\n" + Content-MD5 + "\napplication/json\n" + Date + "\n" + CanonicalizedResource
   * Signature = base64(HmacSHA1(secretKey, StringToSign))
   * Authorization = "API " + keyId + ":" + Signature
   */
  public generateHeaders(
    keyId: string,
    secretKey: string,
    canonicalizedResource: string,
    body: Record<string, any> | string,
  ): SolisSignedHeaders {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);

    // 1. Calculate Content-MD5
    const contentMd5 = crypto
      .createHash('md5')
      .update(bodyStr, 'utf8')
      .digest('base64');

    // 2. Format Date in GMT
    const date = this.getGMTTime();

    // 3. String to sign MUST use "application/json" as per Solis server implementation
    const stringToSign = `POST\n${contentMd5}\napplication/json\n${date}\n${canonicalizedResource}`;

    // 4. Compute HMAC-SHA1
    const signature = crypto
      .createHmac('sha1', secretKey)
      .update(stringToSign, 'utf8')
      .digest('base64');

    const authorization = `API ${keyId}:${signature}`;

    return {
      'Content-Type': 'application/json;charset=UTF-8',
      'Content-MD5': contentMd5,
      Date: date,
      Authorization: authorization,
    };
  }
}
