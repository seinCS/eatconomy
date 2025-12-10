# 카카오 로그인 "Bad client credentials" 디버깅 체크리스트

## 현재 확인된 환경 변수

### 프론트엔드 (`.env`)
```
VITE_KAKAO_CLIENT_ID=28fd9b104f782ea062b1cac9e285645a
VITE_KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
```

### 백엔드 (`backend/.env`)
```
KAKAO_CLIENT_ID=28fd9b104f782ea062b1cac9e285645a
KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
```

✅ **환경 변수는 일치합니다.**

---

## 디버깅 단계

### 1단계: 브라우저 콘솔 확인

1. 브라우저 개발자 도구 (F12) → **Console** 탭 열기
2. 카카오 로그인 버튼 클릭
3. 다음 로그 확인:
   ```
   === 프론트엔드 카카오 로그인 시작 ===
   KAKAO_CLIENT_ID: ...
   KAKAO_REDIRECT_URI: ...
   === 생성된 카카오 인가 URL ===
   Full URL: ...
   Redirect URI (decoded): ...
   ```
4. **Redirect URI (decoded)** 값을 복사 https://kauth.kakao.com/oauth/authorize?client_id=28fd9b104f782ea062b1cac9e285645a&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fkakao%2Fcallback&response_type=code

### 2단계: 백엔드 콘솔 확인

백엔드 터미널에서 다음 로그 확인:
```
=== 백엔드 카카오 토큰 요청 ===
KAKAO_CLIENT_ID: ...
KAKAO_REDIRECT_URI: ...
```

### 3단계: 두 값 비교

- 브라우저 콘솔의 **Redirect URI (decoded)** 값
- 백엔드 콘솔의 **KAKAO_REDIRECT_URI** 값

**이 두 값이 정확히 일치해야 합니다!**

---

## 카카오 개발자 콘솔 확인

### 필수 확인 사항

1. **제품 설정** → **카카오 로그인** 메뉴로 이동
2. **활성화 설정**이 **ON**인지 확인
3. **Redirect URI** 섹션에서 다음 URI가 **정확히** 등록되어 있는지 확인:
   ```
   http://localhost:3001/api/auth/kakao/callback
   ```

### ⚠️ 중요 확인 사항

- [ ] 끝에 슬래시(`/`) 없음
- [ ] 대소문자 정확히 일치
- [ ] 포트 번호(`:3001`) 포함
- [ ] 프로토콜(`http://`) 포함
- [ ] 경로가 정확히 일치 (`/api/auth/kakao/callback`)

### Redirect URI 재등록 (권장)

1. 카카오 개발자 콘솔에서 기존 Redirect URI **완전히 삭제**
2. 새로 등록:
   ```
   http://localhost:3001/api/auth/kakao/callback
   ```
3. **저장** 클릭
4. **1-2분 대기** (카카오 서버 반영 시간)
5. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
6. 다시 로그인 시도

---

## Network 탭에서 확인

1. 브라우저 개발자 도구 → **Network** 탭 열기
2. **Preserve log** 체크
3. 카카오 로그인 버튼 클릭
4. `kauth.kakao.com` 요청 찾기
5. **Request URL** 확인:
   ```
   https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code
   ```
6. `redirect_uri` 파라미터를 복사하고 디코딩:
   - 브라우저 콘솔에서:
     ```javascript
     decodeURIComponent('복사한_redirect_uri_값')
     ```
   - 또는 온라인 디코더 사용: https://www.urldecoder.org/

7. 이 값이 `http://localhost:3001/api/auth/kakao/callback`와 **정확히 일치**하는지 확인

---

## 가능한 원인 및 해결 방법

### 원인 1: 카카오 개발자 콘솔에 Redirect URI가 등록되지 않음

**해결**: 카카오 개발자 콘솔에 정확한 Redirect URI 등록

### 원인 2: Redirect URI 불일치

**증상**: 브라우저 Network 탭의 `redirect_uri`와 백엔드 로그의 `redirect_uri`가 다름

**해결**: 
1. 프론트엔드 `.env` 파일 확인
2. 백엔드 `.env` 파일 확인
3. 두 값이 정확히 일치하는지 확인
4. 개발 서버 재시작

### 원인 3: 인가 코드 재사용

**증상**: 같은 인가 코드를 여러 번 사용하려고 시도

**해결**: 
1. 브라우저를 완전히 종료하고 다시 시작
2. 시크릿 모드에서 테스트
3. 카카오 계정 로그아웃 후 다시 로그인

### 원인 4: 카카오 서버 반영 지연

**증상**: Redirect URI를 등록했지만 여전히 오류 발생

**해결**: 
1. Redirect URI 재등록
2. 1-2분 대기
3. 브라우저 캐시 삭제
4. 다시 로그인 시도

---

## 수동 테스트 (최종 확인)

카카오 API를 직접 호출하여 테스트:

```bash
# 1. 브라우저에서 카카오 로그인 버튼 클릭
# 2. 카카오 로그인 완료 후 리다이렉트된 URL에서 code 파라미터 복사
# 3. 터미널에서 실행:

CODE="복사한_인가_코드"

curl -X POST https://kauth.kakao.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=28fd9b104f782ea062b1cac9e285645a" \
  -d "redirect_uri=http://localhost:3001/api/auth/kakao/callback" \
  -d "code=${CODE}"
```

**성공 응답**:
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "refresh_token": "...",
  ...
}
```

**실패 응답**:
```json
{
  "error": "invalid_grant",
  "error_description": "Bad client credentials"
}
```

이 명령이 성공하면 카카오 API는 정상이고, 백엔드 코드에 문제가 있을 수 있습니다.
이 명령이 실패하면 카카오 개발자 콘솔 설정에 문제가 있을 수 있습니다.

---

## 다음 단계

1. 브라우저 콘솔과 백엔드 콘솔의 로그 확인
2. 두 `redirect_uri` 값이 일치하는지 확인
3. 카카오 개발자 콘솔에서 Redirect URI 재등록
4. 브라우저 캐시 삭제
5. 다시 로그인 시도

