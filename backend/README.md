# Eat-conomy Backend API

NestJS 기반 백엔드 서버입니다.

## 기술 스택

- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Kakao OAuth 2.0 + JWT
- **Deployment**: Railway / Render

## 프로젝트 구조

```
backend/
├── src/
│   ├── auth/          # 인증 모듈 (카카오 OAuth, JWT)
│   ├── users/         # 사용자 관리 모듈
│   ├── fridge/        # 냉장고 관리 모듈
│   ├── plans/         # 식단표 관리 모듈
│   ├── recipes/       # 레시피 관리 모듈
│   ├── shopping-list/ # 장보기 목록 모듈
│   ├── meals/         # 식사 완료 모듈
│   ├── common/        # 공통 유틸리티
│   ├── prisma/        # Prisma 서비스
│   └── main.ts        # 애플리케이션 진입점
├── prisma/
│   └── schema.prisma  # 데이터베이스 스키마
└── .env               # 환경 변수 (gitignore)
```

## 시작하기

### 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/eatconomy?schema=public"
PORT=3001
JWT_SECRET=your-secret-key
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
FRONTEND_URL=http://localhost:3000
```

### 2. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고 마이그레이션을 실행하세요:

```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev --name init

# 또는 데이터베이스가 이미 있다면
npx prisma db push
```

### 3. 의존성 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

## API 엔드포인트

### 인증
- `POST /api/auth/kakao` - 카카오 로그인 시작
- `GET /api/auth/kakao/callback` - 카카오 로그인 콜백
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보 조회

### 사용자
- `GET /api/users/me` - 현재 사용자 정보
- `PUT /api/users/me/preferences` - 선호도 업데이트
- `DELETE /api/users/me` - 계정 삭제

### 냉장고
- `GET /api/fridge` - 냉장고 재료 조회
- `POST /api/fridge` - 재료 추가
- `DELETE /api/fridge/:item` - 재료 삭제

### 식단표
- `GET /api/plans` - 주간 식단표 조회
- `POST /api/plans` - 식단표 생성
- `PUT /api/plans/:slotIndex` - 특정 슬롯 업데이트

### 레시피 선호도
- `GET /api/recipes/liked` - 좋아요한 레시피 조회
- `POST /api/recipes/:id/like` - 좋아요 추가
- `POST /api/recipes/:id/dislike` - 싫어요 추가

### 장보기 목록
- `GET /api/shopping-list` - 장보기 목록 조회
- `PUT /api/shopping-list/:item` - 체크 상태 토글

### 식사 완료
- `GET /api/meals/finished/:dateKey` - 완료 상태 조회
- `PUT /api/meals/finished/:dateKey/:mealType` - 완료 상태 토글

## 개발 가이드

### Prisma 사용법

```bash
# 스키마 변경 후 마이그레이션 생성
npx prisma migrate dev --name migration-name

# Prisma Client 재생성
npx prisma generate

# Prisma Studio 실행 (데이터베이스 GUI)
npx prisma studio
```

### 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

## 배포

### Railway 배포

1. Railway에 프로젝트 연결
2. 환경 변수 설정
3. PostgreSQL 데이터베이스 추가
4. 자동 배포 활성화

### 환경 변수 (프로덕션)

- `DATABASE_URL`: Railway PostgreSQL 연결 문자열
- `JWT_SECRET`: 강력한 시크릿 키
- `KAKAO_CLIENT_ID`: 카카오 앱 REST API 키
- `KAKAO_CLIENT_SECRET`: 카카오 앱 Client Secret
- `KAKAO_REDIRECT_URI`: 프로덕션 콜백 URL
- `FRONTEND_URL`: 프론트엔드 배포 URL
