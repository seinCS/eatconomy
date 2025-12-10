export class KakaoTokenResponse {
  token_type: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  scope?: string;
}

