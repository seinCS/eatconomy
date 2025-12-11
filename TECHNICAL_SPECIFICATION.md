# 잇코노미(Eat-conomy) MVP 기술 명세서 및 개발 완료 보고서

**작성일**: 2024년 12월  
**버전**: v1.2.0  
**프로젝트 타입**: React SPA (Single Page Application)  
**최종 업데이트**: 2024년 12월 10일

---

## 1. 프로젝트 구조 (Project Architecture)

### 1.1 Directory Tree

```
eat-conomy/
├── App.tsx                    # 메인 앱 컴포넌트 및 Context Provider
├── index.tsx                  # React 앱 진입점
├── index.html                 # HTML 템플릿
├── types.ts                   # TypeScript 타입 정의
├── constants.ts               # 상수 데이터 (레시피, 재료 등)
├── vite.config.ts             # Vite 빌드 설정
├── tsconfig.json              # TypeScript 컴파일러 설정
├── vitest.config.ts           # 테스트 설정
│
├── components/
│   └── SwipeCard.tsx          # 스와이프 카드 UI 컴포넌트
│
├── pages/
│   ├── Home.tsx               # 홈 페이지 (오늘의 식단 표시)
│   ├── Login.tsx              # 로그인 페이지
│   ├── Fridge.tsx             # 냉장고 관리 페이지
│   ├── Swipe.tsx              # 메뉴 선호도 조사 페이지
│   ├── Plan.tsx               # 주간 식단표 페이지
│   ├── List.tsx               # 장보기 목록 페이지
│   └── Profile.tsx            # 프로필 및 설정 페이지
│
├── services/
│   ├── authService.ts         # 인증 서비스 (Mock)
│   ├── dbService.ts           # 데이터베이스 서비스 (localStorage 기반)
│   ├── recipeService.ts       # 레시피 로직 및 식단 생성 알고리즘
│   └── geminiService.ts       # Gemini AI 연동 서비스
│
└── test/
    ├── setup.ts               # 테스트 환경 설정
    ├── recipeService.test.ts  # 레시피 서비스 테스트 (16개)
    ├── dbService.test.ts      # DB 서비스 테스트 (11개)
    ├── geminiService.test.ts  # Gemini 서비스 테스트 (3개)
    └── integration.test.ts    # 통합 테스트 (9개)
```

### 1.2 Tech Stack

| 카테고리 | 기술/라이브러리 | 버전 | 용도 |
|---------|----------------|------|------|
| **프레임워크** | React | ^19.2.1 | UI 프레임워크 |
| **빌드 도구** | Vite | ^6.2.0 | 번들러 및 개발 서버 |
| **언어** | TypeScript | ~5.8.2 | 타입 안정성 |
| **라우팅** | react-router-dom | ^7.10.1 | 클라이언트 사이드 라우팅 |
| **스타일링** | Tailwind CSS | (CDN) | 유틸리티 CSS 프레임워크 |
| **상태 관리** | React Context API | 내장 | 전역 상태 관리 |
| **애니메이션** | framer-motion | ^12.23.25 | 스와이프 카드 애니메이션 |
| **아이콘** | lucide-react | ^0.556.0 | 아이콘 라이브러리 |
| **차트** | recharts | ^3.5.1 | 통계 차트 (절약액) |
| **AI SDK** | @google/genai | ^1.31.0 | Gemini API 클라이언트 |
| **테스트** | Vitest | ^3.2.4 | 단위/통합 테스트 프레임워크 |
| **테스트 유틸** | @testing-library/react | ^16.3.0 | React 컴포넌트 테스트 |

### 1.3 State Management

**Context API 기반 전역 상태 관리** (`App.tsx`의 `AppContext`)

| 상태명 | 타입 | 설명 | 저장 위치 |
|--------|------|------|-----------|
| `user` | `User \| null` | 현재 로그인한 사용자 정보 | localStorage (`eat_user`) |
| `preferences` | `UserPreferences \| undefined` | 사용자 선호도 설정 | localStorage (`eat_conomy_db_v1`) |
| `fridge` | `string[]` | 냉장고 재료 목록 | localStorage (`eat_conomy_db_v1`) |
| `likedRecipes` | `Recipe[]` | 스와이프로 선택한 좋아하는 레시피 | localStorage (`eat_conomy_db_v1`) |
| `dislikedRecipes` | `Recipe[]` | 스와이프로 선택한 싫어하는 레시피 | localStorage (`eat_conomy_db_v1`) |
| `plannedRecipes` | `MealSet[]` | 주간 식단표 (14개 세트: 메인+반찬) | localStorage (`eat_conomy_db_v1`) |
| `shoppingListChecks` | `Record<string, boolean>` | 장보기 목록 체크 상태 | localStorage (`eat_conomy_db_v1`) |
| `todayMealFinished` | `boolean` | 오늘 식사 완료 상태 (Legacy) | localStorage (`eat_conomy_db_v1`) |
| `mealFinished` | `Record<string, Record<string, boolean>>` | 날짜별 식사 완료 상태 | localStorage (`eat_conomy_db_v1`) |
| `isGeneratingPlan` | `boolean` | 식단 생성 중 로딩 상태 | 메모리 (상태만) |

**주요 함수들:**
- `login()`, `logout()`, `deleteAccount()` - 인증 관련
- `updatePreferences()` - 선호도 업데이트
- `toggleFridgeItem()` - 냉장고 재료 추가/제거
- `addLikedRecipe()`, `addDislikedRecipe()` - 레시피 선호도 관리
- `generatePlan()`, `generateAIPlan()` - 식단 생성
- `toggleMealFinished()`, `getMealFinished()` - 식사 완료 상태 관리
- `resetSession()` - 세션 초기화

---

## 2. 핵심 로직 상세 (Core Logic Specification)

### 2.1 AI 추천 알고리즘

#### 2.1.1 선택(Selection) 로직

**파일 위치**: `services/recipeService.ts`  
**함수명**: `generateScoredWeeklyPlan()`  
**반환 타입**: `MealSet[]` (14개 세트: 점심/저녁 × 7일)

**처리 흐름**:

1. **레시피 메타데이터 자동 분류**
   ```typescript
   // Line 8-55: services/recipeService.ts
   ```
   - `enrichRecipeMetadata()`: 레시피에 `dishType`(메인/반찬), `mealType`(점심/저녁) 자동 추가
   - 태그와 칼로리 기반으로 자동 분류
   - `ENRICHED_RECIPES`: 메타데이터가 추가된 레시피 목록

2. **전처리 필터링 (Hard Filter)**
   ```typescript
   // Line 231-239: services/recipeService.ts
   ```
   - 알러지 재료 포함 레시피 제외 (`preferences.allergies`)
   - 싫어하는 재료 포함 레시피 제외 (`preferences.dislikedFoods`)
   - 스와이프로 싫어요 선택한 레시피 제외 (`dislikedRecipes`)

3. **점수 산정 (Scoring)**
   ```typescript
   // Line 241-266: services/recipeService.ts
   ```
   - **재료 매칭 점수**: `(냉장고 재료 매칭 수 / 전체 재료 수) * 100`
   - **부족 재료 페널티**: `부족한 재료 수 * 10`
   - **맵기 페널티**: 사용자가 순한맛(1)이고 레시피가 매운 경우 `-50`
   - **좋아요 보너스**: 스와이프로 선택한 레시피 `+1000` (최우선 선택)

4. **메인/반찬 분리**
   ```typescript
   // Line 274-276: services/recipeService.ts
   ```
   - 메인음식과 반찬을 별도 풀로 분리
   - 각 식사에 메인+반찬 세트 구성

5. **슬롯별 레시피 선택 (개선된 알고리즘)**
   ```typescript
   // Line 359-452: services/recipeService.ts - selectRecipeForSlot()
   ```
   - **하루 내 재료 반복 패널티**: 같은 날 이미 사용된 재료와 겹치면 `-30점/재료`
   - **다른 날 재료 연결 보너스**: 이전 날 저녁과 재료가 겹치면 `+20점/재료`
   - **점심/저녁 적합성**: 
     - 점심: 가벼운 요리 우선 (칼로리 < 400 → +30점)
     - 저녁: 든든한 요리 우선 (칼로리 > 500 → +30점)
   - **mealType 매칭 보너스**: 정확히 맞는 타입이면 `+50점`
   - 상위 5개 후보 중 랜덤 선택 (다양성 확보)

6. **7일 식단 생성 (메인+반찬 세트)**
   ```typescript
   // Line 278-356: services/recipeService.ts
   ```
   - 각 날짜별로 점심 메인+반찬, 저녁 메인+반찬 세트 생성
   - 날짜별 사용된 재료 추적 (`usedIngredientsByDay`)
   - 중복 레시피 방지 (`usedRecipeIds`)
   - 총 14개 MealSet 반환 (점심/저녁 × 7일)

#### 2.1.2 알러지/비선호 필터링 단계

**필터링 순서**:
1. **레시피 메타데이터 자동 분류** (Line 8-55): dishType, mealType 자동 추가
2. **1차 필터링** (Line 231-239): 알러지, 싫어하는 재료, 싫어하는 레시피 제외
3. **점수 산정** (Line 241-266): 필터링된 후보들에 점수 부여
4. **메인/반찬 분리** (Line 274-276): 메인음식과 반찬 풀 분리
5. **슬롯별 선택** (Line 359-452): 개선된 알고리즘으로 각 슬롯에 맞는 레시피 선택
6. **폴백 처리**: 필터링 후 후보가 없을 경우 안전한 풀 사용

**안전성 보장**:
- 알러지는 **절대 제외** (Hard Filter)
- 싫어하는 재료는 점수 산정 전 제외
- 폴백 시에도 알러지 체크 유지

#### 2.1.3 점수 산정 방식 상세

**기본 점수 공식**:
```
기본점수 = 재료매칭점수 - 부족재료페널티 - 맵기페널티 + 좋아요보너스

재료매칭점수 = (냉장고에 있는 재료 수 / 전체 재료 수) * 100
부족재료페널티 = 부족한 재료 수 * 10
맵기페널티 = 사용자가 순한맛(1)이고 레시피가 매운 경우 50점
좋아요보너스 = 스와이프로 선택한 레시피인 경우 1000점
```

**슬롯별 최종 점수 (개선된 알고리즘)**:
```
최종점수 = 기본점수 - 하루내재료반복패널티 + 다른날재료연결보너스 + 점심저녁적합성보너스

하루내재료반복패널티 = 같은 날 사용된 재료와 겹치는 재료 수 * 30점
다른날재료연결보너스 = 이전 날 저녁과 겹치는 재료 수 * 20점
점심저녁적합성보너스:
  - mealType 정확히 매칭: +50점
  - 점심이고 칼로리 < 400: +30점
  - 저녁이고 칼로리 > 500: +30점
```

**예시**:
- 레시피 A: 재료 5개 중 3개 보유 → 매칭점수 60, 부족 2개 → 페널티 20 → **기본점수 40**
- 레시피 B: 재료 3개 중 3개 보유 → 매칭점수 100, 부족 0개 → **기본점수 100**
- 레시피 C: 좋아요 선택 + 재료 4개 중 2개 보유 → 매칭점수 50, 부족 2개 → 페널티 20, 보너스 1000 → **기본점수 1030**
- 레시피 D: 기본점수 80, 같은 날 재료 2개 겹침 → 패널티 60 → **최종점수 20**
- 레시피 E: 기본점수 80, 이전 날 재료 2개 연결 → 보너스 40, 점심 적합 +30 → **최종점수 150**

### 2.2 데이터 영속성 (Persistence)

#### 2.2.1 localStorage 저장 구조

**저장 키**:
- `eat_user`: 현재 로그인한 사용자 정보 (JSON)
- `eat_conomy_db_v1`: 전체 앱 데이터베이스 (JSON)

**데이터베이스 스키마** (`services/dbService.ts`):
```typescript
interface DBState {
  users: Record<string, User>;
  fridgeItems: Record<string, string[]>;              // userId -> 재료 목록
  weeklyPlans: Record<string, (Recipe | null)[]>;    // userId -> 14개 슬롯 (레거시: 메인만 저장)
  // TODO: 백엔드 API 업데이트 시 MealSet[] 구조로 변경 필요
  likedRecipes: Record<string, number[]>;            // userId -> 레시피 ID 배열
  dislikedRecipes: Record<string, number[]>;          // userId -> 레시피 ID 배열
  shoppingChecks: Record<string, Record<string, boolean>>; // userId -> { 재료명: 체크여부 }
  todayMealFinished: Record<string, boolean>;         // Legacy (deprecated)
  mealFinished: Record<string, Record<string, boolean>>; // userId -> { "2024-12-08-lunch": true }
}
```

**참고**: 현재 백엔드 API는 레거시 구조를 지원하므로 프론트엔드에서 MealSet[]를 Recipe[]로 변환하여 저장합니다.

#### 2.2.2 저장 시점

| 액션 | 저장 함수 | 저장 시점 | 파일 위치 |
|------|----------|----------|-----------|
| 사용자 로그인 | `authService.loginWithKakao/Google()` | 즉시 | `services/authService.ts:24,34` |
| 냉장고 재료 변경 | `dbService.toggleFridgeItem()` | 즉시 | `services/dbService.ts:104-112` |
| 선호도 업데이트 | `dbService.updateUserPreferences()` | 즉시 | `services/dbService.ts:97-98` |
| 좋아요/싫어요 추가 | `dbService.addLikedRecipe/addDislikedRecipe()` | 즉시 | `services/dbService.ts:120-135` |
| 식단 생성/수정 | `dbService.savePlan()` | 즉시 | `services/dbService.ts:141-144` |
| 식사 완료 체크 | `dbService.toggleMealFinished()` | 즉시 | `services/dbService.ts:189-192` |
| 장보기 체크 | `dbService.toggleShoppingCheck()` | 즉시 | `services/dbService.ts:156-163` |

**저장 메커니즘**:
- 모든 `dbService` 함수는 `saveDB(db)` 호출로 즉시 localStorage에 저장
- `saveDB()` 함수는 try-catch로 에러 처리 (Line 55-61)

#### 2.2.3 불러오는 시점

| 시점 | 불러오는 함수 | 파일 위치 |
|------|--------------|-----------|
| 앱 마운트 시 | `dbService.loadDB()` | `services/dbService.ts:27-48` |
| 사용자 로그인 시 | `App.tsx`의 `useEffect` (Line 91-143) | `App.tsx:91-143` |
| 페이지 방문 시 | 각 페이지의 `useEffect` | 각 페이지 파일 |

**로드 순서** (`App.tsx:91-143`):
1. `dbService.initUserData()` - 사용자 초기화
2. `Promise.all()`로 병렬 로드:
   - 사용자 정보, 냉장고, 식단표, 좋아요/싫어요, 장보기 체크, 식사 완료 상태

#### 2.2.4 데이터 초기화 (`resetSession`)

**호출 시점**:
- 스와이프 시작 전 (`pages/Swipe.tsx:46`)
- 식단 추천 시작 전 (`pages/Fridge.tsx` - 주석 처리됨, 현재 미사용)

**초기화되는 데이터** (`services/dbService.ts:177-183`):
- `likedRecipes`: 빈 배열
- `dislikedRecipes`: 빈 배열
- `todayMealFinished`: false

**유지되는 데이터**:
- `weeklyPlans`: 식단표는 유지 (명시적 재생성 전까지)
- `fridge`: 냉장고 재료 유지
- `preferences`: 사용자 설정 유지

---

## 3. 데이터 모델 (Data Schema)

### 3.1 Types/Interfaces

**파일 위치**: `types.ts`

#### 핵심 타입 정의

```typescript
// 재료 인터페이스
interface Ingredient {
  name: string;
  amount?: string;  // 옵셔널 (현재 미사용)
}

// 사용자 선호도
interface UserPreferences {
  allergies: string[];           // 알러지 재료 목록
  dislikedFoods: string[];        // 싫어하는 재료 목록
  spicinessLevel: number;         // 1: 순한맛, 2: 보통, 3: 매운맛
  cookingSkill: string;          // 'Beginner' | 'Intermediate' | 'Advanced'
}

// 레시피
interface Recipe {
  id: number;                     // 고유 ID (101-150)
  name: string;                   // 레시피 이름
  ingredients: string[];          // 재료 목록 (간소화된 형태)
  tags: string[];                 // 태그 배열 (예: ["#국물", "#한식"])
  time: string;                   // 조리 시간 (예: "30분")
  calories: number;               // 칼로리
  image?: string;                 // 이미지 URL (옵셔널, 현재 미사용)
  reason?: string;                // AI 생성 이유 (식단 생성 시 추가)
  dishType?: 'main' | 'side';    // 메인음식 또는 반찬 (자동 분류)
  mealType?: 'lunch' | 'dinner' | 'both'; // 점심/저녁 적합성 (자동 분류)
}

// 식사 슬롯: 메인음식 + 반찬 세트
interface MealSet {
  main: Recipe | null;            // 메인음식
  side: Recipe | null;             // 반찬
}

// 식사 슬롯 (레거시, 현재 미사용)
interface MealSlot {
  day: string;                    // "Mon", "Tue" 등
  type: 'Lunch' | 'Dinner';
  recipeId: number | null;
}

// 체인 요리 연결 정보 (현재 미사용)
interface ChainConnection {
  fromId: number;
  toId: number;
  sharedIngredients: string[];
}
```

#### DB 서비스 타입 (`services/dbService.ts`)

```typescript
interface User {
  id: string;                     // 사용자 고유 ID
  email: string;
  nickname: string;
  avatarUrl: string;
  preferences?: UserPreferences;  // 옵셔널 선호도
}
```

### 3.2 Seed Data

**파일 위치**: `constants.ts`

#### 레시피 데이터셋

- **규모**: 50개 레시피 (`SEED_RECIPES`)
- **ID 범위**: 101-150
- **카테고리 분류**:
  1. 돼지고기 & 김치 베이스 (7개)
  2. 계란 & 두부 & 스팸 (7개)
  3. 면 요리 (7개)
  4. 볶음 & 덮밥류 (9개)
  5. 국 & 찌개 (7개)
  6. 빵 & 간편식 (7개)
  7. 메인 요리 (6개)

**레시피 데이터 구조 예시**:
```typescript
{
  id: 101,
  name: "돼지고기 김치찌개",
  ingredients: ["돼지고기", "김치", "두부", "파", "마늘"],
  tags: ["#국물", "#한식", "#소울푸드"],
  time: "30분",
  calories: 450
}
```

#### 재료 마스터 데이터

- **파일 위치**: `constants.ts` (Line 78-144)
- **총 재료 수**: 약 50개
- **카테고리**:
  - 채소/과일 (13개)
  - 정육/계란 (5개)
  - 수산물 (5개)
  - 유제품/곡류 (7개)
  - 양념/오일 (9개)
  - 가공식품/기타 (5개)

#### 기본 양념 리스트 (`STAPLES`)

- **용도**: Chain Cooking 알고리즘에서 제외할 기본 양념
- **목록**: 소금, 설탕, 물, 파, 마늘, 밥, 김치, 간장, 고춧가루 등 22개
- **파일 위치**: `constants.ts:4`

#### 초기 냉장고 데이터 (`MOCK_FRIDGE`)

- **용도**: 신규 사용자 초기화 시 시드 데이터
- **재료**: 계란, 김치, 양파, 스팸, 두부, 감자, 돼지고기, 파스타면 (8개)
- **파일 위치**: `constants.ts:76`

---

## 4. 기능 구현 현황표 (Feature Status)

### 4.1 인증 (Auth)

| 기능 | 상태 | 구현 위치 | 비고 |
|------|------|-----------|------|
| 소셜 로그인 UI (카카오/Google) | ✅ 완료 | `pages/Login.tsx` | Mock 구현 (실제 OAuth 미연동) |
| 프로필 수정 | ✅ 완료 | `pages/Profile.tsx` | 선호도, 알러지, 맵기 레벨 설정 |
| 세션 유지 | ✅ 완료 | `services/authService.ts` | localStorage 기반 |
| 로그아웃 | ✅ 완료 | `App.tsx:157-159` | 상태 초기화 포함 |
| 계정 삭제 | ✅ 완료 | `App.tsx:162-166` | 모든 사용자 데이터 삭제 |

**제약사항**:
- 실제 OAuth 연동 미구현 (Mock 데이터 사용)
- 세션 만료 처리 없음

### 4.2 냉장고 관리 (Fridge)

| 기능 | 상태 | 구현 위치 | 비고 |
|------|------|-----------|------|
| 재료 추가/삭제 | ✅ 완료 | `pages/Fridge.tsx:75-98` | 토글 방식 |
| 재료 검색 | ✅ 완료 | `pages/Fridge.tsx:52-58` | 실시간 필터링 |
| 카테고리 분류 | ✅ 완료 | `pages/Fridge.tsx:59-72` | 6개 카테고리 |
| 재료 준비 상태 표시 | ✅ 완료 | `pages/Home.tsx:79-84` | 홈 페이지에서 표시 |
| ~~식단 추천 받기~~ | ❌ 제거됨 | - | 사용률 낮아 제거 (v1.2.0) |

**제약사항**:
- 재료 수량 관리 없음 (있음/없음만)
- 재료 유통기한 관리 없음

### 4.3 식단 계획 (Plan)

| 기능 | 상태 | 구현 위치 | 비고 |
|------|------|-----------|------|
| 스와이프 선호도 조사 | ✅ 완료 | `pages/Swipe.tsx` | 10개 레시피 스와이프 |
| AI 식단 생성 (Scored) | ✅ 완료 | `services/recipeService.ts:206-357` | 메인+반찬 세트 알고리즘 (v1.2.0) |
| AI 식단 생성 (LLM) | ⚠️ 부분완료 | `services/geminiService.ts:53-190` | 구현됐으나 현재 미사용 |
| 식단표 표시 | ✅ 완료 | `pages/Plan.tsx` | 주간 타임라인 뷰 (메인+반찬 표시) |
| 레시피 상세 보기 | ✅ 완료 | `pages/Plan.tsx:54-126` | 모달 형태 (메인/반찬 구분) |
| AI 레시피 팁 | ✅ 완료 | `services/geminiService.ts:15-45` | Gemini API 연동 |
| 메뉴 교체 | ✅ 완료 | `pages/Plan.tsx:78-126` | Chain Cooking 기반 추천 |
| Chain Cooking 시각화 | ✅ 완료 | `pages/Plan.tsx:170-233` | 다른 날 재료 연계 표시 (v1.2.0) |
| 실시간 대시보드 | ✅ 완료 | `pages/Plan.tsx:23-52` | 절약액, 칼로리, 체인 카운트 |

**제약사항**:
- LLM 기반 식단 생성은 구현되어 있으나 비용 절감을 위해 미사용
- 이미지 매핑: `picsum.photos` 사용 (실제 레시피 이미지 없음)

### 4.4 장보기 목록 (List)

| 기능 | 상태 | 구현 위치 | 비고 |
|------|------|-----------|------|
| 자동 목록 생성 | ✅ 완료 | `services/recipeService.ts:83-102` | 식단표 기반 |
| 구매 상태 저장 | ✅ 완료 | `services/dbService.ts:153-163` | 체크박스 상태 |
| 쿠팡 링크 연동 | ✅ 완료 | `pages/List.tsx:20-24` | 새 탭에서 열기 |
| 재료 수량 표시 | ✅ 완료 | `pages/List.tsx:68-72` | 중복 재료 카운트 |
| 기본 양념 제외 | ✅ 완료 | `services/recipeService.ts:87` | STAPLES 필터링 |

**제약사항**:
- 쿠팡 링크는 검색 URL만 제공 (실제 상품 매핑 없음)

### 4.5 홈 페이지 (Home)

| 기능 | 상태 | 구현 위치 | 비고 |
|------|------|-----------|------|
| 오늘의 식단 표시 | ✅ 완료 | `pages/Home.tsx:26-46` | 메인+반찬 모두 표시 (v1.2.0) |
| 식사 완료 체크 | ✅ 완료 | `pages/Home.tsx:69-88` | 개별 완료 체크 |
| 재료 준비 상태 | ✅ 완료 | `pages/Home.tsx:96-100` | 냉장고 기반 확인 |
| 절약액 통계 | ✅ 완료 | `pages/Home.tsx:264-289` | 가상 데이터 (차트) |
| 이번주 식단 다시 추천받기 | ✅ 완료 | `pages/Home.tsx:292-302` | resetSession 후 /swipe 이동 (v1.2.0) |

**제약사항**:
- 절약액은 가상 시뮬레이션 데이터 (실제 계산 로직 없음)

### 4.6 프로필 (Profile)

| 기능 | 상태 | 구현 위치 | 비고 |
|------|------|-----------|------|
| 알러지 설정 | ✅ 완료 | `pages/Profile.tsx:114-160` | 칩 선택 + 커스텀 입력 |
| 싫어하는 음식 설정 | ✅ 완료 | `pages/Profile.tsx:163-209` | 칩 선택 + 커스텀 입력 |
| 맵기 선호도 | ✅ 완료 | `pages/Profile.tsx:212-227` | 3단계 선택 |
| 요리 실력 설정 | ✅ 완료 | `pages/Profile.tsx:230-241` | 드롭다운 선택 |
| 설정 저장 | ✅ 완료 | `pages/Profile.tsx:30-39` | DB에 즉시 저장 |

---

## 5. 알려진 문제 및 제약사항 (Known Issues & Limitations)

### 5.1 기술적 부채 (Technical Debt)

#### 🔴 높은 우선순위

1. **인증 시스템 Mock 구현**
   - **현재 상태**: `authService.ts`에서 하드코딩된 Mock 사용자 반환
   - **문제점**: 실제 OAuth 연동 없음, 프로덕션 사용 불가
   - **영향**: 실제 사용자 인증 불가능
   - **해결 방안**: Supabase Auth 또는 Firebase Auth 연동 필요

2. **데이터 영속성 한계**
   - **현재 상태**: localStorage 기반 인메모리 DB
   - **문제점**: 
     - 페이지 리로드 시 데이터 유지되지만, 브라우저 데이터 삭제 시 손실
     - 다중 기기 동기화 불가
     - 데이터 용량 제한 (약 5-10MB)
   - **영향**: 사용자 데이터 손실 가능성, 확장성 제한
   - **해결 방안**: Supabase 또는 Firebase Realtime Database 마이그레이션

3. **식사 완료 상태 초기화 문제**
   - **현재 상태**: 페이지 이동 후 상태가 초기화되는 버그 존재
   - **문제점**: `location.pathname` 의존성으로 인한 불필요한 재로드
   - **영향**: 사용자 경험 저하
   - **해결 방안**: 의존성 배열 최적화 및 상태 로드 로직 개선

#### 🟡 중간 우선순위

4. **에러 처리 부족**
   - **현재 상태**: 일부 함수에서 에러 발생 시 사용자 피드백 없음
   - **문제점**: 
     - `generatePlan()` 실패 시 조용히 실패
     - localStorage 저장 실패 시 콘솔 로그만
   - **영향**: 사용자가 문제를 인지하지 못할 수 있음
   - **해결 방안**: 전역 에러 핸들러 및 토스트 알림 시스템 도입

5. **타입 안정성 개선 필요**
   - **현재 상태**: 일부 any 타입 사용, 옵셔널 체이닝 과다 사용
   - **문제점**: 런타임 에러 가능성
   - **영향**: 예기치 않은 버그 발생 가능
   - **해결 방안**: 엄격한 타입 체크 및 타입 가드 추가

6. **성능 최적화 필요**
   - **현재 상태**: 
     - 식단 생성 시 전체 레시피 배열 순회 (50개)
     - 불필요한 리렌더링 가능성
   - **문제점**: 레시피 수 증가 시 성능 저하
   - **영향**: 확장성 제한
   - **해결 방안**: 메모이제이션, 가상화, 인덱싱 최적화

#### 🟢 낮은 우선순위

7. **이미지 매핑**
   - **현재 상태**: `picsum.photos` 랜덤 이미지 사용
   - **문제점**: 실제 레시피 이미지 없음
   - **영향**: UI 일관성 부족
   - **해결 방안**: 레시피별 실제 이미지 추가 또는 이미지 생성 API 연동

8. **국제화 (i18n) 미지원**
   - **현재 상태**: 모든 텍스트 하드코딩 (한국어만)
   - **문제점**: 다국어 지원 불가
   - **영향**: 글로벌 확장 제한
   - **해결 방안**: react-i18next 또는 유사 라이브러리 도입

9. **접근성 (A11y) 개선**
   - **현재 상태**: 기본적인 키보드 네비게이션만 지원
   - **문제점**: 스크린 리더 지원 부족, ARIA 레이블 미흡
   - **영향**: 장애인 사용자 접근성 제한
   - **해결 방안**: ARIA 속성 추가, 키보드 네비게이션 강화

### 5.2 기능적 제약사항

1. **레시피 데이터셋 제한**
   - 현재 50개 레시피만 제공
   - 사용자 커스텀 레시피 추가 불가
   - 레시피 상세 정보 부족 (조리 방법, 단계별 설명 없음)

2. **식단 생성 알고리즘 개선사항 (v1.2.0)**
   - ✅ 메인+반찬 세트 구성으로 현실적인 식단 제공
   - ✅ 하루 내 재료 반복 최소화
   - ✅ 다른 날 재료 연결 우선시
   - ✅ 점심/저녁 적합성 고려
   - ⚠️ 재료 구매 비용 미고려
   - ⚠️ 영양소 균형 고려 없음

3. **장보기 목록 기능 제한**
   - 쿠팡 링크만 제공 (다른 쇼핑몰 연동 없음)
   - 가격 비교 기능 없음
   - 재료별 추천 상품 없음

4. **통계 기능 제한**
   - 절약액은 가상 데이터 (실제 계산 로직 없음)
   - 식사 이력 추적 없음
   - 주간/월간 리포트 없음

### 5.3 보안 관련 이슈

1. **API 키 노출 위험**
   - 현재: 환경변수 사용 (`VITE_GEMINI_API_KEY`)
   - 문제: Vite는 클라이언트 번들에 포함될 수 있음
   - 해결: 백엔드 프록시 서버 구축 필요

2. **사용자 데이터 암호화 없음**
   - localStorage에 평문 저장
   - 민감 정보는 없지만, 향후 확장 시 암호화 필요

### 5.4 테스트 커버리지

- **현재 커버리지**: 약 39개 테스트 케이스
- **커버된 영역**:
  - ✅ `recipeService`: 핵심 알고리즘 테스트 완료
  - ✅ `dbService`: CRUD 작업 테스트 완료
  - ✅ `geminiService`: 기본 기능 테스트 완료
  - ✅ 통합 테스트: 주요 플로우 테스트 완료
- **미커버 영역**:
  - ❌ React 컴포넌트 테스트 없음
  - ❌ E2E 테스트 없음
  - ❌ 에러 케이스 테스트 부족

---

## 6. 아키텍처 다이어그램

### 6.1 데이터 흐름도

```
[사용자 액션]
    ↓
[React Component]
    ↓
[App Context] ←→ [dbService] ←→ [localStorage]
    ↓                    ↓
[recipeService]    [authService]
    ↓                    ↓
[geminiService]    [localStorage]
    ↓
[Gemini API]
```

### 6.2 식단 생성 플로우

```
[사용자: 홈 화면에서 "이번주 식단 다시 추천받기" 클릭]
    ↓
[Home.tsx: handleStartPlanning()]
    ↓
[App.tsx: resetSession()] - 선호도 초기화
    ↓
[Home.tsx: navigate('/swipe')] - 스와이프 페이지로 이동
    ↓
[사용자: 스와이프로 선호도 조사 완료]
    ↓
[Swipe.tsx: finishSwiping()]
    ↓
[App.tsx: generatePlan()]
    ↓
[recipeService.ts: generateScoredWeeklyPlan()]
    ├─→ [레시피 메타데이터 자동 분류: dishType, mealType]
    ├─→ [필터링: 알러지/비선호 제외]
    ├─→ [점수 산정: 재료 매칭 + 보너스]
    ├─→ [메인/반찬 분리]
    ├─→ [슬롯별 선택: 하루 내 반복 패널티, 다른 날 연결 보너스]
    └─→ [선택: 14개 MealSet (메인+반찬 × 7일)]
    ↓
[App.tsx: setPlannedRecipes(mealSets)]
    ↓
[apiService.ts: savePlan()] - 백엔드 저장 (메인만, 레거시 호환)
    ↓
[UI 업데이트: Plan 페이지로 이동]
```

---

## 7. 개발 환경 설정

### 7.1 필수 환경 변수

`.env.local` 파일 생성 필요:
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here  # Fallback
```

### 7.2 실행 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 테스트 실행
npm test

# 테스트 UI 모드
npm run test:ui
```

### 7.3 브라우저 지원

- Chrome/Edge (최신 버전)
- Safari (최신 버전)
- Firefox (최신 버전)
- 모바일 브라우저 지원 (반응형 디자인)

---

## 8. 향후 개선 방향

### 8.1 단기 (1-2개월)

1. 실제 OAuth 인증 연동 (Supabase Auth)
2. 백엔드 API 구축 (식단 생성 API, 사용자 데이터 관리)
3. 식사 완료 상태 버그 수정
4. 에러 핸들링 강화

### 8.2 중기 (3-6개월)

1. 실제 데이터베이스 마이그레이션 (Supabase PostgreSQL)
2. 레시피 데이터베이스 확장 (100개 이상)
3. 영양소 분석 기능 추가
4. 식사 이력 추적 및 통계

### 8.3 장기 (6개월 이상)

1. AI 기반 개인화 추천 강화
2. 소셜 기능 (레시피 공유, 친구 초대)
3. 모바일 앱 개발 (React Native)
4. 오프라인 모드 지원

---

**문서 작성 완료일**: 2024년 12월  
**최종 업데이트**: 2024년 12월 10일 (v1.2.0)  
**최종 검토 필요 항목**: 실제 프로덕션 배포 전 보안 검토 및 성능 테스트 권장

---

## 9. v1.2.0 주요 변경사항 요약

### 9.1 식단 추천 시스템 고도화

- **메인+반찬 세트 구성**: 각 식사에 메인음식 1개와 반찬 1개가 함께 추천됩니다
- **레시피 메타데이터 자동 분류**: `dishType`(메인/반찬), `mealType`(점심/저녁) 자동 추가
- **개선된 알고리즘**:
  - 하루 내 재료 반복 패널티: 같은 날 재료 중복 사용 시 -30점/재료
  - 다른 날 재료 연결 보너스: 이전 날 저녁과 재료 연결 시 +20점/재료
  - 점심/저녁 적합성: 점심은 가벼운 요리, 저녁은 든든한 요리 우선 추천

### 9.2 타입 시스템 개선

- `MealSet` 타입 추가: `{ main: Recipe | null, side: Recipe | null }`
- `Recipe` 타입 확장: `dishType`, `mealType` 속성 추가
- `plannedRecipes` 타입 변경: `(Recipe | null)[]` → `MealSet[]`

### 9.3 UI/UX 개선

- **홈 화면**: "이번주 식단 다시 추천받기" 버튼 추가
- **홈 화면 오늘의 식단**: 메인음식과 반찬 모두 표시
- **냉장고 페이지**: 사용률 낮은 "이 재료로 추천받기" 버튼 제거

### 9.4 알고리즘 상세

**슬롯별 레시피 선택 로직** (`selectRecipeForSlot`):
1. 사용되지 않은 레시피 필터링
2. 점심/저녁 적합성 필터링
3. 점수 계산:
   - 기본 점수 (재료 매칭, 부족 페널티, 맵기 페널티, 좋아요 보너스)
   - 하루 내 재료 반복 패널티 (-30점/재료)
   - 다른 날 재료 연결 보너스 (+20점/재료)
   - 점심/저녁 적합성 보너스 (+30~50점)
4. 상위 5개 후보 중 랜덤 선택

**7일 식단 생성 프로세스**:
- 각 날짜별로 점심 메인+반찬, 저녁 메인+반찬 세트 생성
- 날짜별 사용된 재료 추적 (`usedIngredientsByDay`)
- 중복 레시피 방지 (`usedRecipeIds`)
- 총 14개 MealSet 반환 (점심/저녁 × 7일)

