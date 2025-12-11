# Railway 빌드 오류 해결 가이드

## 문제

```
Error: Cannot find module '/app/dist/main'
```

빌드는 성공했지만 배포 시 `dist/main` 파일을 찾을 수 없습니다.

## 원인 분석

Railway의 Nixpacks 빌더는 빌드 단계와 런타임 단계가 분리되어 있습니다. 빌드 단계에서 생성된 `dist` 폴더가 런타임 이미지에 포함되지 않았을 가능성이 있습니다.

## 해결 방법

### 방법 1: Railway 설정 확인 및 수정 (권장)

Railway 대시보드에서:

1. **서비스 설정 확인**
   - Settings → Build & Deploy
   - Root Directory: `backend` 확인
   - Build Command: `npm run build && npx prisma generate` 확인
   - Start Command: `npm run start:prod` 확인

2. **빌드 출력 확인**
   - Deployments → 최신 배포 → Build Logs
   - `nest build`가 성공했는지 확인
   - `dist` 폴더가 생성되었는지 확인

### 방법 2: railway.json 수정

`backend/railway.json` 파일을 확인하고 필요시 수정:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build && npx prisma generate"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 방법 3: Dockerfile 사용 (대안)

Railway가 Nixpacks로 빌드를 제대로 처리하지 못하는 경우, Dockerfile을 사용할 수 있습니다:

`backend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build && npx prisma generate

# 프로덕션 이미지
FROM node:18-alpine

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/main"]
```

그리고 `railway.json`에서 Dockerfile 사용:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 방법 4: 빌드 명령어 수정

`railway.json`의 빌드 명령어를 수정하여 빌드 출력을 명시적으로 확인:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build && npx prisma generate && ls -la dist/"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 확인 사항

1. **빌드 로그 확인**
   - Railway 대시보드 → Deployments → Build Logs
   - `nest build` 성공 여부 확인
   - `dist` 폴더 생성 여부 확인

2. **파일 구조 확인**
   - 빌드 후 `dist/main.js` 파일이 존재하는지 확인
   - `dist/src/main.js`가 아닌 `dist/main.js`인지 확인

3. **NestJS 빌드 출력 경로 확인**
   - `tsconfig.json`의 `outDir`이 `./dist`인지 확인
   - `nest-cli.json`의 설정 확인

## 임시 해결책

빌드가 계속 실패하는 경우, Railway 대시보드에서:

1. **서비스 삭제 후 재생성**
   - 기존 서비스 삭제
   - 새 서비스 생성
   - Root Directory: `backend` 설정
   - 환경 변수 다시 설정

2. **수동 빌드 확인**
   - 로컬에서 `npm run build` 실행
   - `dist/main.js` 파일이 생성되는지 확인
   - 생성되면 Railway 설정 문제일 가능성 높음

## 예상 결과

수정 후:
- ✅ 빌드가 성공적으로 완료됨
- ✅ `dist/main.js` 파일이 생성됨
- ✅ 서버가 정상적으로 시작됨
- ✅ 카카오 로그인이 정상 작동함




