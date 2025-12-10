# 프론트엔드 환경 변수 설정 가이드

## 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# API 설정
VITE_API_BASE_URL=http://localhost:3001/api

# 카카오 OAuth 설정
VITE_KAKAO_CLIENT_ID=28fd9b104f782ea062b1cac9e285645a
VITE_KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback

# Google Gemini API (선택사항)
# VITE_GEMINI_API_KEY=your-gemini-api-key
```

## 빠른 시작

### 1. .env 파일 생성

```bash
# .env.example 파일을 복사하여 .env 파일 생성
cp .env.example .env
```

### 2. 환경 변수 수정 (필요한 경우)

`.env` 파일을 열어서 실제 값으로 수정:

```env
# 개발 환경 기본값 (이미 설정되어 있음)
VITE_API_BASE_URL=http://localhost:3001/api
VITE_KAKAO_CLIENT_ID=28fd9b104f782ea062b1cac9e285645a
VITE_KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
```

### 3. 개발 서버 재시작

환경 변수를 변경했다면 개발 서버를 재시작해야 합니다:

```bash
# 서버 중지 (Ctrl+C)
npm run dev
```

---

## 환경 변수 설명

### 필수 환경 변수

#### `VITE_API_BASE_URL`
- **설명**: 백엔드 API 기본 URL
- **기본값**: `http://localhost:3001/api`
- **예시**: `http://localhost:3001/api`

#### `VITE_KAKAO_CLIENT_ID`
- **설명**: 카카오 개발자 콘솔에서 발급받은 REST API 키
- **기본값**: `28fd9b104f782ea062b1cac9e285645a` (개발용)
- **위치**: 카카오 개발자 콘솔 → 앱 설정 → 앱 키 → REST API 키

#### `VITE_KAKAO_REDIRECT_URI`
- **설명**: 카카오 OAuth 콜백 URI (백엔드 엔드포인트)
- **기본값**: `http://localhost:3001/api/auth/kakao/callback`
- **주의**: 카카오 개발자 콘솔에도 동일한 URI를 등록해야 함

### 선택적 환경 변수

#### `VITE_GEMINI_API_KEY`
- **설명**: Google Gemini API 키 (AI 레시피 팁 기능용)
- **기본값**: 없음 (설정하지 않으면 AI 팁 기능 비활성화)
- **위치**: Google AI Studio (https://aistudio.google.com/)

---

## 프로덕션 환경 설정

프로덕션 환경에서는 다음과 같이 설정하세요:

```env
# 프로덕션 API URL
VITE_API_BASE_URL=https://your-backend-domain.railway.app/api

# 카카오 OAuth (프로덕션)
VITE_KAKAO_CLIENT_ID=your-production-kakao-client-id
VITE_KAKAO_REDIRECT_URI=https://your-backend-domain.railway.app/api/auth/kakao/callback
```

**주의**: Vercel 등 배포 플랫폼에서는 환경 변수를 플랫폼 설정에서 추가해야 합니다.

---

## 환경 변수 확인

### 개발 환경에서 확인

브라우저 콘솔에서:

```javascript
// 환경 변수 확인 (Vite는 VITE_ 접두사가 있는 변수만 노출)
console.log(import.meta.env.VITE_API_BASE_URL);
console.log(import.meta.env.VITE_KAKAO_CLIENT_ID);
console.log(import.meta.env.VITE_KAKAO_REDIRECT_URI);
```

### 빌드 시 확인

```bash
npm run build
```

빌드 시 환경 변수가 번들에 포함됩니다.

---

## 문제 해결

### 환경 변수가 적용되지 않음

1. **서버 재시작**: 환경 변수를 변경했다면 개발 서버를 재시작하세요
2. **파일 위치 확인**: `.env` 파일이 프로젝트 루트에 있는지 확인
3. **변수명 확인**: `VITE_` 접두사가 있는지 확인

### 타입 오류

`vite-env.d.ts` 파일이 있는지 확인:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KAKAO_CLIENT_ID?: string;
  readonly VITE_KAKAO_REDIRECT_URI?: string;
  readonly VITE_GEMINI_API_KEY?: string;
}
```

---

## 보안 주의사항

- ⚠️ `.env` 파일은 **절대 Git에 커밋하지 마세요** (이미 `.gitignore`에 포함됨)
- ⚠️ `.env.example` 파일에는 실제 값 대신 예시만 포함
- ⚠️ 프로덕션 환경에서는 배포 플랫폼의 환경 변수 설정 사용

---

## 참고

- [Vite 환경 변수 문서](https://vitejs.dev/guide/env-and-mode.html)
- `.env.example` - 환경 변수 예시 파일
- `vite-env.d.ts` - TypeScript 타입 정의

