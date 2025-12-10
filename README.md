# Eat-conomy 🍳

자취생을 위한 식비 절약 솔루션

<div align="center">
  <img width="600" alt="Eat-conomy" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## ✨ 주요 기능

- 🍳 **스마트 식단 생성**: 냉장고 재료 기반 주간 식단표 자동 생성
- 👆 **스와이프 기반 선호도 학습**: Tinder 스타일의 레시피 선호도 조사
- 🛒 **장보기 목록 관리**: 식단표 기반 자동 장보기 목록 생성
- 📊 **식사 완료 추적**: 식사 완료 상태 관리 및 통계
- 🔐 **카카오 OAuth 로그인**: 간편한 소셜 로그인

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 18+
- PostgreSQL 14+
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd eat-conomy

# 프론트엔드 의존성 설치
npm install

# 백엔드 의존성 설치
cd backend
npm install
cd ..

# 환경 변수 설정
# ENV_SETUP.md 및 backend/DATABASE_SETUP.md 참고

# 프론트엔드 실행 (포트 3000)
npm run dev

# 백엔드 실행 (포트 3001)
cd backend
npm run start:dev
```

자세한 설정은 [인수인계 문서](HANDOVER.md)를 참고하세요.

## 📚 문서

### 필수 문서
- **[HANDOVER.md](HANDOVER.md)**: 인수인계 문서 (필수 읽기)
- **[DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)**: 실배포 빠른 시작 가이드 ⚡
- **[DEPLOYMENT_MCP_GUIDE.md](DEPLOYMENT_MCP_GUIDE.md)**: Railway MCP Server 배포 가이드 🤖

### 상세 문서
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)**: 실배포 상세 가이드
- **[TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)**: 기술 명세서
- **[ENV_SETUP.md](ENV_SETUP.md)**: 환경 변수 설정 가이드
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**: 기본 배포 가이드
- **[backend/README.md](backend/README.md)**: 백엔드 API 문서
- **[backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)**: 데이터베이스 설정 가이드

## 🛠 기술 스택

### 프론트엔드
- React 19.2 + TypeScript
- Vite
- React Router (HashRouter)
- Tailwind CSS

### 백엔드
- NestJS
- PostgreSQL + Prisma
- JWT + 카카오 OAuth 2.0

## 📝 라이선스

Private

## 👥 기여

프로젝트 관련 문의사항은 이슈 트래커를 이용해주세요.
