# Railway 배포 단계별 가이드

## 현재 상태
- ✅ Railway 프로젝트 생성 완료 (`appealing-compassion`)
- ✅ PostgreSQL 데이터베이스 추가 완료
- ⏳ 백엔드 서비스 배포 진행 중

## 다음 단계

### 1. 프로젝트 링크 (수동)

터미널에서 다음 명령어를 실행하여 프로젝트를 링크하세요:

```bash
cd backend
railway link
```

프롬프트가 나타나면:
1. `seincs's Projects` 선택
2. `appealing-compassion` 프로젝트 선택

### 2. 서비스 확인

링크 완료 후, 다음 MCP 명령어로 서비스 목록을 확인할 수 있습니다:
```
Railway 서비스 목록을 확인해주세요.
```

### 3. 환경 변수 설정

다음 환경 변수들을 설정해야 합니다:

**필수 환경 변수:**
- `NODE_ENV=production`
- `PORT=3001`
- `JWT_SECRET=[32자 이상의 강력한 랜덤 문자열]` (예: `openssl rand -hex 32`로 생성)
- `JWT_EXPIRES_IN=7d`
- `KAKAO_CLIENT_ID=[프로덕션 카카오 REST API 키]`
- `KAKAO_CLIENT_SECRET=[프로덕션 카카오 Client Secret]`
- `KAKAO_REDIRECT_URI=https://[백엔드-도메인].railway.app/api/auth/kakao/callback`
- `FRONTEND_URL=https://[프론트엔드-도메인].vercel.app`

**자동 생성됨:**
- `DATABASE_URL` (PostgreSQL 추가 시 자동 생성)

### 4. 도메인 생성

백엔드 서비스에 도메인을 생성해야 합니다:
```
Railway에 백엔드 서비스를 위한 도메인을 생성해주세요.
```

### 5. 데이터베이스 마이그레이션

배포 완료 후 마이그레이션을 실행해야 합니다:
```
Railway 백엔드 서비스에서 다음 명령어를 실행해주세요:
npx prisma migrate deploy
```

## 빠른 배포 명령어 (MCP 사용)

프로젝트 링크 완료 후, 다음 명령어들을 순서대로 실행하세요:

1. **서비스 확인**
   ```
   Railway 서비스 목록을 확인해주세요.
   ```

2. **환경 변수 설정** (실제 값으로 대체 필요)
   ```
   Railway 백엔드 서비스에 다음 환경 변수들을 설정해주세요:
   - NODE_ENV=production
   - PORT=3001
   - JWT_SECRET=[실제 값]
   - JWT_EXPIRES_IN=7d
   - KAKAO_CLIENT_ID=[실제 값]
   - KAKAO_CLIENT_SECRET=[실제 값]
   - KAKAO_REDIRECT_URI=https://[백엔드-도메인].railway.app/api/auth/kakao/callback
   - FRONTEND_URL=https://[프론트엔드-도메인].vercel.app
   ```

3. **도메인 생성**
   ```
   Railway 백엔드 서비스에 도메인을 생성해주세요.
   ```

4. **배포 실행**
   ```
   Railway 백엔드 서비스를 배포해주세요.
   ```

5. **마이그레이션 실행**
   ```
   Railway 백엔드 서비스에서 다음 명령어를 실행해주세요:
   npx prisma migrate deploy
   ```

6. **배포 상태 확인**
   ```
   Railway 백엔드 서비스의 최근 배포 로그를 확인해주세요.
   ```

## 참고사항

- `KAKAO_REDIRECT_URI`와 `FRONTEND_URL`은 도메인 생성 후 업데이트해야 합니다.
- 카카오 개발자 콘솔에서 Redirect URI를 업데이트해야 합니다.
- 프론트엔드 배포 후 `FRONTEND_URL`을 업데이트해야 합니다.

