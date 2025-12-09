# GitHub 저장소 생성 및 연결 가이드

## ✅ 완료된 단계

1. ✅ Git 저장소 초기화 완료
2. ✅ 첫 커밋 생성 완료 (34개 파일, 9506줄 추가)

---

## 다음 단계: GitHub 저장소 생성 및 연결

### 1단계: GitHub에서 새 저장소 생성

1. **GitHub 접속**
   - https://github.com 접속 및 로그인

2. **새 저장소 생성**
   - 우측 상단 "+" 아이콘 클릭 → "New repository" 선택
   - 또는 https://github.com/new 직접 접속

3. **저장소 설정**
   - **Repository name**: `eat-conomy` (또는 원하는 이름)
   - **Description**: "자취생 식비 방어 솔루션 - AI 기반 식단 추천 앱"
   - **Visibility**: 
     - ✅ **Public** (Vercel 무료 플랜 사용 시 권장)
     - 또는 **Private** (비공개 원하는 경우)
   - ⚠️ **중요**: "Initialize this repository with" 옵션은 모두 **체크 해제**
     - README, .gitignore, license 모두 체크 해제
     - (이미 로컬에 파일이 있으므로)
   - **Create repository** 클릭

4. **저장소 URL 확인**
   - 생성 후 표시되는 페이지에서 URL 복사
   - 예: `https://github.com/seinCS/eatconomy'

---

### 2단계: 로컬 저장소와 GitHub 연결

터미널에서 다음 명령어를 실행하세요:

```bash
# 프로젝트 디렉토리로 이동 (이미 있다면 생략)
cd "/Users/kimsein/Desktop/eat-conomy (1)"

# 원격 저장소 추가 (아래 URL을 실제 GitHub 저장소 URL로 변경)
git remote add origin https://github.com/seinCS/eatconomy

# 현재 브랜치를 main으로 확인 (이미 main이면 생략)
git branch -M main

# GitHub에 코드 푸시
git push -u origin main
```

**참고**: 
- `[사용자명]`을 실제 GitHub 사용자명으로 변경하세요
- 첫 푸시 시 GitHub 로그인 인증이 필요할 수 있습니다

---

### 3단계: Vercel과 GitHub 연결

1. **Vercel 대시보드 접속**
   - https://vercel.com 접속 및 로그인

2. **프로젝트 Import**
   - "Add New..." → "Project" 클릭
   - "Import Git Repository" 섹션에서 방금 생성한 GitHub 저장소 선택
   - 또는 "Import" 버튼 클릭

3. **프로젝트 설정 (자동 감지됨)**
   - Framework Preset: **Vite** (자동 감지)
   - Root Directory: `./`
   - Build Command: `npm run build` (자동 감지)
   - Output Directory: `dist` (자동 감지)
   - Install Command: `npm install` (자동 감지)

4. **환경 변수 설정 (중요!)**
   - "Environment Variables" 섹션 클릭
   - 다음 변수 추가:
     ```
     Key: VITE_GEMINI_API_KEY
     Value: [실제 Gemini API 키 입력]
     Environment: Production, Preview, Development 모두 선택
     ```
   - **Save** 클릭

5. **배포 실행**
   - "Deploy" 버튼 클릭
   - 배포 완료 대기 (약 1-2분)

---

## 명령어 요약 (복사해서 사용)

아래 명령어에서 `[사용자명]`과 `[저장소명]`을 실제 값으로 변경하세요:

```bash
# 원격 저장소 추가
git remote add origin https://github.com/[사용자명]/[저장소명].git

# 브랜치 이름 확인/변경
git branch -M main

# GitHub에 푸시
git push -u origin main
```

**예시**:
```bash
git remote add origin https://github.com/kimsein/eat-conomy.git
git branch -M main
git push -u origin main
```

---

## 문제 해결

### 문제 1: "remote origin already exists" 에러

**해결**:
```bash
# 기존 원격 저장소 제거
git remote remove origin

# 다시 추가
git remote add origin https://github.com/[사용자명]/[저장소명].git
```

### 문제 2: 푸시 시 인증 실패

**해결 방법 A: Personal Access Token 사용**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" 클릭
3. 권한 선택: `repo` 체크
4. 토큰 생성 후 복사
5. 푸시 시 비밀번호 대신 토큰 입력

**해결 방법 B: SSH 사용**
```bash
# SSH 키가 있다면
git remote set-url origin git@github.com:[사용자명]/[저장소명].git
git push -u origin main
```

### 문제 3: GitHub 저장소가 이미 파일을 포함하고 있음

**해결**:
```bash
# 원격 저장소 내용 가져오기
git pull origin main --allow-unrelated-histories

# 충돌 해결 후
git push -u origin main
```

---

## 다음 단계

1. ✅ GitHub 저장소 생성
2. ✅ 로컬 코드 푸시
3. ✅ Vercel과 GitHub 연결
4. ✅ 환경 변수 설정
5. ✅ 배포 완료

배포 완료 후 Live URL을 확인하세요!

