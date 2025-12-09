# GitHub 인증 문제 해결 가이드

## 문제 상황
```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed
```

GitHub은 2021년 8월부터 비밀번호 인증을 지원하지 않습니다. **Personal Access Token (PAT)**을 사용해야 합니다.

---

## 해결 방법

### 방법 1: Personal Access Token 생성 및 사용 (권장)

#### 1단계: GitHub에서 토큰 생성

1. **GitHub 접속**
   - https://github.com 접속 및 로그인

2. **토큰 생성 페이지로 이동**
   - 우측 상단 프로필 아이콘 클릭 → **Settings**
   - 좌측 메뉴 하단 **Developer settings** 클릭
   - **Personal access tokens** → **Tokens (classic)** 선택
   - 또는 직접 접속: https://github.com/settings/tokens

3. **새 토큰 생성**
   - **Generate new token** → **Generate new token (classic)** 클릭
   - **Note**: `eat-conomy-deployment` (설명)
   - **Expiration**: 원하는 기간 선택 (예: 90 days 또는 No expiration)
   - **Select scopes**: 
     - ✅ **repo** (전체 체크) - 저장소 접근 권한
     - ✅ **workflow** (선택사항) - GitHub Actions 사용 시
   - **Generate token** 클릭

4. **토큰 복사** ⚠️ 중요!
   - 생성된 토큰을 즉시 복사하세요
   - `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 형식
   - 이 페이지를 벗어나면 다시 볼 수 없습니다!

#### 2단계: 토큰으로 푸시

터미널에서 다음 명령어 실행:

```bash
# 원격 저장소 URL 확인
git remote -v

# 토큰을 포함한 URL로 푸시 (아래 [TOKEN]을 실제 토큰으로 변경)
git push https://[TOKEN]@github.com/seinCS/eatconomy.git main

# 또는 원격 저장소 URL을 업데이트
git remote set-url origin https://[TOKEN]@github.com/seinCS/eatconomy.git
git push -u origin main
```

**예시**:
```bash
git push https://ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@github.com/seinCS/eatconomy.git main
```

---

### 방법 2: Git Credential Helper 사용 (더 안전)

토큰을 매번 입력하지 않고 저장하는 방법입니다.

#### macOS Keychain 사용

```bash
# Credential helper 설정
git config --global credential.helper osxkeychain

# 푸시 시도 (첫 번째만 토큰 입력 필요)
git push -u origin main

# Username: seinCS
# Password: [생성한 Personal Access Token 입력]
```

이후부터는 토큰이 Keychain에 저장되어 자동으로 사용됩니다.

---

### 방법 3: SSH 키 사용 (장기적으로 가장 안전)

#### 1단계: SSH 키 생성 (이미 있다면 생략)

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your_email@example.com"

# 엔터를 눌러 기본 경로 사용
# 비밀번호 설정 (선택사항)

# 공개 키 복사
cat ~/.ssh/id_ed25519.pub
```

#### 2단계: GitHub에 SSH 키 추가

1. GitHub → Settings → **SSH and GPG keys**
2. **New SSH key** 클릭
3. **Title**: `MacBook Air` (설명)
4. **Key**: 위에서 복사한 공개 키 붙여넣기
5. **Add SSH key** 클릭

#### 3단계: 원격 저장소 URL을 SSH로 변경

```bash
# SSH URL로 변경
git remote set-url origin git@github.com:seinCS/eatconomy.git

# 푸시
git push -u origin main
```

---

## 빠른 해결 (지금 바로 사용)

가장 빠른 방법은 Personal Access Token을 생성하고 아래 명령어를 실행하는 것입니다:

```bash
# 1. GitHub에서 토큰 생성 (위 1단계 참고)
# 2. 아래 명령어 실행 (TOKEN을 실제 토큰으로 변경)

git push https://[TOKEN]@github.com/seinCS/eatconomy.git main
```

또는 원격 저장소 URL을 업데이트:

```bash
git remote set-url origin https://[TOKEN]@github.com/seinCS/eatconomy.git
git push -u origin main
```

---

## 보안 주의사항

⚠️ **중요**:
- Personal Access Token은 비밀번호처럼 취급하세요
- 코드나 공개 저장소에 토큰을 올리지 마세요
- 토큰이 노출되면 즉시 GitHub에서 삭제하세요
- `.gitignore`에 토큰이 포함된 파일이 있는지 확인하세요

---

## 확인

푸시가 성공하면 다음과 같은 메시지가 표시됩니다:

```
Enumerating objects: 34, done.
Counting objects: 100% (34/34), done.
Compressing objects: 100% (28/28), done.
Writing objects: 100% (34/34), 9506 bytes | 9506.00 KiB/s, done.
Total 34 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/seinCS/eatconomy.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## 다음 단계

푸시가 완료되면:
1. ✅ GitHub 저장소에서 코드 확인
2. ✅ Vercel에서 GitHub 저장소 Import
3. ✅ 환경 변수 설정
4. ✅ 배포 실행



