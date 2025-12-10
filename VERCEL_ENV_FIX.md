# Vercel 환경 변수 설정 가이드

## 문제 진단

프론트엔드가 로드되지 않는 원인은 **환경 변수 미설정**일 가능성이 높습니다.

`utils/env.ts` 파일에서 프로덕션 환경에서 다음 환경 변수가 없으면 에러를 던집니다:
- `VITE_KAKAO_CLIENT_ID`
- `VITE_KAKAO_REDIRECT_URI`

## 해결 방법

### 1. Vercel 대시보드에서 환경 변수 설정

1. **Vercel 대시보드 접속**
   - https://vercel.com 접속
   - 프로젝트 선택 (`eatconomy`)

2. **Settings → Environment Variables** 이동

3. **다음 환경 변수 추가**:

```env
VITE_API_BASE_URL=https://eatconomy-production.up.railway.app/api
VITE_KAKAO_CLIENT_ID=[프로덕션 카카오 REST API 키]
VITE_KAKAO_REDIRECT_URI=https://eatconomy-production.up.railway.app/api/auth/kakao/callback
```

**중요**: 
- Environment: **Production**, **Preview**, **Development** 모두 선택
- 각 변수마다 3개의 환경에 모두 추가

4. **재배포 실행**
   - 환경 변수 추가 후 자동으로 재배포가 시작됩니다
   - 또는 Deployments 탭에서 수동으로 재배포

### 2. 환경 변수 확인

재배포 후 브라우저 개발자 도구(F12) → Console 탭에서 확인:

```javascript
// 환경 변수 확인
console.log(import.meta.env.VITE_API_BASE_URL);
console.log(import.meta.env.VITE_KAKAO_CLIENT_ID);
console.log(import.meta.env.VITE_KAKAO_REDIRECT_URI);
```

### 3. 빌드 로그 확인

Vercel 대시보드 → Deployments → 최신 배포 → Build Logs 확인

에러가 있다면 확인:
- 환경 변수가 빌드 시 포함되었는지
- 빌드가 성공적으로 완료되었는지

## 필수 환경 변수 목록

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `VITE_API_BASE_URL` | `https://eatconomy-production.up.railway.app/api` | 백엔드 API URL |
| `VITE_KAKAO_CLIENT_ID` | 프로덕션 카카오 REST API 키 | 카카오 로그인용 |
| `VITE_KAKAO_REDIRECT_URI` | `https://eatconomy-production.up.railway.app/api/auth/kakao/callback` | 카카오 콜백 URL |
| `VITE_GEMINI_API_KEY` | (선택사항) | Gemini API 키 |

## 문제 해결 체크리스트

- [ ] Vercel 환경 변수가 모두 설정되었는지 확인
- [ ] Production, Preview, Development 모두 선택했는지 확인
- [ ] 환경 변수 추가 후 재배포했는지 확인
- [ ] 브라우저 콘솔에서 에러 메시지 확인
- [ ] Vercel 빌드 로그에서 에러 확인

## 예상 에러 메시지

환경 변수가 없을 경우 브라우저 콘솔에서 다음 에러가 표시됩니다:

```
Error: Kakao OAuth environment variables are required in production!
```

이 경우 위의 환경 변수 설정을 완료하고 재배포하세요.

