# Phase 3 완료 보고서 - API 엔드포인트 구현

## 완료된 작업

### ✅ 모든 API 모듈 구현 완료

1. **Users 모듈** - 사용자 프로필 및 선호도 관리
2. **Fridge 모듈** - 냉장고 재료 관리
3. **Plans 모듈** - 식단표 관리
4. **Recipes 모듈** - 레시피 선호도 관리
5. **Shopping-list 모듈** - 장보기 목록 관리
6. **Meals 모듈** - 식사 완료 상태 관리

---

## 구현된 API 엔드포인트

### 1. Users API

#### `GET /api/users/me`
현재 사용자 프로필 및 선호도 조회

**인증**: JWT 토큰 필요

**응답**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "사용자",
  "avatarUrl": "https://...",
  "provider": "kakao",
  "preferences": {
    "allergies": ["견과류"],
    "dislikedFoods": ["당근"],
    "spicinessLevel": 2,
    "cookingSkill": "Intermediate"
  }
}
```

#### `PUT /api/users/me/preferences`
사용자 선호도 업데이트

**인증**: JWT 토큰 필요

**요청 본문**:
```json
{
  "allergies": ["견과류"],
  "dislikedFoods": ["당근"],
  "spicinessLevel": 2,
  "cookingSkill": "Intermediate"
}
```

**응답**: 업데이트된 선호도

#### `DELETE /api/users/me`
계정 삭제 (관련 데이터 모두 삭제)

**인증**: JWT 토큰 필요

---

### 2. Fridge API

#### `GET /api/fridge`
냉장고 재료 목록 조회

**인증**: JWT 토큰 필요

**응답**:
```json
{
  "items": ["양파", "마늘", "계란"]
}
```

#### `POST /api/fridge`
재료 추가

**인증**: JWT 토큰 필요

**요청 본문**:
```json
{
  "name": "양파"
}
```

**응답**: 업데이트된 재료 목록

#### `DELETE /api/fridge/:name`
재료 삭제

**인증**: JWT 토큰 필요

**응답**: 업데이트된 재료 목록

#### `PUT /api/fridge/:name/toggle`
재료 토글 (있으면 삭제, 없으면 추가)

**인증**: JWT 토큰 필요

**응답**: 업데이트된 재료 목록

---

### 3. Plans API

#### `GET /api/plans`
주간 식단표 조회 (14개 슬롯)

**인증**: JWT 토큰 필요

**응답**:
```json
{
  "plans": [101, 102, null, 103, ...] // 14개 요소
}
```

#### `POST /api/plans`
식단표 생성/전체 업데이트

**인증**: JWT 토큰 필요

**요청 본문**:
```json
{
  "recipeIds": [101, 102, null, 103, ...] // 14개 요소
}
```

**응답**: 업데이트된 식단표

#### `PUT /api/plans/:slotIndex`
특정 슬롯 업데이트

**인증**: JWT 토큰 필요

**요청 본문**:
```json
{
  "recipeId": 101 // 또는 null로 슬롯 비우기
}
```

**응답**: 업데이트된 식단표

---

### 4. Recipes API

#### `GET /api/recipes/liked`
좋아요한 레시피 목록 조회

**인증**: JWT 토큰 필요

**응답**:
```json
{
  "recipeIds": [101, 102, 103]
}
```

#### `GET /api/recipes/disliked`
싫어요한 레시피 목록 조회

**인증**: JWT 토큰 필요

**응답**:
```json
{
  "recipeIds": [104, 105]
}
```

#### `POST /api/recipes/:id/like`
레시피 좋아요 추가 (싫어요 자동 제거)

**인증**: JWT 토큰 필요

**응답**: 업데이트된 좋아요 목록

#### `POST /api/recipes/:id/dislike`
레시피 싫어요 추가 (좋아요 자동 제거)

**인증**: JWT 토큰 필요

**응답**: 업데이트된 싫어요 목록

#### `DELETE /api/recipes/:id/like`
좋아요 제거

**인증**: JWT 토큰 필요

**응답**: 업데이트된 좋아요 목록

#### `DELETE /api/recipes/:id/dislike`
싫어요 제거

**인증**: JWT 토큰 필요

**응답**: 업데이트된 싫어요 목록

---

### 5. Shopping-list API

#### `GET /api/shopping-list`
장보기 목록 조회

**인증**: JWT 토큰 필요

**응답**:
```json
{
  "checks": {
    "양파": true,
    "마늘": false,
    "계란": true
  }
}
```

#### `PUT /api/shopping-list/:item/toggle`
체크 상태 토글

**인증**: JWT 토큰 필요

**응답**: 업데이트된 체크 목록

#### `PUT /api/shopping-list/:item`
체크 상태 설정

**인증**: JWT 토큰 필요

**요청 본문**:
```json
{
  "checked": true
}
```

**응답**: 업데이트된 체크 목록

---

### 6. Meals API

#### `GET /api/meals/finished/:dateKey/:mealType`
식사 완료 상태 조회

**인증**: JWT 토큰 필요

**파라미터**:
- `dateKey`: 날짜 (예: "2024-12-08")
- `mealType`: "lunch" 또는 "dinner"

**응답**:
```json
{
  "finished": true
}
```

#### `PUT /api/meals/finished/:dateKey/:mealType`
식사 완료 상태 토글

**인증**: JWT 토큰 필요

**파라미터**:
- `dateKey`: 날짜 (예: "2024-12-08")
- `mealType`: "lunch" 또는 "dinner"

**응답**:
```json
{
  "finished": true
}
```

#### `GET /api/meals/today`
오늘의 저녁 완료 상태 조회 (레거시 호환)

**인증**: JWT 토큰 필요

**응답**:
```json
{
  "finished": true
}
```

---

## 구현된 파일 구조

```
backend/src/
├── users/
│   ├── dto/
│   │   └── update-preferences.dto.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── fridge/
│   ├── dto/
│   │   └── add-fridge-item.dto.ts
│   ├── fridge.controller.ts
│   ├── fridge.service.ts
│   └── fridge.module.ts
├── plans/
│   ├── dto/
│   │   └── update-plan.dto.ts
│   ├── plans.controller.ts
│   ├── plans.service.ts
│   └── plans.module.ts
├── recipes/
│   ├── recipes.controller.ts
│   ├── recipes.service.ts
│   └── recipes.module.ts
├── shopping-list/
│   ├── shopping-list.controller.ts
│   ├── shopping-list.service.ts
│   └── shopping-list.module.ts
└── meals/
    ├── meals.controller.ts
    ├── meals.service.ts
    └── meals.module.ts
```

---

## 주요 기능

### 1. 인증 보호
- 모든 엔드포인트는 `JwtAuthGuard`로 보호됨
- `@CurrentUser()` 데코레이터로 현재 사용자 정보 접근

### 2. 데이터 무결성
- Prisma의 unique 제약 조건 활용
- Cascade delete로 사용자 삭제 시 관련 데이터 자동 삭제

### 3. 유연한 API 설계
- 토글 기능 제공 (냉장고, 장보기 목록, 식사 완료)
- 부분 업데이트 지원 (선호도, 식단표)

### 4. 레거시 호환성
- 기존 프론트엔드와의 호환성을 위한 엔드포인트 유지
- `GET /api/meals/today` - 오늘의 저녁 완료 상태

---

## 다음 단계

**Phase 4**: 프론트엔드 서비스 레이어를 API 연동으로 전환
- `dbService.ts`를 API 호출로 대체
- 모든 데이터 조회/수정을 백엔드 API로 전환

---

## 테스트 방법

### 1. 백엔드 서버 실행

```bash
cd backend
npm run start:dev
```

### 2. API 테스트 (예: Postman 또는 curl)

#### 사용자 정보 조회
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/users/me
```

#### 냉장고 재료 추가
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "양파"}' \
  http://localhost:3001/api/fridge
```

#### 식단표 조회
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/plans
```

---

## 참고사항

- 모든 엔드포인트는 `/api` prefix를 사용합니다.
- JWT 토큰은 `Authorization: Bearer <token>` 형식으로 전달합니다.
- 에러 응답은 NestJS 표준 형식을 따릅니다.
- 데이터베이스는 Prisma ORM을 통해 관리됩니다.

