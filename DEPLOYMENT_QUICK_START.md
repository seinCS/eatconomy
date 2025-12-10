# 실배포 빠른 시작 가이드

이 가이드는 실배포를 빠르게 시작할 수 있도록 단계별로 안내합니다.

**예상 소요 시간**: 30-60분

---

## 🎯 배포 방법 선택

### 방법 A: Railway MCP Server 사용 (권장) ⚡

**Railway MCP Server**를 사용하면 자연어로 배포 작업을 수행할 수 있습니다.

**장점:**
- 자연어로 배포 명령 실행
- IDE에서 직접 배포 가능
- 빠른 프로토타이핑

**설정 방법:**

1. **Railway CLI 설치 및 인증**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **MCP Server 설정** (Cursor 사용 시)
   - `.cursor/mcp.json` 파일 생성:
   ```json
   {
     "mcpServers": {
       "Railway": {
         "command": "npx",
         "args": ["-y", "@railway/mcp-server"]
       }
     }
   }
   ```

3. **MCP를 통한 배포 예시**
   ```
   Railway에 PostgreSQL 데이터베이스를 배포하고, 
   이 백엔드 디렉토리를 Railway 프로젝트에 연결한 후 배포해주세요.
   환경 변수도 설정해주세요.
   ```

**참고**: [Railway MCP Server 문서](https://docs.railway.com/reference/mcp-server)

### 방법 B: 웹 대시보드 사용 (전통적인 방법)

아래 가이드는 Railway와 Vercel 웹 대시보드를 사용하는 방법입니다.

---

## 🚀 빠른 시작 (3단계)

### 1단계: 백엔드 배포 (Railway) - 15분

#### 1.1 Railway 프로젝트 생성

1. https://railway.app 접속 → GitHub로 로그인
2. "New Project" → "Deploy from GitHub repo"
3. 저장소 선택

#### 1.2 PostgreSQL 데이터베이스 추가

1. "New" → "Database" → "Add PostgreSQL"
2. 자동으로 `DATABASE_URL` 환경 변수 생성됨

#### 1.3 백엔드 서비스 배포

1. "New" → "GitHub Repo" → 저장소 선택
2. **Settings** → **Root Directory**: `backend` 설정 (중요!)
3. **Settings** → **Build Command**: `npm run build && npx prisma generate`
4. **Settings** → **Start Command**: `npm run start:prod`

#### 1.4 환경 변수 설정

**Variables** 탭에서 추가:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=[32자 이상의 강력한 랜덤 문자열]
JWT_EXPIRES_IN=7d
KAKAO_CLIENT_ID=[프로덕션 카카오 REST API 키]
KAKAO_CLIENT_SECRET=[프로덕션 카카오 Client Secret]
KAKAO_REDIRECT_URI=https://[백엔드-도메인].railway.app/api/auth/kakao/callback
FRONTEND_URL=https://[프론트엔드-도메인].vercel.app
```

**중요**: 
- `DATABASE_URL`은 PostgreSQL 추가 시 자동 생성됨
- `KAKAO_REDIRECT_URI`와 `FRONTEND_URL`은 배포 후 실제 도메인으로 업데이트 필요

#### 1.5 데이터베이스 마이그레이션

배포 완료 후:

1. Railway 대시보드 → 서비스 → "Run Command"
2. Command: `npx prisma migrate deploy`
3. 실행

#### 1.6 배포 URL 확인

- Railway 대시보드 → Settings → Domains
- 생성된 도메인 복사 (예: `your-app.up.railway.app`)

---

### 2단계: 카카오 개발자 콘솔 설정 - 5분

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

---

### 3단계: 프론트엔드 배포 (Vercel) - 10분

#### 3.1 Vercel 프로젝트 생성

1. https://vercel.com 접속 → GitHub로 로그인
2. "Add New..." → "Project"
3. 저장소 선택

#### 3.2 프로젝트 설정

- Framework: Vite (자동 감지)
- Root Directory: `./`
- Build Command: `npm run build` (자동 감지)
- Output Directory: `dist` (자동 감지)

#### 3.3 환경 변수 설정

**Settings** → **Environment Variables**:

```env
VITE_API_BASE_URL=https://[백엔드-도메인].railway.app/api
VITE_KAKAO_CLIENT_ID=[프로덕션 카카오 REST API 키]
VITE_KAKAO_REDIRECT_URI=https://[백엔드-도메인].railway.app/api/auth/kakao/callback
VITE_GEMINI_API_KEY=[Gemini API 키] (선택사항)
```

**중요**: 
- Environment: Production, Preview, Development 모두 선택
- 환경 변수 추가 후 **재배포 필요**

#### 3.4 배포 실행

1. "Deploy" 버튼 클릭
2. 배포 완료 대기 (1-2분)
3. 배포 URL 확인 (예: `your-app.vercel.app`)

#### 3.5 백엔드 환경 변수 업데이트

프론트엔드 배포 완료 후, Railway에서:

1. `FRONTEND_URL` 환경 변수 업데이트:
   ```
   FRONTEND_URL=https://[프론트엔드-도메인].vercel.app
   ```
2. **재배포** 실행

---

## ✅ 배포 확인

### 필수 테스트

1. **프론트엔드 접속**
   ```
   https://[프론트엔드-도메인].vercel.app
   ```
   - 로그인 페이지 정상 표시 확인

2. **카카오 로그인 테스트**
   - 카카오 로그인 버튼 클릭
   - 로그인 성공 후 홈 화면 이동 확인

3. **기능 테스트**
   - 냉장고 재료 추가
   - 식단표 생성
   - 장보기 목록 확인

---

## 🔧 문제 해결

### 로그인 실패

1. **카카오 개발자 콘솔 확인**
   - Redirect URI가 정확한지 확인
   - 백엔드 도메인과 일치하는지 확인

2. **환경 변수 확인**
   - Railway: `KAKAO_REDIRECT_URI` 확인
   - Vercel: `VITE_KAKAO_REDIRECT_URI` 확인
   - 두 값이 일치해야 함

3. **로그 확인**
   - Railway 로그에서 `[Kakao Callback]` 확인
   - 브라우저 콘솔에서 에러 확인

### CORS 에러

- Railway의 `FRONTEND_URL` 환경 변수 확인
- 프론트엔드 도메인과 정확히 일치해야 함
- 환경 변수 변경 후 재배포 필요

### 데이터베이스 연결 실패

- Railway에서 PostgreSQL 서비스가 실행 중인지 확인
- `DATABASE_URL` 환경 변수 확인
- 마이그레이션 실행 확인

---

## 📝 배포 정보 기록

배포 완료 후 다음 정보를 기록하세요:

```markdown
## 배포 정보

**배포 일시**: [날짜]

**프론트엔드:**
- URL: https://[도메인].vercel.app
- 플랫폼: Vercel

**백엔드:**
- URL: https://[도메인].railway.app
- 플랫폼: Railway
- 데이터베이스: Railway PostgreSQL

**카카오 OAuth:**
- Redirect URI: ✅ 등록 완료
- Web 플랫폼: ✅ 등록 완료
```

---

## 📚 상세 가이드

더 자세한 내용은 `PRODUCTION_DEPLOYMENT.md`를 참고하세요.

---

**다음 단계**: 배포 완료 후 `PRODUCTION_DEPLOYMENT.md`의 "배포 후 확인 사항" 섹션을 따라 테스트하세요.

