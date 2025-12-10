# 실배포 가이드 (Production Deployment)

이 문서는 Eat-conomy 프로젝트를 프로덕션 환경에 배포하는 전체 과정을 안내합니다.

**배포 순서**: 백엔드 → 데이터베이스 → 프론트엔드

---

## 🎯 배포 방법 선택

### 방법 A: Railway MCP Server 사용 (권장) ⚡

**Railway MCP Server**를 사용하면 자연어로 배포 작업을 수행할 수 있습니다.

**설정:**
1. Railway CLI 설치: `npm install -g @railway/cli && railway login`
2. MCP Server 설정 (Cursor: `.cursor/mcp.json`, VS Code: `.vscode/mcp.json`)
3. 자연어로 배포 명령 실행

**예시 명령:**
- "Railway에 PostgreSQL 데이터베이스를 배포해주세요"
- "이 백엔드 디렉토리를 Railway 프로젝트에 연결하고 배포해주세요"
- "환경 변수를 설정해주세요"

**참고**: [Railway MCP Server 문서](https://docs.railway.com/reference/mcp-server)

### 방법 B: 웹 대시보드 사용

아래 가이드는 Railway와 Vercel 웹 대시보드를 사용하는 전통적인 방법입니다.

---

## 📋 배포 전 체크리스트

### 필수 준비사항

- [ ] GitHub 저장소에 코드 푸시 완료
- [ ] 로컬에서 빌드 테스트 완료 (`npm run build`)
- [ ] 카카오 개발자 콘솔 앱 생성 완료
- [ ] 프로덕션용 카카오 앱 키 준비
- [ ] Railway 계정 생성 (백엔드 배포용)
- [ ] Vercel 계정 생성 (프론트엔드 배포용)

---

## 1단계: 백엔드 배포 (Railway)

### 1.1 Railway 프로젝트 생성

1. **Railway 접속**
   - https://railway.app 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - 저장소 선택 또는 연결

3. **서비스 추가**
   - "New" → "Database" → "Add PostgreSQL" 선택
   - PostgreSQL 데이터베이스 생성 (자동으로 `DATABASE_URL` 환경 변수 추가됨)

### 1.2 백엔드 서비스 배포

1. **서비스 추가**
   - "New" → "GitHub Repo" 선택
   - 저장소 선택
   - **Root Directory**: `backend` 설정 (중요!)

2. **빌드 설정**
   - Settings → Build Command: `npm run build`
   - Settings → Start Command: `npm run start:prod`
   - Settings → Root Directory: `backend`

### 1.3 환경 변수 설정

Railway 대시보드 → Variables 탭에서 다음 환경 변수 추가:

```env
# 데이터베이스 (자동 생성됨)
DATABASE_URL=postgresql://... (Railway가 자동 생성)

# 서버 설정
PORT=3001
NODE_ENV=production

# JWT 설정 (강력한 시크릿 키 필수!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# 카카오 OAuth (프로덕션용)
KAKAO_CLIENT_ID=your-production-kakao-client-id
KAKAO_CLIENT_SECRET=your-production-kakao-client-secret
KAKAO_REDIRECT_URI=https://your-backend-domain.railway.app/api/auth/kakao/callback

# 프론트엔드 URL (나중에 설정)
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

**중요**: 
- `JWT_SECRET`은 최소 32자 이상의 강력한 랜덤 문자열 사용
- `KAKAO_REDIRECT_URI`는 배포 후 실제 도메인으로 업데이트 필요
- `FRONTEND_URL`은 프론트엔드 배포 후 설정

### 1.4 데이터베이스 마이그레이션

Railway에서 배포가 완료되면:

1. **Railway CLI 설치** (선택사항)
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **마이그레이션 실행**
   ```bash
   cd backend
   railway link  # 프로젝트 연결
   railway run npx prisma migrate deploy
   ```

   또는 Railway 대시보드에서:
   - 서비스 → Deployments → "Run Command"
   - Command: `npx prisma migrate deploy`

### 1.5 배포 확인

1. **배포 URL 확인**
   - Railway 대시보드 → Settings → Domains
   - 생성된 도메인 확인 (예: `your-app.up.railway.app`)

2. **헬스 체크**
   ```bash
   curl https://your-backend-domain.railway.app/api
   ```
   응답: `{"message":"Eat-conomy API"}` 확인

3. **로그 확인**
   - Railway 대시보드 → Deployments → 로그 확인
   - `🚀 Backend server is running on: ...` 메시지 확인

---

## 2단계: 카카오 개발자 콘솔 설정

### 2.1 프로덕션 Redirect URI 등록

1. **카카오 개발자 콘솔 접속**
   - https://developers.kakao.com 접속
   - 앱 선택

2. **카카오 로그인 설정**
   - 제품 설정 → 카카오 로그인
   - Redirect URI 추가:
     ```
     https://your-backend-domain.railway.app/api/auth/kakao/callback
     ```

3. **플랫폼 설정**
   - 앱 설정 → 플랫폼
   - Web 플랫폼 등록:
     ```
     https://your-frontend-domain.vercel.app
     ```

### 2.2 프로덕션 앱 키 확인

- REST API 키: 프로덕션용 사용 (또는 새 앱 생성)
- Client Secret: 보안 설정에서 생성 (선택사항, 권장)

---

## 3단계: 프론트엔드 배포 (Vercel)

### 3.1 Vercel 프로젝트 생성

1. **Vercel 접속**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 Import**
   - "Add New..." → "Project" 클릭
   - GitHub 저장소 선택

3. **프로젝트 설정**
   - **Framework Preset**: Vite (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동 감지)
   - **Output Directory**: `dist` (자동 감지)

### 3.2 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 추가:

```env
# 백엔드 API URL
VITE_API_BASE_URL=https://your-backend-domain.railway.app/api

# 카카오 OAuth (프로덕션)
VITE_KAKAO_CLIENT_ID=your-production-kakao-client-id
VITE_KAKAO_REDIRECT_URI=https://your-backend-domain.railway.app/api/auth/kakao/callback

# Google Gemini API (선택사항)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

**중요**: 
- Environment: Production, Preview, Development 모두 선택
- 환경 변수 추가 후 **재배포 필요**

### 3.3 배포 실행

1. **배포 시작**
   - "Deploy" 버튼 클릭
   - 배포 완료 대기 (약 1-2분)

2. **배포 URL 확인**
   - 배포 완료 후 제공되는 URL 확인
   - 예: `https://eat-conomy.vercel.app`

### 3.4 백엔드 환경 변수 업데이트

프론트엔드 배포가 완료되면, Railway에서 `FRONTEND_URL` 업데이트:

```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

**재배포 필요**: 환경 변수 변경 후 Railway에서 재배포

---

## 4단계: 최종 설정 및 확인

### 4.1 카카오 Redirect URI 최종 확인

카카오 개발자 콘솔에서 실제 배포된 URL로 Redirect URI 확인:

- 백엔드: `https://your-backend-domain.railway.app/api/auth/kakao/callback`
- 프론트엔드: `https://your-frontend-domain.vercel.app`

### 4.2 기능 테스트

#### 필수 테스트 항목

- [ ] **프론트엔드 접속**
  - URL: `https://your-frontend-domain.vercel.app`
  - 로그인 페이지 정상 표시 확인

- [ ] **카카오 로그인**
  - 카카오 로그인 버튼 클릭
  - 카카오 로그인 화면 표시
  - 로그인 후 홈 화면으로 리다이렉트 확인

- [ ] **기본 기능**
  - 냉장고 재료 추가/삭제
  - 레시피 스와이프 (좋아요/싫어요)
  - 식단표 생성 및 편집
  - 장보기 목록 확인
  - 프로필 설정

- [ ] **API 호출**
  - 브라우저 개발자 도구 → Network 탭
  - API 호출이 정상적으로 이루어지는지 확인
  - 401 에러 없는지 확인

### 4.3 로그 모니터링

**Railway 로그 확인:**
- Railway 대시보드 → Deployments → 로그
- 에러 메시지 확인
- `[Kakao Callback]` 로그 확인

**Vercel 로그 확인:**
- Vercel 대시보드 → Deployments → Functions Logs
- 빌드 로그 확인

---

## 5단계: 문제 해결

### 일반적인 문제

#### 1. 로그인 실패

**증상**: 카카오 로그인 후 에러 페이지 표시

**확인 사항:**
- [ ] 카카오 개발자 콘솔의 Redirect URI가 정확한지 확인
- [ ] 백엔드 환경 변수 `KAKAO_REDIRECT_URI` 확인
- [ ] 프론트엔드 환경 변수 `VITE_KAKAO_REDIRECT_URI` 확인
- [ ] Railway 로그에서 에러 메시지 확인

**해결:**
```bash
# Railway 로그 확인
railway logs

# 또는 Vercel Functions 로그 확인
```

#### 2. CORS 에러

**증상**: 브라우저 콘솔에 CORS 에러 표시

**확인 사항:**
- [ ] 백엔드 `FRONTEND_URL` 환경 변수가 정확한지 확인
- [ ] `main.ts`의 CORS 설정 확인

**해결:**
Railway 환경 변수에서 `FRONTEND_URL` 업데이트 후 재배포

#### 3. 데이터베이스 연결 실패

**증상**: Railway에서 서버 시작 실패

**확인 사항:**
- [ ] `DATABASE_URL` 환경 변수 확인
- [ ] PostgreSQL 서비스가 실행 중인지 확인
- [ ] 마이그레이션이 실행되었는지 확인

**해결:**
```bash
# Railway에서 마이그레이션 실행
railway run npx prisma migrate deploy
```

#### 4. 환경 변수 미적용

**증상**: 환경 변수를 설정했지만 적용되지 않음

**해결:**
- 환경 변수 추가 후 **재배포 필수**
- Vercel: Deployments → Redeploy
- Railway: Deployments → Redeploy

---

## 6단계: 배포 완료 체크리스트

### 배포 정보 기록

다음 정보를 문서화하세요:

```markdown
## 배포 정보

**배포 일시**: 2024년 12월 XX일

**프론트엔드:**
- URL: https://your-frontend-domain.vercel.app
- 플랫폼: Vercel
- 환경 변수: ✅ 설정 완료

**백엔드:**
- URL: https://your-backend-domain.railway.app
- 플랫폼: Railway
- 데이터베이스: Railway PostgreSQL
- 환경 변수: ✅ 설정 완료

**카카오 OAuth:**
- 앱 키: [앱 이름]
- Redirect URI: ✅ 등록 완료
```

### 보안 체크리스트

- [ ] 프로덕션 `JWT_SECRET`이 강력한지 확인 (32자 이상)
- [ ] 환경 변수가 Git에 커밋되지 않았는지 확인
- [ ] 카카오 Client Secret 설정 (선택사항, 권장)
- [ ] Railway와 Vercel의 환경 변수 보안 설정 확인

---

## 7단계: 모니터링 및 유지보수

### 정기 점검 사항

1. **로그 모니터링**
   - Railway: 주기적으로 로그 확인
   - Vercel: Functions 로그 확인

2. **성능 모니터링**
   - Vercel Analytics 사용 (선택사항)
   - Railway Metrics 확인

3. **데이터베이스 백업**
   - Railway PostgreSQL 자동 백업 확인
   - 필요시 수동 백업 설정

### 업데이트 배포

코드 변경 후 배포:

**Vercel:**
- GitHub에 푸시하면 자동 배포
- 또는 수동으로 Redeploy

**Railway:**
- GitHub에 푸시하면 자동 배포
- 또는 수동으로 Redeploy

---

## 참고 자료

- [Railway 공식 문서](https://docs.railway.app/)
- [Vercel 공식 문서](https://vercel.com/docs)
- [카카오 개발자 문서](https://developers.kakao.com/docs/latest/ko/tutorial/start)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment)

---

## 지원

배포 중 문제가 발생하면:

1. 이 문서의 [문제 해결](#5단계-문제-해결) 섹션 확인
2. Railway/Vercel 로그 확인
3. 브라우저 개발자 도구 콘솔 확인
4. `HANDOVER.md`의 문제 해결 섹션 참고

---

**마지막 업데이트**: 2024년 12월

