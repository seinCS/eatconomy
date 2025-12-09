# Vercel 자동 배포 및 Preview 배포 가이드

## ✅ 자동 배포 구조

네, 맞습니다! **Vercel이 GitHub와 연동되어 있으면, main 브랜치에 푸시만 하면 자동으로 프로덕션 배포가 진행됩니다.**

---

## 🚀 자동 배포 동작 방식

### 1. 프로덕션 배포 (Production)

**트리거**: `main` (또는 `master`) 브랜치에 푸시

**동작**:
- GitHub에 푸시 → Vercel이 자동 감지
- 자동으로 빌드 시작 (`npm run build`)
- 빌드 성공 시 프로덕션 URL에 자동 배포
- 배포 완료 시 GitHub 커밋에 상태 표시

**예시**:
```bash
# 코드 수정 후
git add .
git commit -m "기능 추가: 새로운 레시피 필터링"
git push origin main

# → Vercel이 자동으로 감지하여 배포 시작
# → 약 1-2분 후 프로덕션에 반영
```

---

### 2. Preview 배포 (자동 활성화됨)

**트리거**: 
- ✅ **모든 브랜치**에 푸시 (main 제외)
- ✅ **Pull Request 생성/업데이트**

**동작**:
- 새 브랜치 생성 및 푸시 → Preview URL 자동 생성
- Pull Request 생성 → Preview URL 자동 생성
- PR에 Preview 링크 자동 댓글 추가
- PR 머지 시 Preview 자동 삭제

**Preview URL 형식**:
```
https://eat-conomy-mvp-[브랜치명]-[해시].vercel.app
또는
https://eat-conomy-mvp-git-[브랜치명]-[계정명].vercel.app
```

---

## 📋 배포 워크플로우 예시

### 시나리오 1: 새 기능 개발

```bash
# 1. 새 브랜치 생성
git checkout -b feature/new-recipe-filter

# 2. 코드 수정
# ... 파일 수정 ...

# 3. 커밋 및 푸시
git add .
git commit -m "새 레시피 필터링 기능 추가"
git push origin feature/new-recipe-filter

# → Vercel이 자동으로 Preview 배포 생성
# → Preview URL: https://eat-conomy-mvp-git-feature-new-recipe-filter-[계정].vercel.app
```

**GitHub에서**:
1. Pull Request 생성
2. Vercel 봇이 PR에 Preview 링크 댓글 추가
3. 팀원들이 Preview URL로 테스트 가능

**PR 머지 후**:
```bash
# main 브랜치로 머지
git checkout main
git merge feature/new-recipe-filter
git push origin main

# → Vercel이 자동으로 프로덕션 배포
# → Preview는 자동 삭제
```

---

### 시나리오 2: 버그 수정

```bash
# 1. 핫픽스 브랜치
git checkout -b hotfix/fix-meal-completion

# 2. 수정 및 푸시
git add .
git commit -m "식사 완료 상태 버그 수정"
git push origin hotfix/fix-meal-completion

# → Preview 배포 자동 생성
# → 테스트 후 PR 머지 → 프로덕션 자동 배포
```

---

## ⚙️ Vercel 대시보드에서 확인

### 배포 상태 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com → 프로젝트 선택

2. **Deployments 탭**
   - 모든 배포 이력 확인
   - Production / Preview 구분 표시
   - 각 배포의 상태 (Ready, Building, Error 등)

3. **Settings → Git**
   - 연결된 GitHub 저장소 확인
   - Production Branch: `main` (기본값)
   - Automatic deployments 활성화 여부 확인

---

## 🔧 자동 배포 설정 확인/변경

### Vercel 대시보드에서

1. **프로젝트 선택** → **Settings** → **Git**

2. **Production Branch**
   - 기본값: `main`
   - 변경 가능 (예: `master`, `production`)

3. **Automatic deployments**
   - ✅ **Enable Automatic Deployments**: 켜짐 (기본값)
   - 이 옵션이 켜져 있으면 자동 배포 활성화

4. **Preview deployments**
   - ✅ **Enable Preview Deployments**: 켜짐 (기본값)
   - 모든 브랜치와 PR에 Preview 생성

---

## 🎯 Preview 배포 활용 팁

### 1. 기능별 테스트

```bash
# 각 기능을 별도 브랜치로 개발
git checkout -b feature/ai-tips
# → Preview URL 생성
# → 베타 테스터들에게 Preview URL 공유
# → 피드백 수집 후 main에 머지
```

### 2. A/B 테스트

```bash
# 두 가지 버전을 각각 브랜치로
git checkout -b experiment/version-a
# → Preview A

git checkout -b experiment/version-b
# → Preview B

# 두 Preview URL을 비교 테스트
```

### 3. 스테이징 환경

```bash
# staging 브랜치를 항상 최신 상태로 유지
git checkout -b staging
git push origin staging

# → 항상 staging 브랜치의 Preview URL 사용
# → 프로덕션 배포 전 최종 테스트
```

---

## 📊 배포 알림 설정

### GitHub 통합

Vercel은 기본적으로:
- ✅ PR에 Preview 링크 자동 댓글
- ✅ 커밋 상태 표시 (성공/실패)
- ✅ 배포 완료 시 GitHub 상태 업데이트

### 추가 알림 설정

1. **Vercel 대시보드** → **Settings** → **Notifications**
2. 선택 가능:
   - Email 알림
   - Slack 연동
   - Discord 연동
   - Webhook 설정

---

## 🚨 배포 실패 시

### 자동 재시도

- Vercel은 빌드 실패 시 자동으로 재시도하지 않습니다
- 수동으로 "Redeploy" 버튼 클릭 필요

### 빌드 로그 확인

1. **Deployments 탭** → 실패한 배포 클릭
2. **Build Logs** 확인
3. 에러 원인 파악 후 수정
4. 다시 푸시하면 자동 재배포

---

## 🔒 환경 변수 관리

### 환경별 환경 변수

Vercel은 환경 변수를 3가지로 구분:

1. **Production**: `main` 브랜치 배포 시 사용
2. **Preview**: 모든 Preview 배포 시 사용
3. **Development**: `vercel dev` 로컬 개발 시 사용

### 설정 방법

1. **Settings** → **Environment Variables**
2. 변수 추가 시 **Environment** 선택:
   - ✅ Production
   - ✅ Preview (테스트용)
   - ✅ Development

**예시**:
```
VITE_GEMINI_API_KEY
- Production: ✅ (실제 API 키)
- Preview: ✅ (테스트용 API 키 또는 동일)
- Development: ✅ (로컬 개발용)
```

---

## 📝 현재 프로젝트 설정 확인

### vercel.json

현재 `vercel.json`에는 기본 설정만 있습니다:

```json
{
  "version": 2,
  "name": "eat-conomy-mvp",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [...]
}
```

**자동 배포는 Vercel 대시보드의 Git 연동 설정으로 관리됩니다.**

---

## ✅ 체크리스트

### 자동 배포 확인

- [ ] Vercel 대시보드에서 GitHub 저장소 연결 확인
- [ ] Production Branch가 `main`으로 설정되어 있는지 확인
- [ ] Automatic Deployments 활성화 확인
- [ ] Preview Deployments 활성화 확인

### 테스트

- [ ] 새 브랜치 생성 및 푸시 → Preview 배포 확인
- [ ] PR 생성 → Preview 링크 자동 추가 확인
- [ ] main 브랜치 푸시 → 프로덕션 배포 확인

---

## 🎉 요약

### ✅ 자동 배포

- **main 브랜치 푸시** → **자동 프로덕션 배포**
- 별도 설정 없이 기본 활성화

### ✅ Preview 배포

- **모든 브랜치 푸시** → **자동 Preview 생성**
- **Pull Request 생성** → **자동 Preview 생성**
- PR에 Preview 링크 자동 댓글
- PR 머지 시 Preview 자동 삭제

### 🚀 워크플로우

```
코드 수정
  ↓
git push origin [브랜치]
  ↓
Vercel 자동 감지
  ↓
자동 빌드 및 배포
  ↓
배포 완료 (Production 또는 Preview)
```

---

**결론**: 네, 맞습니다! 앞으로는 코드 수정 후 `git push origin main`만 하면 자동으로 프로덕션에 반영됩니다. Preview 배포도 모든 브랜치와 PR에 대해 자동으로 생성됩니다. 🎊



