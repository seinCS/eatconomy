# Railway MCP Server를 이용한 배포 가이드

이 가이드는 Railway MCP Server를 사용하여 자연어로 배포 작업을 수행하는 방법을 안내합니다.

**참고**: [Railway MCP Server 공식 문서](https://docs.railway.com/reference/mcp-server)

---

## 📋 사전 준비

### 1. Railway CLI 설치 및 인증

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login
```

### 2. MCP Server 설정

#### Cursor 사용 시

`.cursor/mcp.json` 파일 생성:

```json
{
  "mcpServers": {
    "Railway": {
      "command": "npx",
      "args": ["-y", "@railway/mcp-server"]
    }
  }
}
```

#### VS Code 사용 시

`.vscode/mcp.json` 파일 생성:

```json
{
  "servers": {
    "Railway": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@railway/mcp-server"]
    }
  }
}
```

### 3. MCP Server 재시작

설정 파일을 추가한 후 IDE를 재시작하거나 MCP 서버를 다시 로드하세요.

---

## 🚀 MCP를 통한 배포 과정

### 1단계: PostgreSQL 데이터베이스 배포

**MCP 명령 예시:**
```
Railway에 PostgreSQL 데이터베이스를 배포해주세요.
```

또는:
```
Deploy a Postgres database to Railway
```

**확인 사항:**
- Railway 대시보드에서 PostgreSQL 서비스 생성 확인
- `DATABASE_URL` 환경 변수 자동 생성 확인

---

### 2단계: 백엔드 프로젝트 생성 및 배포

**MCP 명령 예시:**
```
backend 디렉토리를 Railway 프로젝트에 연결하고 배포해주세요.
Root Directory는 backend로 설정하고,
Build Command는 "npm run build && npx prisma generate"로,
Start Command는 "npm run start:prod"로 설정해주세요.
```

**또는 단계별로:**
```
1. Railway에 새 프로젝트를 생성하고 현재 디렉토리에 연결해주세요.
2. backend 디렉토리를 서비스로 추가해주세요.
3. Root Directory를 backend로 설정해주세요.
```

---

### 3단계: 환경 변수 설정

**MCP 명령 예시:**
```
Railway 프로젝트에 다음 환경 변수들을 설정해주세요:
- NODE_ENV=production
- PORT=3001
- JWT_SECRET=[32자 이상의 강력한 랜덤 문자열]
- JWT_EXPIRES_IN=7d
- KAKAO_CLIENT_ID=[프로덕션 카카오 REST API 키]
- KAKAO_CLIENT_SECRET=[프로덕션 카카오 Client Secret]
- KAKAO_REDIRECT_URI=https://[백엔드-도메인].railway.app/api/auth/kakao/callback
- FRONTEND_URL=https://[프론트엔드-도메인].vercel.app
```

**또는 개별 설정:**
```
Railway에 JWT_SECRET 환경 변수를 설정해주세요. 값은 [실제 값]입니다.
```

---

### 4단계: 데이터베이스 마이그레이션

**MCP 명령 예시:**
```
Railway에서 npx prisma migrate deploy 명령을 실행해주세요.
```

또는 Railway 대시보드에서:
- 서비스 → Deployments → "Run Command"
- Command: `npx prisma migrate deploy`

---

### 5단계: 도메인 생성 및 확인

**MCP 명령 예시:**
```
Railway 서비스에 도메인을 생성해주세요.
```

또는:
```
Railway 프로젝트의 도메인을 확인해주세요.
```

---

## 📝 MCP 사용 팁

### 유용한 MCP 명령어

1. **프로젝트 목록 확인**
   ```
   Railway 프로젝트 목록을 보여주세요.
   ```

2. **서비스 목록 확인**
   ```
   현재 프로젝트의 서비스 목록을 보여주세요.
   ```

3. **환경 변수 확인**
   ```
   Railway 프로젝트의 환경 변수 목록을 보여주세요.
   ```

4. **로그 확인**
   ```
   Railway 서비스의 최근 로그를 보여주세요.
   ```

5. **배포 상태 확인**
   ```
   Railway 서비스의 배포 상태를 확인해주세요.
   ```

### 주의사항

⚠️ **Railway MCP Server는 실험적 기능입니다**
- 파괴적인 작업(삭제 등)은 제외되어 있지만, 모든 작업을 신중히 검토하세요
- 중요한 작업 전에 Railway 대시보드에서 확인하세요
- 프로덕션 환경에서는 특히 주의하세요

---

## 🔄 전체 배포 워크플로우 (MCP 사용)

### 백엔드 배포

```
1. Railway에 PostgreSQL 데이터베이스를 배포해주세요.

2. backend 디렉토리를 Railway 프로젝트에 연결하고 배포해주세요.
   Root Directory는 backend로 설정해주세요.

3. 다음 환경 변수들을 설정해주세요:
   - NODE_ENV=production
   - PORT=3001
   - JWT_SECRET=[실제 값]
   - KAKAO_CLIENT_ID=[실제 값]
   - KAKAO_CLIENT_SECRET=[실제 값]
   - KAKAO_REDIRECT_URI=https://[도메인].railway.app/api/auth/kakao/callback
   - FRONTEND_URL=https://[프론트엔드-도메인].vercel.app

4. 데이터베이스 마이그레이션을 실행해주세요: npx prisma migrate deploy

5. 배포된 도메인을 확인해주세요.
```

### 프론트엔드 배포

프론트엔드는 Vercel을 사용하므로 Vercel 대시보드나 CLI를 사용해야 합니다.

---

## 🆚 MCP vs 웹 대시보드 비교

| 기능 | MCP Server | 웹 대시보드 |
|------|------------|-------------|
| 배포 속도 | ⚡ 빠름 (자연어 명령) | 보통 |
| 정확도 | ⚠️ 실험적 (검토 필요) | ✅ 안정적 |
| 학습 곡선 | 낮음 (자연어) | 중간 |
| 프로덕션 | ⚠️ 주의 필요 | ✅ 권장 |

**권장**: 개발/테스트 환경에서는 MCP 사용, 프로덕션은 웹 대시보드 사용

---

## 📚 참고 자료

- [Railway MCP Server 공식 문서](https://docs.railway.com/reference/mcp-server)
- [Railway CLI 문서](https://docs.railway.com/reference/cli)
- [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md): 웹 대시보드 배포 가이드

---

**마지막 업데이트**: 2024년 12월

