# Client Secret 찾기 문제 해결 가이드

## Client Secret을 찾을 수 없는 경우

### 1. 플랫폼 키 페이지에서 확인 (가장 쉬운 방법)

**정확한 위치**:
1. 카카오 개발자 콘솔 접속: https://developers.kakao.com
2. 내 애플리케이션 선택
3. 좌측 메뉴: **"앱 설정" → "플랫폼 키"** 클릭
4. **REST API 키** 카드를 확인
5. 카드 하단의 **"클라이언트 시크릿"** (회색 버튼) 클릭
6. Client Secret 코드 복사

### 2. 보안 섹션에서 확인 (대안)

**대안 위치**:
1. 좌측 메뉴: **"앱 설정" → "보안"** 클릭
2. "Client Secret" 섹션 확인

### 2. Client Secret이 보이지 않는 경우

**가능한 원인**:

1. **Web 플랫폼이 등록되지 않음**
   - 해결: "앱 설정" → "플랫폼"에서 Web 플랫폼 등록
   - 사이트 도메인: `http://localhost:3000` 등록

2. **Client Secret이 비활성화되어 있음**
   - 해결: "보안" 섹션에서 "Client Secret 코드 발급" 또는 "활성화" 클릭

3. **카카오 로그인이 활성화되지 않음**
   - 해결: "제품 설정" → "카카오 로그인" 활성화

### 3. Client Secret 없이도 가능한가?

**답변**: 네, 가능합니다!

카카오 OAuth 2.0 Authorization Code Flow는 Client Secret 없이도 작동할 수 있습니다. 하지만 보안을 위해 Client Secret 설정을 권장합니다.

**Client Secret 없이 사용하는 경우**:
```env
KAKAO_CLIENT_ID=your-rest-api-key
KAKAO_CLIENT_SECRET=  # 빈 값 또는 생략 가능
```

**주의**: 
- Client Secret 없이 사용하면 보안 수준이 낮아집니다
- 프로덕션 환경에서는 반드시 Client Secret을 설정하는 것을 권장합니다

### 4. 단계별 확인 체크리스트

- [ ] Web 플랫폼 등록 완료 ("앱 설정" → "플랫폼")
- [ ] 카카오 로그인 활성화 완료 ("제품 설정" → "카카오 로그인")
- [ ] "앱 설정" → "보안" 섹션 접근
- [ ] Client Secret 섹션 확인
- [ ] Client Secret 코드 발급 또는 활성화

### 5. 참고 문서

- [카카오 REST API 시작하기](https://developers.kakao.com/docs/latest/ko/rest-api/getting-started)
- [카카오 로그인 설정하기](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)

