# Railway Root Directory 오류 해결

## 문제

```
Could not find root directory: /backend
```

## 원인

Railway 대시보드에서 Root Directory 설정이 사라졌거나 잘못 설정되었습니다.

## 해결 방법

### Railway 대시보드에서 설정

1. **Railway 대시보드 접속**
   - https://railway.app 접속
   - `appealing-compassion` 프로젝트 선택
   - `eatconomy` 서비스 선택

2. **Settings 탭으로 이동**

3. **Root Directory 설정**
   - **Root Directory** 필드 찾기
   - 값 입력: `backend` (슬래시 없이)
   - **Save** 클릭

4. **재배포**
   - 설정 저장 후 자동으로 재배포가 시작됩니다
   - 또는 Deployments 탭에서 수동으로 재배포

### 확인 사항

- ✅ Root Directory: `backend` (슬래시 없이)
- ✅ Build Command: `npm run build && npx prisma generate` (자동 감지)
- ✅ Start Command: `npm run start:prod` (자동 감지)

## 주의사항

- Root Directory는 **슬래시 없이** `backend`로 입력해야 합니다
- `/backend`가 아닌 `backend`로 입력하세요
- railway.json 파일이 `backend/railway.json`에 있는지 확인하세요

## 대안: railway.json 제거

만약 계속 문제가 발생한다면, Railway 대시보드에서 직접 설정하는 방법도 있습니다:

1. `backend/railway.json` 파일 삭제 (또는 이름 변경)
2. Railway 대시보드에서 직접 설정:
   - Root Directory: `backend`
   - Build Command: `npm run build && npx prisma generate`
   - Start Command: `npm run start:prod`

## 예상 결과

설정 후:
- ✅ Root Directory 오류가 사라짐
- ✅ 빌드가 정상적으로 시작됨
- ✅ 배포가 성공적으로 완료됨

