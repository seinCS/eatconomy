# Phase 4 완료 보고서 - 프론트엔드 서비스 레이어 API 연동 전환

## ✅ 완료된 작업

### 1. API 서비스 생성
- ✅ `services/apiService.ts` 생성
- ✅ `dbService.ts`의 모든 함수를 API 호출로 전환
- ✅ 백엔드 API 엔드포인트와 매핑 완료

### 2. App.tsx 업데이트
- ✅ `dbService` → `apiService`로 변경
- ✅ 모든 데이터 조회/수정을 API 호출로 전환
- ✅ 에러 처리 및 롤백 로직 추가

### 3. API 매핑 완료
모든 데이터 작업이 백엔드 API로 전환되었습니다:

| 기능 | 이전 (localStorage) | 현재 (API) |
|------|---------------------|-----------|
| 사용자 정보 | `dbService.getUser` | `GET /api/users/me` |
| 선호도 업데이트 | `dbService.updateUserPreferences` | `PUT /api/users/me/preferences` |
| 냉장고 조회 | `dbService.getFridge` | `GET /api/fridge` |
| 냉장고 토글 | `dbService.toggleFridgeItem` | `PUT /api/fridge/:name/toggle` |
| 좋아요 조회 | `dbService.getLikedRecipes` | `GET /api/recipes/liked` |
| 좋아요 추가 | `dbService.addLikedRecipe` | `POST /api/recipes/:id/like` |
| 싫어요 조회 | `dbService.getDislikedRecipes` | `GET /api/recipes/disliked` |
| 싫어요 추가 | `dbService.addDislikedRecipe` | `POST /api/recipes/:id/dislike` |
| 식단표 조회 | `dbService.getPlan` | `GET /api/plans` |
| 식단표 저장 | `dbService.savePlan` | `POST /api/plans` |
| 식단표 업데이트 | `dbService.updatePlanSlot` | `PUT /api/plans/:slotIndex` |
| 장보기 조회 | `dbService.getShoppingChecks` | `GET /api/shopping-list` |
| 장보기 토글 | `dbService.toggleShoppingCheck` | `PUT /api/shopping-list/:item/toggle` |
| 식사 완료 조회 | `dbService.getMealFinished` | `GET /api/meals/finished/:dateKey/:mealType` |
| 식사 완료 토글 | `dbService.toggleMealFinished` | `PUT /api/meals/finished/:dateKey/:mealType` |
| 계정 삭제 | `dbService.deleteAccount` | `DELETE /api/users/me` |

---

## 주요 변경사항

### 1. apiService.ts 구조

```typescript
export const apiService = {
  initUserData: async (user: User): Promise<void>
  getUser: async (userId: string): Promise<User | null>
  updateUserPreferences: async (userId: string, prefs: UserPreferences): Promise<void>
  getFridge: async (userId: string): Promise<string[]>
  toggleFridgeItem: async (userId: string, item: string): Promise<string[]>
  // ... 기타 함수들
}
```

### 2. 에러 처리

모든 API 호출에 에러 처리가 추가되었습니다:
- 네트워크 오류 처리
- 401 인증 오류 시 자동 토큰 제거
- Optimistic Update 실패 시 롤백

### 3. 데이터 변환

백엔드 API는 `recipeId` (number)를 반환하지만, 프론트엔드는 `Recipe` 객체가 필요합니다:
- `getPlan`: `recipeId[]` → `Recipe[]` 변환
- `getLikedRecipes`: `recipeId[]` → `Recipe[]` 변환
- `getDislikedRecipes`: `recipeId[]` → `Recipe[]` 변환

---

## 테스트 방법

### 1. 백엔드 서버 실행

```bash
cd backend
npm run start:dev
```

백엔드가 `http://localhost:3001/api`에서 실행됩니다.

### 2. 프론트엔드 서버 실행

```bash
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

### 3. 기능 테스트

1. **로그인**: 카카오 로그인으로 사용자 생성 확인
2. **냉장고**: 재료 추가/삭제가 API로 저장되는지 확인
3. **식단표**: 식단 생성 및 수정이 API로 저장되는지 확인
4. **레시피 선호도**: 좋아요/싫어요가 API로 저장되는지 확인
5. **장보기 목록**: 체크리스트가 API로 저장되는지 확인
6. **식사 완료**: 완료 상태가 API로 저장되는지 확인

---

## 주의사항

### 1. 레시피 데이터

프론트엔드의 `SEED_RECIPES`는 레시피 메타데이터를 제공합니다.
백엔드는 `recipeId`만 저장하고, 프론트엔드에서 `SEED_RECIPES`를 참조하여 `Recipe` 객체로 변환합니다.

### 2. 초기 사용자 데이터

`initUserData`는 이제 빈 함수입니다. 백엔드에서 OAuth 콜백 시 사용자가 자동으로 생성됩니다.

### 3. 세션 리셋

`resetSession`은 좋아요/싫어요 레시피를 모두 삭제합니다.
각 레시피에 대해 DELETE 요청을 보냅니다.

---

## 다음 단계

**Phase 4가 완료되었습니다!** 🎉

이제 다음 단계로 진행할 수 있습니다:

**Phase 5**: 백엔드 및 프론트엔드 배포
- 백엔드: Railway 또는 Render
- 프론트엔드: Vercel (이미 배포됨)
- 환경 변수 설정
- 데이터베이스 마이그레이션

---

## 문제 해결

### API 연결 오류

**오류**: `Failed to load user data`

**해결책**:
1. 백엔드 서버가 실행 중인지 확인
2. `.env` 파일의 `VITE_API_BASE_URL` 확인
3. 브라우저 콘솔에서 네트워크 오류 확인

### 인증 오류

**오류**: `Unauthorized`

**해결책**:
1. JWT 토큰이 유효한지 확인
2. 로그아웃 후 다시 로그인
3. 백엔드의 JWT_SECRET 확인

### 데이터 불일치

**문제**: 프론트엔드와 백엔드 데이터가 일치하지 않음

**해결책**:
1. 브라우저 캐시 및 localStorage 초기화
2. 페이지 새로고침
3. 백엔드 데이터베이스 직접 확인 (Prisma Studio)

---

## 완료 확인 체크리스트

- [x] apiService.ts 생성
- [x] App.tsx에서 dbService → apiService 변경
- [x] 모든 데이터 조회를 API 호출로 전환
- [x] 모든 데이터 수정을 API 호출로 전환
- [x] 에러 처리 추가
- [x] 빌드 성공 확인

**Phase 4 완료!** ✅

