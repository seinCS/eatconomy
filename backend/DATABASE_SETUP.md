# 데이터베이스 설정 가이드

## 1. PostgreSQL 설치

### macOS (Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Windows
[PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 설치 프로그램 다운로드

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## 2. 데이터베이스 생성

PostgreSQL에 접속하여 데이터베이스를 생성합니다:

### macOS (Homebrew 설치 시)

Homebrew로 설치한 PostgreSQL은 기본 사용자명이 현재 사용자명입니다:

```bash
# PostgreSQL 접속 (현재 사용자명으로)
psql -U $(whoami) -d postgres

# 또는 간단하게
psql postgres

# 데이터베이스 생성
CREATE DATABASE eatconomy;

# 종료
\q
```

### Linux/Windows

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE eatconomy;

# 사용자 생성 (선택사항)
CREATE USER eatconomy_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE eatconomy TO eatconomy_user;

# 종료
\q
```

**참고**: macOS에서 `role "postgres" does not exist` 오류가 발생하면, 현재 사용자명으로 접속하세요.

## 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력합니다:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/eatconomy?schema=public"
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
FRONTEND_URL=http://localhost:3000
```

**참고**: `.env.example` 파일을 복사하여 `.env` 파일을 만들 수 있습니다:
```bash
cp .env.example .env
# 그 다음 .env 파일을 편집하여 실제 값으로 변경
```

## 4. Prisma 마이그레이션 실행

### 첫 번째 마이그레이션 (초기 스키마 생성)

```bash
cd backend
npx prisma migrate dev --name init
```

이 명령은:
1. 데이터베이스에 테이블을 생성합니다
2. Prisma Client를 자동으로 생성합니다
3. 마이그레이션 파일을 `prisma/migrations` 폴더에 저장합니다

### Prisma Client 생성 (마이그레이션 후)

```bash
npx prisma generate
```

## 5. 데이터베이스 확인

### Prisma Studio 실행 (GUI로 데이터베이스 확인)

```bash
npx prisma studio
```

브라우저에서 `http://localhost:5555`로 접속하여 데이터베이스를 확인할 수 있습니다.

### SQL로 직접 확인

**macOS (Homebrew)**:
```bash
psql -U $(whoami) -d eatconomy
# 또는
psql eatconomy
```

**Linux/Windows**:
```bash
psql -U postgres -d eatconomy
```

```sql
# 테이블 목록 확인
\dt

# 특정 테이블 구조 확인
\d users

# 종료
\q
```

## 6. 마이그레이션 관리

### 새로운 마이그레이션 생성 (스키마 변경 후)

```bash
npx prisma migrate dev --name migration_name
```

### 프로덕션 환경에서 마이그레이션 적용

```bash
npx prisma migrate deploy
```

### 마이그레이션 되돌리기 (개발 환경)

```bash
npx prisma migrate reset
```

**주의**: 이 명령은 모든 데이터를 삭제하고 처음부터 다시 마이그레이션합니다.

## 7. 스키마 변경 후 Prisma Client 재생성

스키마를 변경한 후에는 항상 Prisma Client를 재생성해야 합니다:

```bash
npx prisma generate
```

## 8. 문제 해결

### 연결 오류

**오류**: `Can't reach database server`

**해결책**:
1. PostgreSQL 서비스가 실행 중인지 확인
2. `DATABASE_URL`이 올바른지 확인
3. 방화벽 설정 확인

### 인증 오류

**오류**: `password authentication failed`

**해결책**:
1. `.env` 파일의 `DATABASE_URL`에서 사용자명과 비밀번호 확인
2. PostgreSQL 사용자 권한 확인

### 마이그레이션 오류

**오류**: `Migration failed`

**해결책**:
1. 데이터베이스가 올바르게 생성되었는지 확인
2. 기존 마이그레이션 파일과 충돌이 없는지 확인
3. 필요시 `npx prisma migrate reset`으로 초기화

## 9. 개발 환경 vs 프로덕션 환경

### 개발 환경
- `npx prisma migrate dev` 사용
- 자동으로 마이그레이션 파일 생성
- 개발 중 스키마 변경 시 자동 감지

### 프로덕션 환경
- `npx prisma migrate deploy` 사용
- 기존 마이그레이션 파일만 적용
- 스키마 변경 없이 안전하게 적용

## 10. 다음 단계

데이터베이스 설정이 완료되면:

1. 백엔드 서버 실행: `npm run start:dev`
2. API 엔드포인트 테스트
3. 프론트엔드와 연동

---

## 참고 자료

- [Prisma 공식 문서](https://www.prisma.io/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [NestJS Prisma 가이드](https://docs.nestjs.com/recipes/prisma)

