# 잇코노미(Eat-conomy) MVP 배포 가이드

## 배포 전 체크리스트 ✅

### 1. 빌드 테스트 완료
- ✅ `npm run build` 성공적으로 완료
- ✅ `dist` 폴더 생성 확인
- ✅ 빌드 경고: 청크 크기 경고 있음 (기능에는 영향 없음)

### 2. 메타데이터 수정 완료
- ✅ `index.html` 타이틀: "Eat-conomy: 자취생 식비 방어 솔루션"

### 3. Vercel 설정 파일 생성 완료
- ✅ `vercel.json` 생성 완료

---

## Vercel 배포 방법

### 방법 1: Vercel 웹 대시보드 사용 (권장)

1. **Vercel 계정 생성/로그인**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인 (권장)

2. **프로젝트 Import**
   - "Add New..." → "Project" 클릭
   - GitHub 저장소 선택 또는 "Import Git Repository" 클릭
   - 저장소가 없다면:
     - GitHub에 저장소 생성
     - 로컬 프로젝트를 GitHub에 푸시

3. **프로젝트 설정**
   - **Framework Preset**: Vite 선택
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동 감지됨)
   - **Output Directory**: `dist` (자동 감지됨)
   - **Install Command**: `npm install` (자동 감지됨)

4. **환경 변수 설정 (중요!)**
   - "Environment Variables" 섹션 클릭
   - 다음 변수 추가:
     ```
     Key: VITE_GEMINI_API_KEY
     Value: [Gemini API 키 입력]
     ```
   - Environment: Production, Preview, Development 모두 선택
   - "Save" 클릭

5. **배포 실행**
   - "Deploy" 버튼 클릭
   - 배포 완료 대기 (약 1-2분)

6. **배포 URL 확인**
   - 배포 완료 후 제공되는 URL 확인
   - 예: `https://eat-conomy-mvp.vercel.app`

### 방법 2: Vercel CLI 사용

```bash
# 1. Vercel CLI 로그인
vercel login

# 2. 프로젝트 디렉토리에서 배포
cd "/Users/kimsein/Desktop/eat-conomy (1)"
vercel

# 3. 프롬프트에 따라 설정:
# - Set up and deploy? Yes
# - Which scope? [개인 계정 선택]
# - Link to existing project? No
# - Project name: eat-conomy-mvp
# - Directory: ./
# - Override settings? No

# 4. 환경 변수 설정 (대시보드에서 또는 CLI로)
vercel env add VITE_GEMINI_API_KEY production
# 프롬프트에 API 키 입력

# 5. 프로덕션 배포
vercel --prod
```

---

## 환경 변수 설정 방법

### Vercel 대시보드에서 설정

1. 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수 추가:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: [실제 Gemini API 키]
   - **Environment**: Production, Preview, Development 모두 체크
4. Save 클릭
5. **중요**: 환경 변수 추가 후 재배포 필요

### CLI로 설정

```bash
# 프로덕션 환경
vercel env add VITE_GEMINI_API_KEY production

# 프리뷰 환경
vercel env add VITE_GEMINI_API_KEY preview

# 개발 환경
vercel env add VITE_GEMINI_API_KEY development
```

---

## 배포 후 확인 사항

### 필수 체크리스트

- [ ] 배포 URL 접속 확인
- [ ] 로그인 페이지 정상 표시
- [ ] 카카오/Google 로그인 버튼 동작 확인
- [ ] 홈 페이지 로드 확인
- [ ] 냉장고 페이지 접근 확인
- [ ] 식단 생성 기능 테스트
- [ ] AI 팁 기능 테스트 (Gemini API 키 필요)

### 문제 해결

**문제**: AI 기능이 작동하지 않음
- **원인**: 환경 변수 미설정 또는 재배포 필요
- **해결**: 환경 변수 확인 후 재배포

**문제**: 404 에러 발생
- **원인**: SPA 라우팅 설정 문제
- **해결**: `vercel.json`의 `rewrites` 설정 확인

**문제**: 빌드 실패
- **원인**: 의존성 문제 또는 타입 에러
- **해결**: 로컬에서 `npm run build` 재실행하여 에러 확인

---

## 배포 완료 후 전달 사항

배포가 완료되면 다음 정보를 PM에게 전달하세요:

1. **Live URL**: `https://eat-conomy-mvp.vercel.app` (또는 할당된 도메인)
2. **배포 상태**: ✅ 성공
3. **환경 변수 설정**: ✅ 완료 (또는 ⚠️ API 키 필요)

---

## 추가 참고 사항

### 커스텀 도메인 설정 (선택사항)

1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 도메인 제공업체에서 설정

### 성능 최적화

현재 빌드 경고:
- 청크 크기: 968.90 kB (권장: 500 kB 이하)
- 향후 개선: 코드 스플리팅 적용 권장

### 모니터링

- Vercel 대시보드에서 배포 로그 확인 가능
- Analytics 기능 사용 가능 (선택사항)

