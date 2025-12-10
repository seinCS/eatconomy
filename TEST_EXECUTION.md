# 최종 테스트 실행 가이드

## 빠른 시작

### 1단계: 환경 확인
```bash
# 백엔드 환경 변수 확인
cd backend
cat .env | grep -E "DATABASE_URL|JWT_SECRET|KAKAO"

# 프론트엔드 환경 변수 확인
cd ..
cat .env | grep -E "VITE_API_BASE_URL|VITE_KAKAO"
```

### 2단계: 데이터베이스 확인
```bash
cd backend
npm run prisma:generate
npx prisma migrate status
```

### 3단계: 서버 시작

**터미널 1 - 백엔드:**
```bash
cd backend
npm run start:dev
```

**터미널 2 - 프론트엔드:**
```bash
npm run dev
```

### 4단계: 브라우저 테스트
1. `http://localhost:3000` 접속
2. 카카오 로그인 수행
3. 각 페이지 기능 테스트

## 자동화된 테스트

### API 테스트 스크립트 사용
```bash
# 1. 로그인하여 JWT 토큰 획득 (브라우저 개발자 도구에서)
# 2. 토큰으로 API 테스트 실행
./test-api.sh YOUR_JWT_TOKEN
```

## 수동 테스트 체크리스트

### ✅ 기본 기능
- [ ] 홈 페이지 로드
- [ ] 카카오 로그인 성공
- [ ] 사용자 정보 표시
- [ ] 냉장고 아이템 추가/삭제
- [ ] 식단 생성 및 표시
- [ ] 장보기 목록 표시
- [ ] 식사 완료 체크

### ✅ 에러 핸들링
- [ ] 네트워크 오류 시 친화적 메시지
- [ ] 인증 오류 시 로그인 페이지로 리다이렉트
- [ ] Validation 에러 시 명확한 메시지
- [ ] 서버 오류 시 적절한 처리

### ✅ 로깅 확인
```bash
# 백엔드 로그 확인 (프로덕션 환경)
cd backend
tail -f logs/combined.log
tail -f logs/error.log
```

## 예상 결과

### 정상 동작 시
- ✅ 백엔드: `🚀 Backend server is running on: http://localhost:3001/api`
- ✅ 프론트엔드: `Local: http://localhost:3000`
- ✅ 로그인 성공 후 홈 페이지 표시
- ✅ 모든 API 요청 200 OK 응답

### 문제 발생 시
- ❌ 서버 시작 실패 → 환경 변수 확인
- ❌ 로그인 실패 → 카카오 설정 확인
- ❌ API 에러 → 네트워크 탭에서 응답 확인
- ❌ 빌드 에러 → `npm install` 재실행

## 테스트 완료 후

모든 테스트가 통과하면:
1. ✅ `TEST_EXECUTION.md` 체크리스트 완료
2. ✅ 배포 준비 완료
3. ✅ Phase 6 (배포) 진행 가능

