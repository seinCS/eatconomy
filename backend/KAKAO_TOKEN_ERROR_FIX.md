# 카카오 액세스 토큰 발급 오류 해결 가이드

## 오류 내용

```
Kakao callback error: UnauthorizedException: Failed to get access token: undefined
```

## 원인 분석

카카오 API에서 액세스 토큰을 발급받지 못했습니다. 가능한 원인:

1. **Redirect URI 불일치**: 카카오 개발자 콘솔에 등록한 Redirect URI와 실제 사용하는 URI가 다름
2. **인가 코드 문제**: 인가 코드가 만료되었거나 이미 사용됨
3. **환경 변수 설정 오류**: `KAKAO_CLIENT_ID` 또는 `KAKAO_REDIRECT_URI`가 잘못 설정됨
4. **카카오 API 응답 오류**: 카카오 서버에서 오류 응답

---

## 해결 방법

### 1단계: 환경 변수 확인

백엔드 `.env` 파일 확인:

```bash
cd backend
cat .env | grep KAKAO
```

다음 항목이 정확히 설정되어 있어야 합니다:

```env
KAKAO_CLIENT_ID=28fd9b104f782ea062b1cac9e285645a
KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
# KAKAO_CLIENT_SECRET= (선택사항)
```

### 2단계: 카카오 개발자 콘솔 확인

1. https://developers.kakao.com 접속
2. 내 애플리케이션 선택
3. **제품 설정** → **카카오 로그인** 메뉴로 이동
4. **Redirect URI** 섹션 확인:
   - 다음 URI가 **정확히** 등록되어 있는지 확인:
     ```
     http://localhost:3001/api/auth/kakao/callback
     ```
   - 대소문자, 슬래시, 포트 번호까지 정확히 일치해야 합니다

### 3단계: 백엔드 서버 재시작

환경 변수를 변경했다면 서버를 재시작해야 합니다:

```bash
cd backend
# 서버 중지 (Ctrl+C)
npm run start:dev
```

### 4단계: 상세 로그 확인

수정된 코드는 더 자세한 에러 메시지를 출력합니다. 백엔드 콘솔에서 다음을 확인:

```
Requesting Kakao access token: {
  client_id: '...',
  redirect_uri: '...',
  has_client_secret: true/false,
  code_length: ...
}

Kakao token request failed: {
  status: 400,
  statusText: 'Bad Request',
  error: 'invalid_grant' 또는 'invalid_request' 등
}
```

---

## 일반적인 오류 코드

### `invalid_grant`
- **원인**: 인가 코드가 만료되었거나 이미 사용됨
- **해결**: 다시 카카오 로그인 시도

### `invalid_request`
- **원인**: 요청 파라미터가 잘못됨 (Redirect URI 불일치 등)
- **해결**: 카카오 개발자 콘솔의 Redirect URI 확인

### `invalid_client`
- **원인**: Client ID가 잘못됨
- **해결**: `.env` 파일의 `KAKAO_CLIENT_ID` 확인

### `redirect_uri_mismatch`
- **원인**: Redirect URI가 등록된 것과 일치하지 않음
- **해결**: 카카오 개발자 콘솔에 정확한 URI 등록

---

## 디버깅 단계

### 1. 환경 변수 확인

```bash
cd backend
cat .env | grep KAKAO
```

출력 예시:
```
KAKAO_CLIENT_ID=28fd9b104f782ea062b1cac9e285645a
KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
```

### 2. 카카오 개발자 콘솔 확인

**제품 설정** → **카카오 로그인** → **Redirect URI**:
- `http://localhost:3001/api/auth/kakao/callback` 정확히 등록되어 있는지 확인

### 3. 백엔드 로그 확인

서버 재시작 후 다시 로그인 시도하고, 백엔드 콘솔에서 다음 로그 확인:

```
Requesting Kakao access token: {
  client_id: '28fd9b104f782ea062b1cac9e285645a',
  redirect_uri: 'http://localhost:3001/api/auth/kakao/callback',
  has_client_secret: false,
  code_length: 50
}

Kakao token request failed: {
  status: 400,
  statusText: 'Bad Request',
  error: 'redirect_uri_mismatch'
}
```

### 4. 카카오 API 직접 테스트 (선택사항)

인가 코드를 받은 후, 백엔드에서 다음 명령으로 직접 테스트:

```bash
curl -X POST https://kauth.kakao.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=28fd9b104f782ea062b1cac9e285645a" \
  -d "redirect_uri=http://localhost:3001/api/auth/kakao/callback" \
  -d "code=인가_코드"
```

---

## 확인 체크리스트

- [ ] `.env` 파일에 `KAKAO_CLIENT_ID` 설정됨
- [ ] `.env` 파일에 `KAKAO_REDIRECT_URI` 설정됨 (정확한 URI)
- [ ] 카카오 개발자 콘솔에 Redirect URI 등록됨 (정확히 일치)
- [ ] 백엔드 서버 재시작됨
- [ ] 백엔드 콘솔에서 상세 에러 메시지 확인

---

## 다음 단계

1. 환경 변수 확인 및 수정
2. 카카오 개발자 콘솔에서 Redirect URI 확인
3. 백엔드 서버 재시작
4. 다시 로그인 시도
5. 백엔드 콘솔의 상세 에러 메시지 확인

상세 에러 메시지를 확인하면 정확한 원인을 파악할 수 있습니다.

