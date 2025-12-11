# Railway MCP를 통한 배포 설정

## 현재 문제

Railway에서 "Could not find root directory: /backend" 오류가 발생하고 있습니다.

## 해결 방법

Railway 문서에 따르면, Root Directory는 Railway 대시보드에서 설정해야 합니다. MCP로는 직접 설정할 수 없습니다.

### Railway 대시보드에서 설정 (필수)

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

### Railway CLI를 통한 배포 (대안)

Root Directory 설정 후, Railway CLI를 사용하여 배포할 수 있습니다:

```bash
cd backend
railway up --service eatconomy
```

### 확인 사항

설정 후 다음을 확인하세요:
- ✅ Root Directory: `backend` (슬래시 없이)
- ✅ Build Command: `npm run build && npx prisma generate` (자동 감지)
- ✅ Start Command: `npm run start:prod` (자동 감지)

## 중요 사항

- Root Directory는 **슬래시 없이** `backend`로 입력해야 합니다
- `/backend`가 아닌 `backend`로 입력하세요
- 설정 후 반드시 **Save**를 클릭하세요
- MCP로는 Root Directory를 직접 설정할 수 없습니다 (대시보드에서만 가능)

## 예상 결과

Root Directory 설정 후:
- ✅ 빌드가 정상적으로 시작됨
- ✅ `dist/src/main.js` 파일이 생성됨
- ✅ 서버가 정상적으로 시작됨
- ✅ 카카오 로그인이 정상 작동함




