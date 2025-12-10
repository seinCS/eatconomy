# Railway 배포 즉시 실행 가이드

## 현재 상태
- ✅ Railway 프로젝트 생성 완료
- ✅ PostgreSQL 데이터베이스 추가 완료
- ⏳ 백엔드 서비스 배포 필요

## 생성된 JWT_SECRET
```
dc923844e14d5fdca5c2738a9f867b7f73c76e0709410e9c98ad42cfd1f20928
```

## Railway 대시보드에서 설정하기

### 1. 백엔드 서비스 확인 및 설정

1. https://railway.app 접속
2. `appealing-compassion` 프로젝트 선택
3. `eatconomy` 서비스 클릭
4. **Settings** 탭에서 확인:
   - **Root Directory**: `backend` ✅
   - **Build Command**: `npm run build && npx prisma generate` ✅
   - **Start Command**: `npm run start:prod` ✅

### 2. 환경 변수 설정

**Variables** 탭에서 다음 환경 변수들을 추가하세요:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=dc923844e14d5fdca5c2738a9f867b7f73c76e0709410e9c98ad42cfd1f20928
JWT_EXPIRES_IN=7d
KAKAO_CLIENT_ID=[프로덕션 카카오 REST API 키 입력 필요]
KAKAO_CLIENT_SECRET=[프로덕션 카카오 Client Secret 입력 필요]
KAKAO_REDIRECT_URI=https://eatconomy-production.up.railway.app/api/auth/kakao/callback
FRONTEND_URL=https://[프론트엔드-도메인].vercel.app  (⚠️ 프론트엔드 배포 후 실제 도메인으로 업데이트 필요)
```

**참고:**
- `DATABASE_URL`은 PostgreSQL 추가 시 자동 생성됨
- `KAKAO_REDIRECT_URI`와 `FRONTEND_URL`은 도메인 생성 후 업데이트 필요

### 3. 도메인 생성

1. **Settings** → **Domains** 탭
2. **Generate Domain** 클릭
3. 생성된 도메인 복사 (예: `eatconomy-production.up.railway.app`)
4. 위의 `KAKAO_REDIRECT_URI`에 도메인 업데이트

### 4. 배포 확인

1. **Deployments** 탭에서 배포 상태 확인
2. 배포가 완료되면 **Logs** 탭에서 로그 확인
3. 정상 작동 확인: `🚀 Backend server is running on: http://localhost:3001/api`

### 5. 데이터베이스 마이그레이션

배포 완료 후:

1. **eatconomy** 서비스 → **Deployments** 탭
2. 최신 배포 클릭 → **Run Command**
3. Command 입력: `npx prisma migrate deploy`
4. 실행

### 6. 카카오 개발자 콘솔 설정

1. https://developers.kakao.com 접속
2. 앱 선택 → **제품 설정** → **카카오 로그인**
3. **Redirect URI** 추가:
   ```
   https://[백엔드-도메인].railway.app/api/auth/kakao/callback
   ```
4. **앱 설정** → **플랫폼** → Web 플랫폼 등록:
   ```
   https://[프론트엔드-도메인].vercel.app
   ```

## MCP를 통한 추가 작업

대시보드 설정 완료 후, 다음 MCP 명령어로 추가 작업을 수행할 수 있습니다:

1. **배포 상태 확인**
   ```
   Railway 백엔드 서비스의 최근 배포 로그를 확인해주세요.
   ```

2. **환경 변수 확인**
   ```
   Railway 백엔드 서비스의 환경 변수를 확인해주세요.
   ```

3. **도메인 확인**
   ```
   Railway 백엔드 서비스의 도메인을 확인해주세요.
   ```

## 다음 단계

백엔드 배포 완료 후:
1. 프론트엔드 배포 (Vercel)
2. 카카오 개발자 콘솔 설정 업데이트
3. 환경 변수 업데이트 (도메인 반영)

