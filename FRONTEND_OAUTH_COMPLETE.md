# 프론트엔드 카카오 OAuth 연동 완료 보고서

## 완료된 작업

### ✅ API 클라이언트 생성
- `services/apiClient.ts` - JWT 토큰 관리 및 API 요청 래퍼
- 자동으로 JWT 토큰을 헤더에 포함
- 401 에러 시 자동으로 토큰 제거

### ✅ 인증 서비스 업데이트
- `services/authService.ts` - 카카오 OAuth 연동
- `loginWithKakao()` - 카카오 인가 서버로 리다이렉트
- `getCurrentUser()` - JWT 토큰으로 사용자 정보 조회 (API 호출)

### ✅ 로그인 페이지 수정
- `pages/Login.tsx` - 카카오 로그인 버튼 클릭 시 카카오 인가 서버로 리다이렉트

### ✅ 콜백 페이지 생성
- `pages/AuthCallback.tsx` - OAuth 콜백 처리
- JWT 토큰 저장
- 사용자 정보 조회
- 로딩/성공/에러 상태 표시

### ✅ App.tsx 인증 로직 업데이트
- 마운트 시 JWT 토큰으로 사용자 정보 자동 조회
- 콜백 라우트 추가 (`/auth/callback`)

---

## 구현된 플로우

```
1. 사용자: 로그인 페이지에서 "카카오로 3초 만에 시작하기" 클릭
   ↓
2. 프론트엔드: 카카오 인가 서버로 리다이렉트
   https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=...
   ↓
3. 사용자: 카카오 계정으로 로그인 및 동의
   ↓
4. 카카오: 인가 코드를 백엔드 콜백으로 전달
   http://localhost:3001/api/auth/kakao/callback?code=...
   ↓
5. 백엔드: 인가 코드로 액세스 토큰 발급 → 사용자 정보 조회 → JWT 발급
   ↓
6. 백엔드: 프론트엔드 콜백으로 리다이렉트 (JWT 포함)
   http://localhost:3000/#/auth/callback?token=JWT_TOKEN
   ↓
7. 프론트엔드: JWT 토큰 저장 → 사용자 정보 조회 → 홈으로 이동
```

---

## 환경 변수 설정

프론트엔드 `.env` 파일 (선택사항):

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:3001/api

# Kakao OAuth
VITE_KAKAO_CLIENT_ID=28fd9b104f782ea062b1cac9e285645a
VITE_KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
```

**참고**: 환경 변수를 설정하지 않으면 기본값이 사용됩니다.

---

## 테스트 방법

### 1. 백엔드 서버 실행

```bash
cd backend
npm run start:dev
```

백엔드가 `http://localhost:3001`에서 실행됩니다.

### 2. 프론트엔드 서버 실행

```bash
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

### 3. 로그인 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. 로그인 페이지에서 "카카오로 3초 만에 시작하기" 클릭
3. 카카오 로그인 페이지로 리다이렉트
4. 카카오 계정으로 로그인 및 동의
5. 자동으로 홈 페이지로 이동

---

## 주요 변경 사항

### 1. authService.ts
- **변경 전**: Mock 사용자 반환
- **변경 후**: 카카오 인가 서버로 리다이렉트, JWT로 사용자 정보 조회

### 2. Login.tsx
- **변경 전**: `login()` 함수 호출 후 대기
- **변경 후**: 카카오 인가 서버로 즉시 리다이렉트

### 3. App.tsx
- **변경 전**: localStorage에서 사용자 정보 직접 로드
- **변경 후**: JWT 토큰으로 API 호출하여 사용자 정보 조회

### 4. 새로 추가된 파일
- `services/apiClient.ts` - API 클라이언트
- `pages/AuthCallback.tsx` - OAuth 콜백 처리

---

## 다음 단계

현재는 사용자 인증만 API로 전환되었고, 나머지 데이터(냉장고, 식단표 등)는 여전히 localStorage를 사용합니다.

**Phase 3**: 나머지 API 엔드포인트 구현 및 프론트엔드 연동
- 냉장고 API
- 식단표 API
- 레시피 선호도 API
- 장보기 목록 API
- 식사 완료 API

---

## 참고사항

### JWT 토큰 저장 위치
- `localStorage.getItem('eat_jwt_token')` - JWT 토큰
- `localStorage.getItem('eat_user')` - 사용자 정보 (기존 호환성 유지)

### API 요청 시 자동 인증
- `apiClient.get()`, `apiClient.post()` 등 모든 요청에 자동으로 JWT 토큰이 포함됩니다.
- 401 에러 발생 시 자동으로 토큰을 제거하고 로그아웃 처리됩니다.

