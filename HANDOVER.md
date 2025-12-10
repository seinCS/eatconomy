# Eat-conomy 프로젝트 인수인계 문서

**작성일**: 2024년 12월  
**프로젝트 버전**: v1.0  
**프로젝트 상태**: 운영 중

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [시작하기](#시작하기)
5. [주요 기능](#주요-기능)
6. [인증 시스템](#인증-시스템)
7. [API 문서](#api-문서)
8. [배포 가이드](#배포-가이드)
9. [문제 해결](#문제-해결)
10. [개발 가이드](#개발-가이드)

---

## 프로젝트 개요

**Eat-conomy**는 자취생을 위한 식비 절약 솔루션입니다. 사용자의 냉장고 재료와 선호도를 기반으로 주간 식단표를 자동 생성하고, 레시피 추천 및 장보기 목록 관리를 제공합니다.

### 주요 특징

- 🍳 **스마트 식단 생성**: 냉장고 재료 기반 주간 식단표 자동 생성
- 👆 **스와이프 기반 선호도 학습**: Tinder 스타일의 레시피 선호도 조사
- 🛒 **장보기 목록 관리**: 식단표 기반 자동 장보기 목록 생성
- 📊 **식사 완료 추적**: 식사 완료 상태 관리 및 통계
- 🔐 **카카오 OAuth 로그인**: 간편한 소셜 로그인

---

## 기술 스택

### 프론트엔드

- **Framework**: React 19.2.1 + TypeScript
- **Build Tool**: Vite 6.2.0
- **Routing**: React Router DOM 7.10.1 (HashRouter)
- **UI**: Tailwind CSS (CDN)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Testing**: Vitest

### 백엔드

- **Framework**: NestJS 10.0.0
- **Language**: TypeScript 5.1.3
- **Database**: PostgreSQL + Prisma ORM 6.19.0
- **Authentication**: JWT + Passport
- **OAuth**: 카카오 OAuth 2.0
- **Logging**: Winston
- **Rate Limiting**: @nestjs/throttler

### 배포

- **Frontend**: Vercel
- **Backend**: Railway / Render
- **Database**: Railway PostgreSQL

---

## 프로젝트 구조

```
eat-conomy/
├── frontend/
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── Home.tsx        # 홈 (오늘의 식단)
│   │   ├── Login.tsx       # 로그인
│   │   ├── AuthCallback.tsx # OAuth 콜백
│   │   ├── Fridge.tsx      # 냉장고 관리
│   │   ├── Swipe.tsx       # 레시피 선호도 조사
│   │   ├── Plan.tsx        # 주간 식단표
│   │   ├── List.tsx        # 장보기 목록
│   │   └── Profile.tsx     # 프로필 설정
│   ├── components/         # 재사용 컴포넌트
│   ├── services/           # API 서비스 레이어
│   │   ├── apiClient.ts    # HTTP 클라이언트
│   │   ├── authService.ts  # 인증 서비스
│   │   └── apiService.ts  # API 호출 래퍼
│   ├── utils/              # 유틸리티 함수
│   └── types.ts            # TypeScript 타입 정의
│
└── backend/
    ├── src/
    │   ├── auth/           # 인증 모듈
    │   ├── users/          # 사용자 관리
    │   ├── fridge/         # 냉장고 관리
    │   ├── plans/          # 식단표 관리
    │   ├── recipes/        # 레시피 관리
    │   ├── shopping-list/  # 장보기 목록
    │   ├── meals/          # 식사 완료 관리
    │   └── common/         # 공통 모듈
    └── prisma/
        └── schema.prisma   # 데이터베이스 스키마
```

---

## 시작하기

### 필수 요구사항

- Node.js 18+ 
- PostgreSQL 14+
- npm 또는 yarn

### 1. 저장소 클론

```bash
git clone <repository-url>
cd eat-conomy
```

### 2. 프론트엔드 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
cp .env.example .env
# .env 파일 편집 필요

# 개발 서버 실행
npm run dev
```

**환경 변수** (`ENV_SETUP.md` 참고):
- `VITE_API_BASE_URL`: 백엔드 API URL
- `VITE_KAKAO_CLIENT_ID`: 카카오 REST API 키
- `VITE_KAKAO_REDIRECT_URI`: 카카오 OAuth 콜백 URI

### 3. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
# backend/DATABASE_SETUP.md 참고

# 데이터베이스 마이그레이션
npx prisma migrate dev

# Prisma Client 생성
npx prisma generate

# 개발 서버 실행
npm run start:dev
```

**환경 변수** (`backend/DATABASE_SETUP.md` 참고):
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`: JWT 시크릿 키
- `KAKAO_CLIENT_ID`: 카카오 REST API 키
- `KAKAO_CLIENT_SECRET`: 카카오 Client Secret (선택)
- `KAKAO_REDIRECT_URI`: 카카오 OAuth 콜백 URI
- `FRONTEND_URL`: 프론트엔드 URL

### 4. 데이터베이스 설정

PostgreSQL 데이터베이스 생성 및 마이그레이션은 `backend/DATABASE_SETUP.md`를 참고하세요.

---

## 주요 기능

### 1. 카카오 OAuth 로그인

- 카카오 개발자 콘솔에서 앱 생성 및 OAuth 설정 필요
- OAuth 2.0 Authorization Code Flow 사용
- CSRF 방지를 위한 state 파라미터 사용
- JWT 토큰 기반 인증

### 2. 냉장고 관리

- 재료 추가/삭제
- 카테고리별 분류
- 식단 생성 시 재료 기반 추천

### 3. 레시피 선호도 학습

- 스와이프 기반 선호도 조사
- 좋아요/싫어요 레시피 저장
- 선호도 기반 식단 생성

### 4. 주간 식단표

- 7일 × 2끼 = 14개 슬롯
- 냉장고 재료 및 선호도 기반 자동 생성
- 수동 편집 가능

### 5. 장보기 목록

- 식단표 기반 자동 생성
- 체크리스트 관리
- 재료별 카테고리 분류

### 6. 식사 완료 추적

- 날짜별 식사 완료 상태 관리
- 통계 및 진행률 표시

---

## 인증 시스템

### 카카오 OAuth 플로우

1. 사용자가 카카오 로그인 버튼 클릭
2. 카카오 인가 서버로 리다이렉트
3. 사용자 로그인 및 동의
4. 인가 코드를 백엔드 콜백으로 전달
5. 백엔드에서 액세스 토큰 발급
6. 카카오 사용자 정보 조회
7. DB에 사용자 저장/업데이트
8. JWT 토큰 발급
9. 프론트엔드로 리다이렉트 (토큰 전달)
10. 프론트엔드에서 토큰 저장 및 사용자 정보 조회

### 보안 기능

- **CSRF 방지**: State 토큰 검증
- **JWT 인증**: Bearer 토큰 기반 API 인증
- **Rate Limiting**: 인증 엔드포인트 제한
- **에러 처리**: 민감한 정보 노출 방지

### 주요 파일

- `services/authService.ts`: 프론트엔드 인증 로직
- `backend/src/auth/auth.service.ts`: 백엔드 인증 서비스
- `backend/src/auth/auth.controller.ts`: 인증 컨트롤러
- `backend/src/auth/strategies/jwt.strategy.ts`: JWT 전략

---

## API 문서

### 인증

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/auth/kakao/callback` | 카카오 OAuth 콜백 | - |
| GET | `/api/auth/me` | 현재 사용자 정보 | ✅ |

### 사용자

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/users/me` | 사용자 정보 조회 | ✅ |
| PUT | `/api/users/me/preferences` | 선호도 업데이트 | ✅ |
| DELETE | `/api/users/me` | 계정 삭제 | ✅ |

### 냉장고

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/fridge` | 재료 조회 | ✅ |
| PUT | `/api/fridge/:item/toggle` | 재료 토글 | ✅ |

### 식단표

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/plans` | 식단표 조회 | ✅ |
| POST | `/api/plans` | 식단표 저장 | ✅ |
| PUT | `/api/plans/:slotIndex` | 슬롯 업데이트 | ✅ |

### 레시피

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/recipes/liked` | 좋아요 레시피 | ✅ |
| GET | `/api/recipes/disliked` | 싫어요 레시피 | ✅ |
| POST | `/api/recipes/:id/like` | 좋아요 추가 | ✅ |
| POST | `/api/recipes/:id/dislike` | 싫어요 추가 | ✅ |
| DELETE | `/api/recipes/:id/like` | 좋아요 제거 | ✅ |
| DELETE | `/api/recipes/:id/dislike` | 싫어요 제거 | ✅ |

### 장보기 목록

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/shopping-list` | 목록 조회 | ✅ |
| PUT | `/api/shopping-list/:item/toggle` | 체크 토글 | ✅ |

### 식사 완료

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/meals/finished/:dateKey/:mealType` | 완료 상태 조회 | ✅ |
| PUT | `/api/meals/finished/:dateKey/:mealType` | 완료 상태 토글 | ✅ |

**인증**: ✅ 표시는 JWT 토큰 필요 (Authorization: Bearer {token})

---

## 배포 가이드

자세한 배포 가이드는 `DEPLOYMENT_GUIDE.md`를 참고하세요.

### 프론트엔드 (Vercel)

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포 활성화

### 백엔드 (Railway)

1. Railway에 프로젝트 연결
2. PostgreSQL 데이터베이스 추가
3. 환경 변수 설정
4. 자동 배포 활성화

### 환경 변수 (프로덕션)

프로덕션 환경에서는 다음 환경 변수를 설정해야 합니다:

**프론트엔드:**
- `VITE_API_BASE_URL`: 프로덕션 백엔드 URL
- `VITE_KAKAO_CLIENT_ID`: 프로덕션 카카오 앱 키
- `VITE_KAKAO_REDIRECT_URI`: 프로덕션 콜백 URI

**백엔드:**
- `DATABASE_URL`: 프로덕션 데이터베이스 URL
- `JWT_SECRET`: 강력한 시크릿 키 (32자 이상)
- `KAKAO_CLIENT_ID`: 프로덕션 카카오 앱 키
- `KAKAO_CLIENT_SECRET`: 프로덕션 카카오 Client Secret
- `KAKAO_REDIRECT_URI`: 프로덕션 콜백 URI
- `FRONTEND_URL`: 프로덕션 프론트엔드 URL

---

## 문제 해결

### 로그인 문제

1. **토큰을 받지 못함**
   - 카카오 개발자 콘솔의 Redirect URI 확인
   - 백엔드 로그 확인 (`[Kakao Callback]` 로그)
   - 브라우저 콘솔 확인 (`[AuthCallback]` 로그)

2. **로그인 후 홈으로 이동하지 않음**
   - `ProtectedRoute`의 `isCheckingAuth` 상태 확인
   - 브라우저 콘솔에서 에러 확인

### 데이터베이스 문제

1. **마이그레이션 실패**
   - `backend/DATABASE_SETUP.md` 참고
   - Prisma 스키마 확인
   - 데이터베이스 연결 확인

2. **연결 오류**
   - `DATABASE_URL` 환경 변수 확인
   - PostgreSQL 서비스 실행 확인

### API 호출 문제

1. **401 Unauthorized**
   - JWT 토큰 만료 확인
   - 토큰 재발급 필요

2. **CORS 오류**
   - 백엔드 CORS 설정 확인
   - 프론트엔드 URL이 허용 목록에 있는지 확인

---

## 개발 가이드

### 코드 스타일

- TypeScript 사용
- ESLint + Prettier 설정
- 함수형 컴포넌트 사용
- Context API로 상태 관리

### 주요 패턴

1. **서비스 레이어 패턴**
   - `services/` 디렉토리에 비즈니스 로직 분리
   - API 호출은 `apiClient.ts`를 통해

2. **컴포넌트 구조**
   - 페이지 컴포넌트: `pages/`
   - 재사용 컴포넌트: `components/`

3. **에러 처리**
   - `utils/errors.ts`에서 통합 에러 처리
   - 사용자 친화적 에러 메시지

### 테스트

```bash
# 프론트엔드 테스트
npm run test

# 백엔드 테스트
cd backend
npm run test
```

### 데이터베이스 작업

```bash
# Prisma Studio 실행 (GUI)
cd backend
npx prisma studio

# 마이그레이션 생성
npx prisma migrate dev --name migration-name

# 스키마 변경 후 Client 재생성
npx prisma generate
```

---

## 참고 문서

- `README.md`: 프로젝트 기본 정보
- `TECHNICAL_SPECIFICATION.md`: 기술 명세서
- `ENV_SETUP.md`: 환경 변수 설정 가이드
- `DEPLOYMENT_GUIDE.md`: 배포 가이드
- `backend/README.md`: 백엔드 API 문서
- `backend/DATABASE_SETUP.md`: 데이터베이스 설정 가이드

---

## 연락처 및 지원

프로젝트 관련 문의사항이나 문제가 발생하면 다음을 확인하세요:

1. 이 문서의 [문제 해결](#문제-해결) 섹션
2. 프로젝트 이슈 트래커
3. 코드 주석 및 로그 메시지

---

