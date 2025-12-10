# 카카오 OAuth 설정 가이드

## 단계별 가이드

### 1단계: 카카오 개발자 계정 생성

1. **카카오 개발자 사이트 접속**
   - https://developers.kakao.com 접속
   - 카카오 계정으로 로그인 (없다면 회원가입)

2. **내 애플리케이션 만들기**
   - 우측 상단 "내 애플리케이션" 클릭
   - "애플리케이션 추가하기" 클릭

3. **애플리케이션 정보 입력**
   - **앱 이름**: `Eat-conomy` (또는 원하는 이름)
   - **사업자명**: 개인 또는 회사명
   - **앱 아이콘**: 선택사항 (나중에 추가 가능)
   - "저장" 클릭

---

### 2단계: 플랫폼 설정

1. **애플리케이션 선택**
   - 생성한 애플리케이션 클릭

2. **플랫폼 설정**
   - 좌측 메뉴에서 "앱 설정" → "플랫폼" 클릭
   - "Web 플랫폼 등록" 클릭
   - **사이트 도메인** 입력:
     ```
     개발 환경: http://localhost:3000
     프로덕션: https://your-domain.vercel.app
     ```
   - "저장" 클릭

---

### 3단계: 카카오 로그인 활성화

1. **카카오 로그인 활성화**
   - 좌측 메뉴에서 "제품 설정" → "카카오 로그인" 클릭
   - "활성화 설정" ON

2. **Redirect URI 등록** (중요!)
   - "Redirect URI" 섹션에서 "URI 추가" 클릭
   - 다음 URI들을 추가:
     ```
     개발 환경:
     http://localhost:3001/api/auth/kakao/callback
     
     프로덕션 (나중에 추가):
     https://your-backend-domain.railway.app/api/auth/kakao/callback
     ```
   - "저장" 클릭

3. **OpenID Connect 설정** (선택사항)
   - OpenID Connect는 **활성화하지 않아도 됩니다**
   - 우리 프로젝트는 OAuth 2.0 Authorization Code Flow만 사용합니다
   - OpenID Connect를 활성화하면 표준화된 ID 토큰을 받을 수 있지만, 필수는 아닙니다
   - **권장**: 기본 OAuth 2.0만 사용 (더 간단함)

4. **동의항목 설정** (선택사항)
   - 사용자 정보 동의 항목 설정
   - 최소한의 정보만 요청하는 것을 권장:
     - 닉네임 (필수)
     - 프로필 사진 (선택)
     - 카카오계정(이메일) (선택)

---

### 4단계: REST API 키 및 Client Secret 발급

1. **REST API 키 확인**
   - 좌측 메뉴에서 "앱 설정" → "앱 키" 클릭
   - **REST API 키** 복사 (이것이 `KAKAO_CLIENT_ID`)

2. **Client Secret 발급** (⚠️ Admin Key가 아닙니다!)
   
   **정확한 위치**:
   - "앱 설정" → "플랫폼 키" 페이지에서
   - **REST API 키** 카드를 확인
   - 카드 하단에 있는 **"클라이언트 시크릿"** (회색 버튼) 클릭
   - Client Secret 코드가 표시되면 복사 (이것이 `KAKAO_CLIENT_SECRET`)
   - ⚠️ **주의**: Client Secret은 한 번만 표시되므로 안전하게 보관하세요!
   
   **만약 "클라이언트 시크릿" 버튼이 보이지 않는다면**:
   - Web 플랫폼이 등록되어 있는지 확인 ("앱 설정" → "플랫폼")
   - 카카오 로그인이 활성화되어 있는지 확인 ("제품 설정" → "카카오 로그인")
   - "앱 설정" → "보안" 섹션에서 Client Secret 활성화 확인
   
   **참고**: 
   - Client Secret은 기본적으로 비활성화되어 있을 수 있습니다
   - Web 플랫폼이 등록되어 있어야 Client Secret을 사용할 수 있습니다
   - Client Secret이 없어도 OAuth 로그인은 가능하지만, 보안을 위해 설정하는 것을 권장합니다

**중요 구분**:
- **Client Secret**: OAuth 인증 플로우에서 사용하는 보안 코드 (우리가 사용)
- **Admin Key**: 관리자 권한이 필요한 API 호출 시 사용하는 키 (서버 사이드 전용, OAuth와 별개)
  - 우리 프로젝트에서는 **Admin Key가 필요 없습니다**
  - OAuth 로그인에는 Client Secret만 사용합니다

---

### 5단계: 환경 변수 설정

백엔드 프로젝트의 `.env` 파일에 다음 정보를 추가하세요:

```env
# Kakao OAuth
KAKAO_CLIENT_ID=28fd9b104f782ea062b1cac9e285645a
# KAKAO_CLIENT_SECRET=  # 선택사항: 설정하지 않아도 OAuth 로그인 가능
KAKAO_REDIRECT_URI=http://localhost:3001/api/auth/kakao/callback
```

---

## 확인 사항 체크리스트

- [O] 카카오 개발자 계정 생성 완료
- [O] 애플리케이션 생성 완료
- [O] Web 플랫폼 등록 완료 (http://localhost:3000)
- [O] 카카오 로그인 활성화 완료
- [O] OpenID Connect 설정 확인 (비활성화 권장)
- [O] Redirect URI 등록 완료 (http://localhost:3001/api/auth/kakao/callback)
- [O] REST API 키 확인 완료
- [O] Client Secret 설정 (선택사항 - 설정하지 않아도 됨)
- [O] 환경 변수 설정 완료

---

## 참고 사항

### Redirect URI 규칙

- **정확히 일치해야 함**: URI는 대소문자, 경로, 쿼리 파라미터까지 정확히 일치해야 합니다
- **프로토콜 포함**: `http://` 또는 `https://` 포함
- **포트 번호 포함**: `localhost:3001` 형식으로 포트 번호 포함

### 보안 주의사항

- ⚠️ **Client Secret은 절대 공개하지 마세요** (Admin Key와는 다른 별개의 키입니다)
- ⚠️ `.env` 파일은 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함됨)
- ⚠️ 프로덕션에서는 환경 변수로 관리하세요
- ⚠️ **Admin Key는 필요 없습니다** - OAuth 로그인에는 Client Secret만 사용합니다

### 개발 환경 vs 프로덕션

**개발 환경**:
- Redirect URI: `http://localhost:3001/api/auth/kakao/callback`
- 사이트 도메인: `http://localhost:3000`

**프로덕션**:
- Redirect URI: `https://your-backend.railway.app/api/auth/kakao/callback`
- 사이트 도메인: `https://your-frontend.vercel.app`

---

## 다음 단계

카카오 개발자 등록이 완료되면:
1. 환경 변수 설정 완료 알림
2. Phase 2: 백엔드 OAuth 엔드포인트 구현 시작
3. **구현 가이드 참고**: `KAKAO_OAUTH_IMPLEMENTATION.md` 파일 확인

---

## 관련 문서

- **구현 가이드**: `KAKAO_OAUTH_IMPLEMENTATION.md` - REST API 구현 상세 가이드
- **문제 해결**: `CLIENT_SECRET_TROUBLESHOOTING.md` - Client Secret 관련 문제 해결

