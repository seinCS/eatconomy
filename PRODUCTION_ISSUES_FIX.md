# 프로덕션 문제 해결 가이드

## 발견된 문제

### 1. 카카오 클라이언트 ID 문제 ⚠️

**증상**:
- 콘솔에 개발용 클라이언트 ID (`28fd9b104f...`)가 표시됨
- 카카오 인증 실패 메시지 표시

**원인**:
- Vercel 환경 변수가 빌드 시점에 포함되지 않음
- 또는 환경 변수가 설정되지 않음

**해결 방법**:

1. **Vercel 대시보드에서 환경 변수 확인**
   - https://vercel.com → 프로젝트 선택
   - Settings → Environment Variables
   - 다음 변수들이 **Production** 환경에 설정되어 있는지 확인:
     ```
     VITE_KAKAO_CLIENT_ID=[프로덕션 카카오 REST API 키]
     VITE_KAKAO_REDIRECT_URI=https://eatconomy-production.up.railway.app/api/auth/kakao/callback
     VITE_API_BASE_URL=https://eatconomy-production.up.railway.app/api
     ```

2. **환경 변수 재설정**
   - 각 변수를 삭제하고 다시 추가
   - **중요**: Environment를 **Production**, **Preview**, **Development** 모두 선택
   - Save 클릭

3. **재배포 실행**
   - Deployments 탭 → 최신 배포 → Redeploy
   - 또는 새 커밋을 푸시하여 자동 재배포

4. **빌드 로그 확인**
   - Deployments → 최신 배포 → Build Logs
   - 환경 변수가 빌드에 포함되었는지 확인

### 2. Tailwind CSS CDN 경고 ⚠️

**증상**:
- 콘솔에 "cdn.tailwindcss.com should not be used in production" 경고

**원인**:
- `index.html`에서 Tailwind CSS CDN 사용 중

**해결 방법** (선택사항, 권장):

Tailwind CSS를 PostCSS 플러그인으로 전환:

1. **의존성 설치**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   ```

2. **Tailwind 설정 파일 생성**
   ```bash
   npx tailwindcss init -p
   ```

3. **tailwind.config.js 설정**
   ```js
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
       "./pages/**/*.{js,ts,jsx,tsx}",
       "./components/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

4. **CSS 파일 생성** (`src/index.css` 또는 `index.css`)
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

5. **index.html 수정**
   - `<script src="https://cdn.tailwindcss.com"></script>` 제거
   - CSS 파일 import 추가

6. **재배포**

**참고**: 현재 CDN 방식도 작동하지만, 프로덕션에서는 PostCSS 방식이 더 최적화됩니다.

### 3. 카카오 개발자 콘솔 Redirect URI 확인 ✅

**확인 사항**:

1. **카카오 개발자 콘솔 접속**
   - https://developers.kakao.com
   - 앱 선택

2. **Redirect URI 확인**
   - 제품 설정 → 카카오 로그인
   - 다음 URI가 등록되어 있는지 확인:
     ```
     https://eatconomy-production.up.railway.app/api/auth/kakao/callback
     ```

3. **Web 플랫폼 확인**
   - 앱 설정 → 플랫폼
   - 다음 도메인이 등록되어 있는지 확인:
     ```
     https://eatconomy.vercel.app
     ```

## 즉시 해결 체크리스트

- [ ] Vercel 환경 변수 확인 (`VITE_KAKAO_CLIENT_ID`가 프로덕션 값인지)
- [ ] Vercel 환경 변수 재설정 (Production, Preview, Development 모두 선택)
- [ ] Vercel 재배포 실행
- [ ] 카카오 개발자 콘솔 Redirect URI 확인
- [ ] 카카오 개발자 콘솔 Web 플랫폼 확인
- [ ] 브라우저 콘솔에서 환경 변수 확인:
   ```javascript
   console.log(import.meta.env.VITE_KAKAO_CLIENT_ID);
   console.log(import.meta.env.VITE_KAKAO_REDIRECT_URI);
   ```

## 환경 변수 확인 방법

재배포 후 브라우저 개발자 도구(F12) → Console에서:

```javascript
// 환경 변수 확인
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Kakao Client ID:', import.meta.env.VITE_KAKAO_CLIENT_ID);
console.log('Kakao Redirect URI:', import.meta.env.VITE_KAKAO_REDIRECT_URI);

// 개발용 ID가 아닌지 확인
if (import.meta.env.VITE_KAKAO_CLIENT_ID === '28fd9b104f782ea062b1cac9e285645a') {
  console.error('❌ 개발용 클라이언트 ID가 사용되고 있습니다!');
  console.error('Vercel 환경 변수를 확인하고 재배포하세요.');
}
```

## 예상 결과

환경 변수가 올바르게 설정되면:
- ✅ 개발용 클라이언트 ID가 아닌 프로덕션 ID가 사용됨
- ✅ 카카오 로그인이 정상 작동
- ✅ 인증 실패 메시지가 사라짐

Tailwind CSS 경고는 기능에는 영향을 주지 않지만, 성능 최적화를 위해 PostCSS로 전환하는 것을 권장합니다.

