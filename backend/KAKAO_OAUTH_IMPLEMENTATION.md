# 카카오 로그인 REST API 구현 가이드

카카오 개발자 문서를 참조한 백엔드 구현 가이드입니다.
참고: [카카오 로그인 REST API 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)

---

## 카카오 로그인 과정 (OAuth 2.0 Authorization Code Flow)

### 전체 플로우

```
1. 프론트엔드: 카카오 로그인 버튼 클릭
   ↓
2. 프론트엔드: 카카오 인가 서버로 리다이렉트
   ↓
3. 사용자: 카카오 계정으로 로그인 및 동의
   ↓
4. 카카오: 인가 코드(code)를 백엔드 콜백 URL로 전달
   ↓
5. 백엔드: 인가 코드로 액세스 토큰(access_token) 요청
   ↓
6. 백엔드: 액세스 토큰으로 사용자 정보 조회
   ↓
7. 백엔드: 우리 DB에 사용자 저장 및 JWT 발급
   ↓
8. 백엔드: JWT를 프론트엔드로 전달
```

---

## 1단계: 인가 코드 요청 (프론트엔드)

### 카카오 인가 서버로 리다이렉트

**URL**: `https://kauth.kakao.com/oauth/authorize`

**쿼리 파라미터**:

| 파라미터 | 설명 | 필수 | 예시 |
|---------|------|------|------|
| `client_id` | REST API 키 | O | `28fd9b104f782ea062b1cac9e285645a` |
| `redirect_uri` | 콜백 URL | O | `http://localhost:3001/api/auth/kakao/callback` |
| `response_type` | 응답 타입 | O | `code` |
| `scope` | 동의 항목 | X | `profile_nickname,profile_image,account_email` |

**예시 URL**:
```
https://kauth.kakao.com/oauth/authorize?
  client_id=28fd9b104f782ea062b1cac9e285645a&
  redirect_uri=http://localhost:3001/api/auth/kakao/callback&
  response_type=code
```

**프론트엔드 구현**:
```typescript
// pages/Login.tsx
const handleKakaoLogin = () => {
  const KAKAO_CLIENT_ID = '28fd9b104f782ea062b1cac9e285645a';
  const REDIRECT_URI = 'http://localhost:3001/api/auth/kakao/callback';
  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  
  window.location.href = KAKAO_AUTH_URL;
};
```

---

## 2단계: 토큰 요청 (백엔드)

### 인가 코드로 액세스 토큰 발급

**엔드포인트**: `POST https://kauth.kakao.com/oauth/token`

**요청 헤더**:
```
Content-Type: application/x-www-form-urlencoded;charset=utf-8
```

**요청 본문** (form-urlencoded):

| 파라미터 | 설명 | 필수 | 예시 |
|---------|------|------|------|
| `grant_type` | 인가 타입 | O | `authorization_code` |
| `client_id` | REST API 키 | O | `28fd9b104f782ea062b1cac9e285645a` |
| `redirect_uri` | 콜백 URL (인가 코드 요청 시와 동일) | O | `http://localhost:3001/api/auth/kakao/callback` |
| `code` | 인가 코드 (콜백에서 받은 code) | O | `인가_코드_값` |
| `client_secret` | Client Secret (선택사항 - 설정하지 않아도 됨) | X | `클라이언트_시크릿_값` |

**응답** (성공):
```json
{
  "token_type": "bearer",
  "access_token": "액세스_토큰",
  "refresh_token": "리프레시_토큰",
  "expires_in": 21599,
  "refresh_token_expires_in": 5183999,
  "scope": "profile_nickname profile_image account_email"
}
```

**NestJS 구현 예시**:
```typescript
// src/auth/auth.service.ts
async getAccessToken(code: string): Promise<KakaoTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: this.configService.get('KAKAO_CLIENT_ID'),
    redirect_uri: this.configService.get('KAKAO_REDIRECT_URI'),
    code,
    // Client Secret은 선택사항 (설정하지 않아도 OAuth 로그인 가능)
    ...(this.configService.get('KAKAO_CLIENT_SECRET') && {
      client_secret: this.configService.get('KAKAO_CLIENT_SECRET'),
    }),
  });

  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new UnauthorizedException('Failed to get access token');
  }

  return response.json();
}
```

---

## 3단계: 사용자 정보 조회 (백엔드)

### 액세스 토큰으로 사용자 정보 가져오기

**엔드포인트**: `GET https://kapi.kakao.com/v2/user/me`

**요청 헤더**:
```
Authorization: Bearer ${ACCESS_TOKEN}
Content-Type: application/x-www-form-urlencoded;charset=utf-8
```

**쿼리 파라미터** (선택):

| 파라미터 | 설명 | 필수 |
|---------|------|------|
| `property_keys` | 조회할 사용자 프로퍼티 키 목록 | X |
| `secure_resource` | 이미지 URL을 HTTPS로 반환할지 여부 | X |

**응답** (성공):
```json
{
  "id": 123456789,
  "connected_at": "2024-12-09T15:00:00Z",
  "properties": {
    "nickname": "홍길동",
    "profile_image": "http://k.kakaocdn.net/...",
    "thumbnail_image": "http://k.kakaocdn.net/..."
  },
  "kakao_account": {
    "profile_nickname_needs_agreement": false,
    "profile_image_needs_agreement": false,
    "profile": {
      "nickname": "홍길동",
      "thumbnail_image_url": "http://k.kakaocdn.net/...",
      "profile_image_url": "http://k.kakaocdn.net/...",
      "is_default_image": false
    },
    "has_email": true,
    "email_needs_agreement": false,
    "is_email_valid": true,
    "is_email_verified": true,
    "email": "user@example.com"
  }
}
```

**NestJS 구현 예시**:
```typescript
// src/auth/auth.service.ts
async getUserInfo(accessToken: string): Promise<KakaoUserInfo> {
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  if (!response.ok) {
    throw new UnauthorizedException('Failed to get user info');
  }

  return response.json();
}
```

---

## 4단계: 백엔드 콜백 엔드포인트 구현

### NestJS Controller 구현

```typescript
// src/auth/auth.controller.ts
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth/kakao')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    try {
      if (error) {
        // 사용자가 로그인 취소한 경우
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=cancelled`);
      }

      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
      }

      // 1. 인가 코드로 액세스 토큰 발급
      const tokenResponse = await this.authService.getAccessToken(code);

      // 2. 액세스 토큰으로 사용자 정보 조회
      const userInfo = await this.authService.getUserInfo(tokenResponse.access_token);

      // 3. 우리 DB에 사용자 저장 또는 업데이트
      const user = await this.authService.findOrCreateUser({
        provider: 'kakao',
        providerId: userInfo.id.toString(),
        email: userInfo.kakao_account?.email,
        nickname: userInfo.kakao_account?.profile?.nickname || userInfo.properties?.nickname,
        avatarUrl: userInfo.kakao_account?.profile?.profile_image_url || userInfo.properties?.profile_image,
      });

      // 4. JWT 토큰 발급
      const jwtToken = await this.authService.generateJWT(user);

      // 5. 프론트엔드로 리다이렉트 (JWT를 쿼리 파라미터 또는 쿠키로 전달)
      return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
    } catch (error) {
      console.error('Kakao callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
}
```

---

## 5단계: 로그아웃 구현

### 카카오 로그아웃

**엔드포인트**: `POST https://kapi.kakao.com/v1/user/logout`

**요청 헤더**:
```
Authorization: Bearer ${ACCESS_TOKEN}
```

**응답** (성공):
```json
{
  "id": 123456789
}
```

**NestJS 구현**:
```typescript
async logout(accessToken: string): Promise<void> {
  await fetch('https://kapi.kakao.com/v1/user/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
}
```

---

## 6단계: 연결 해제 구현

### 카카오 계정과 앱 연결 해제

**엔드포인트**: `POST https://kapi.kakao.com/v1/user/unlink`

**요청 헤더**:
```
Authorization: Bearer ${ACCESS_TOKEN}
```

**응답** (성공):
```json
{
  "id": 123456789
}
```

**NestJS 구현**:
```typescript
async unlink(accessToken: string): Promise<void> {
  await fetch('https://kapi.kakao.com/v1/user/unlink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
}
```

---

## 환경 변수 설정

### 백엔드 `.env` 파일

```env
# Kakao OAuth
KAKAO_CLIENT_ID=28fd9b104f782ea062b1cac9e285645a
# KAKAO_CLIENT_SECRET=  # 선택사항: 설정하지 않아도 OAuth 로그인 가능
KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback

# Frontend
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

---

## 에러 처리

### 주요 에러 코드

| 에러 코드 | 설명 | 해결 방법 |
|---------|------|---------|
| `-1` | 카카오 서버 내부 오류 | 재시도 |
| `-2` | 필수 파라미터 누락 | 파라미터 확인 |
| `-101` | 앱 키가 유효하지 않음 | REST API 키 확인 |
| `-102` | 이미 연결된 사용자 | 정상 (로그인 처리) |
| `-401` | 유효하지 않은 액세스 토큰 | 토큰 갱신 또는 재로그인 |
| `-402` | 액세스 토큰이 만료됨 | 토큰 갱신 |

### 에러 응답 형식

```json
{
  "msg": "error message",
  "code": -401
}
```

---

## 보안 고려사항

1. **Client Secret (선택사항)**
   - Client Secret 없이도 OAuth 로그인 가능
   - 설정하면 보안 수준이 향상되지만 필수는 아님
   - 설정한 경우: 서버 사이드에서만 사용, 환경 변수로 관리, Git에 커밋하지 않음

2. **HTTPS 사용**
   - 프로덕션에서는 반드시 HTTPS 사용
   - Redirect URI도 HTTPS로 설정

3. **액세스 토큰 관리**
   - 서버에서만 보관
   - 프론트엔드로 전달하지 않음
   - 우리 서버의 JWT만 프론트엔드에 전달

4. **State 파라미터 사용** (CSRF 방지)
   - 인가 코드 요청 시 `state` 파라미터 추가
   - 콜백에서 `state` 검증

---

## 참고 문서

- [카카오 로그인 REST API 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오 로그인 이해하기](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [카카오 로그인 설정하기](https://developers.kakao.com/docs/latest/ko/kakaologin/prerequisite)

