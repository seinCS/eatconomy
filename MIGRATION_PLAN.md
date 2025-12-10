# 백엔드/프론트엔드 분리 및 카카오 로그인 연동 마이그레이션 계획

## 현재 상태 (MVP)

### 기술 스택
- **프론트엔드**: React + Vite + TypeScript
- **데이터 저장**: localStorage 기반 Mock DB
- **인증**: Mock 인증 (카카오/구글 시뮬레이션)
- **배포**: Vercel (프론트엔드만)

### 데이터 구조
- 사용자 정보 (User)
- 냉장고 재료 (fridgeItems)
- 주간 식단표 (weeklyPlans)
- 좋아요/싫어요 레시피 (likedRecipes, dislikedRecipes)
- 장보기 체크리스트 (shoppingChecks)
- 식사 완료 상태 (mealFinished)

---

## 목표 상태

### 기술 스택
- **프론트엔드**: React + Vite + TypeScript (기존 유지)
- **백엔드**: Node.js + Express (또는 NestJS)
- **데이터베이스**: PostgreSQL (또는 MongoDB)
- **인증**: 카카오 OAuth 2.0
- **배포**: 
  - 프론트엔드: Vercel
  - 백엔드: Railway / Render / AWS

---

## 마이그레이션 우선순위

### Phase 1: 인프라 구축 (기반 작업)
**목표**: 백엔드 서버 및 데이터베이스 기본 구조 설정

1. **백엔드 프로젝트 초기화**
   - Node.js + Express 프로젝트 생성
   - TypeScript 설정
   - 기본 폴더 구조 설정

2. **데이터베이스 설계 및 설정**
   - PostgreSQL 데이터베이스 생성
   - 스키마 설계 (Users, FridgeItems, Plans, Recipes 등)
   - ORM 설정 (Prisma 또는 TypeORM)

3. **환경 변수 및 설정 관리**
   - `.env` 파일 구조
   - 환경별 설정 분리

**예상 소요 시간**: 2-3일

---

### Phase 2: 카카오 OAuth 연동 (인증 시스템)
**목표**: 카카오 개발자 등록 및 OAuth 인증 구현

1. **카카오 개발자 등록**
   - 카카오 개발자 계정 생성
   - 애플리케이션 등록
   - Redirect URI 설정
   - REST API 키 발급

2. **백엔드 OAuth 엔드포인트 구현**
   - 카카오 로그인 콜백 처리
   - JWT 토큰 발급
   - 사용자 정보 저장/조회

3. **프론트엔드 인증 플로우 구현**
   - 카카오 로그인 버튼 연동
   - 토큰 관리 (localStorage → httpOnly cookie 고려)
   - API 요청 시 인증 헤더 추가

**예상 소요 시간**: 3-4일

---

### Phase 3: API 엔드포인트 구현 (데이터 관리)
**목표**: 기존 localStorage 기반 기능을 REST API로 전환

1. **사용자 관련 API**
   - `GET /api/users/me` - 현재 사용자 정보 조회
   - `PUT /api/users/me/preferences` - 선호도 업데이트
   - `DELETE /api/users/me` - 계정 삭제

2. **냉장고 관련 API**
   - `GET /api/fridge` - 냉장고 재료 조회
   - `POST /api/fridge` - 재료 추가
   - `DELETE /api/fridge/:item` - 재료 삭제

3. **식단표 관련 API**
   - `GET /api/plans` - 주간 식단표 조회
   - `POST /api/plans` - 식단표 생성
   - `PUT /api/plans/:index` - 특정 슬롯 업데이트

4. **레시피 선호도 API**
   - `GET /api/recipes/liked` - 좋아요한 레시피 조회
   - `POST /api/recipes/:id/like` - 좋아요 추가
   - `POST /api/recipes/:id/dislike` - 싫어요 추가

5. **장보기 목록 API**
   - `GET /api/shopping-list` - 장보기 목록 조회
   - `PUT /api/shopping-list/:item` - 체크 상태 토글

6. **식사 완료 API**
   - `GET /api/meals/finished/:dateKey` - 완료 상태 조회
   - `PUT /api/meals/finished/:dateKey/:mealType` - 완료 상태 토글

**예상 소요 시간**: 5-7일

---

### Phase 4: 프론트엔드 마이그레이션 (API 연동)
**목표**: 기존 서비스 레이어를 API 호출로 전환

1. **API 클라이언트 설정**
   - Axios 또는 Fetch 래퍼 생성
   - 인증 토큰 자동 추가
   - 에러 핸들링

2. **서비스 레이어 리팩토링**
   - `authService.ts` → API 호출로 변경
   - `dbService.ts` → API 호출로 변경
   - 기존 인터페이스 유지 (호환성)

3. **상태 관리 개선**
   - API 응답 캐싱
   - Optimistic Updates 유지
   - 로딩 상태 관리

**예상 소요 시간**: 4-5일

---

### Phase 5: 배포 및 마이그레이션 (데이터 이전)
**목표**: 프로덕션 환경 구축 및 기존 데이터 이전

1. **백엔드 배포**
   - Railway / Render / AWS에 배포
   - 환경 변수 설정
   - 데이터베이스 연결 확인

2. **프론트엔드 배포 설정**
   - API 엔드포인트 환경 변수 설정
   - Vercel 환경 변수 업데이트

3. **데이터 마이그레이션 스크립트**
   - localStorage 데이터 추출
   - 데이터베이스로 이전 (선택사항)

4. **테스트 및 검증**
   - 전체 플로우 테스트
   - 성능 테스트
   - 보안 검증

**예상 소요 시간**: 3-4일

---

## 기술 스택 선택 가이드

### 백엔드 프레임워크 옵션

#### 옵션 1: Express + TypeScript (권장)
- **장점**: 가볍고 빠른 학습 곡선, 유연함
- **단점**: 구조화를 직접 해야 함
- **적합한 경우**: 빠른 프로토타이핑, 작은 팀

#### 옵션 2: NestJS
- **장점**: 구조화된 아키텍처, TypeScript 네이티브, DI 패턴
- **단점**: 학습 곡선이 있음
- **적합한 경우**: 장기적인 확장성 필요, 큰 팀

### 데이터베이스 옵션

#### 옵션 1: PostgreSQL + Prisma (권장)
- **장점**: 강력한 관계형 데이터베이스, Prisma의 우수한 타입 안정성
- **단점**: 초기 설정이 복잡할 수 있음
- **적합한 경우**: 복잡한 관계가 있는 데이터

#### 옵션 2: MongoDB + Mongoose
- **장점**: 유연한 스키마, 빠른 개발
- **단점**: 관계형 데이터 처리 복잡
- **적합한 경우**: 문서 기반 데이터 구조

### 인증 방식

#### 옵션 1: JWT (JSON Web Token)
- **장점**: Stateless, 확장성 좋음
- **단점**: 토큰 탈취 시 보안 이슈
- **구현**: Access Token + Refresh Token

#### 옵션 2: Session + Cookie
- **장점**: 보안성 높음, 토큰 탈취 위험 낮음
- **단점**: 서버 상태 관리 필요
- **구현**: httpOnly Cookie 사용

---

## 다음 단계

**지금 시작할 작업**: Phase 1 - 백엔드 프로젝트 초기화

1. 백엔드 폴더 구조 생성
2. Express + TypeScript 프로젝트 설정
3. 기본 서버 실행 확인

준비되시면 알려주세요!

