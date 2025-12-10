# Phase 1 데이터베이스 설정 완료 가이드

## 완료된 작업

### ✅ Prisma 스키마 설계
- 모든 모델 정의 완료
- 관계 설정 완료
- 인덱스 및 제약 조건 설정 완료

### ✅ Prisma Client 생성 준비
- Prisma 설치 확인
- 스키마 포맷팅 완료

### ✅ 데이터베이스 설정 가이드 작성
- `DATABASE_SETUP.md` - 상세한 데이터베이스 설정 가이드
- `.env.example` - 환경 변수 예제 파일

### ✅ npm 스크립트 추가
- `npm run prisma:generate` - Prisma Client 생성
- `npm run prisma:migrate` - 마이그레이션 실행
- `npm run prisma:studio` - Prisma Studio 실행
- `npm run prisma:reset` - 마이그레이션 리셋

---

## 다음 단계: 실제 데이터베이스 설정

### 1. PostgreSQL 설치 및 실행

PostgreSQL이 설치되어 있지 않다면 설치하세요:

**macOS**:
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows/Linux**: 
`DATABASE_SETUP.md` 파일 참고

### 2. 데이터베이스 생성

**macOS (Homebrew 설치 시)**:
```bash
# PostgreSQL 접속 (현재 사용자명으로)
psql postgres
# 또는
psql -U $(whoami) -d postgres

# 데이터베이스 생성
CREATE DATABASE eatconomy;

# 종료
\q
```

**Linux/Windows**:
```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE eatconomy;

# 종료
\q
```

**참고**: macOS에서 `role "postgres" does not exist` 오류가 발생하면, 현재 사용자명으로 접속하세요.

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/eatconomy?schema=public"
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
FRONTEND_URL=http://localhost:3000
```

**참고**: `.env.example` 파일을 복사하여 사용할 수 있습니다.

### 4. 마이그레이션 실행

```bash
cd backend
npm run prisma:migrate
# 또는
npx prisma migrate dev --name init
```

이 명령은:
- 데이터베이스에 모든 테이블을 생성합니다
- Prisma Client를 자동으로 생성합니다
- 마이그레이션 파일을 `prisma/migrations` 폴더에 저장합니다

### 5. 데이터베이스 확인

```bash
# Prisma Studio 실행 (GUI)
npm run prisma:studio

# 또는 SQL로 확인
psql -U postgres -d eatconomy
\dt  # 테이블 목록
```

---

## 생성될 테이블 목록

마이그레이션 실행 후 다음 테이블이 생성됩니다:

1. **users** - 사용자 정보
2. **user_preferences** - 사용자 선호도
3. **fridge_items** - 냉장고 재료
4. **plans** - 주간 식단표
5. **liked_recipes** - 좋아요한 레시피
6. **disliked_recipes** - 싫어요한 레시피
7. **shopping_checks** - 장보기 체크리스트
8. **meal_finished** - 식사 완료 상태

---

## 문제 해결

### Prisma Client 생성 오류

**오류**: `Prisma Client has not been generated yet`

**해결책**:
```bash
npm run prisma:generate
```

### 데이터베이스 연결 오류

**오류**: `Can't reach database server`

**해결책**:
1. PostgreSQL 서비스가 실행 중인지 확인
2. `.env` 파일의 `DATABASE_URL` 확인
3. 데이터베이스가 생성되었는지 확인

### 마이그레이션 오류

**오류**: `Migration failed`

**해결책**:
1. 데이터베이스 연결 확인
2. 기존 테이블과 충돌이 없는지 확인
3. 필요시 `npm run prisma:reset`으로 초기화

---

## 완료 확인

다음 명령으로 데이터베이스 설정이 완료되었는지 확인할 수 있습니다:

```bash
# 1. Prisma Client 생성 확인
npm run prisma:generate

# 2. 마이그레이션 상태 확인
npx prisma migrate status

# 3. Prisma Studio로 데이터베이스 확인
npm run prisma:studio
```

---

## 참고 문서

- `DATABASE_SETUP.md` - 상세한 데이터베이스 설정 가이드
- [Prisma 공식 문서](https://www.prisma.io/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)

