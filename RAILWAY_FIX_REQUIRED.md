# Railway 백엔드 설정 수정 필요

## 문제 발견

현재 배포된 서비스가 프론트엔드를 빌드하고 있습니다. 백엔드 서비스의 Root Directory가 설정되지 않은 것 같습니다.

## 해결 방법

### Railway 대시보드에서 설정 수정

1. https://railway.app 접속
2. `appealing-compassion` 프로젝트 선택
3. `eatconomy` 서비스 클릭
4. **Settings** 탭으로 이동
5. **Root Directory** 필드에 `backend` 입력
6. **Save** 클릭
7. 자동으로 재배포가 시작됩니다

### 확인 사항

설정 후 다음을 확인하세요:
- **Root Directory**: `backend` ✅
- **Build Command**: `npm run build && npx prisma generate` ✅
- **Start Command**: `npm run start:prod` ✅

### 재배포 후 확인

재배포가 완료되면:
1. 배포 로그에서 백엔드 빌드 확인
2. API 호출 테스트: `curl https://eatconomy-production.up.railway.app/api`
3. 응답이 JSON 형식인지 확인 (HTML이 아닌)

## 다음 단계

Root Directory 설정 완료 후:
1. 데이터베이스 마이그레이션 실행
2. API 엔드포인트 테스트
3. 카카오 로그인 테스트

