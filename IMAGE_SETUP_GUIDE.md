# 이미지 파일 저장 및 설정 가이드

## 📁 저장 경로

**이미지 파일은 다음 경로에 저장하세요:**

```
public/images/recipes/
```

### 폴더 구조

```
eat-conomy/
├── public/
│   └── images/
│       └── recipes/
│           ├── 101.jpg  (또는 .png, .webp)
│           ├── 102.jpg
│           ├── 103.jpg
│           └── ... (150.jpg까지)
```

---

## 📝 파일명 규칙

### 레시피 ID와 파일명 매칭

현재 프로젝트에는 **50개의 레시피**가 있으며, 각 레시피의 ID는 다음과 같습니다:

- **101-107**: 돼지고기 & 김치 베이스
- **108-114**: 계란 & 두부 & 스팸
- **115-121**: 면 요리
- **122-130**: 볶음 & 덮밥류
- **131-137**: 국 & 찌개
- **138-144**: 빵 & 간편식
- **145-150**: 메인 요리

### 파일명 형식

각 레시피 ID에 맞춰 파일명을 지정하세요:

```
101.jpg  → 돼지고기 김치찌개
102.jpg  → 제육볶음
103.jpg  → 두부김치
...
150.jpg  → 감자전
```

### 지원 파일 형식

다음 형식의 이미지 파일을 사용할 수 있습니다:
- `.jpg` / `.jpeg`
- `.png`
- `.webp` (권장: 용량이 작고 품질이 좋음)
- `.gif`

**권장**: `.webp` 형식 사용 (최적의 압축률과 품질)

---

## 🔧 이미지 파일 배치 방법

### 방법 1: 직접 복사 (GUI)

1. Finder에서 이미지 파일 50개 선택
2. 다음 경로로 복사:
   ```
   /Users/kimsein/Desktop/eat-conomy (1)/public/images/recipes/
   ```
3. 각 파일명을 레시피 ID에 맞게 변경 (예: `101.jpg`, `102.jpg`, ...)

### 방법 2: 터미널 사용

```bash
# 프로젝트 디렉토리로 이동
cd "/Users/kimsein/Desktop/eat-conomy (1)"

# 이미지 파일들이 다른 폴더에 있다면
# 예: ~/Downloads/recipe-images/ 폴더에 있다고 가정
cp ~/Downloads/recipe-images/*.jpg public/images/recipes/

# 파일명을 레시피 ID에 맞게 변경
# (파일명이 순서대로 정렬되어 있다면)
cd public/images/recipes/
counter=101
for file in *.jpg; do
  mv "$file" "${counter}.jpg"
  counter=$((counter + 1))
done
```

---

## 💻 코드에서 이미지 사용 방법

### Vite에서 public 폴더 이미지 참조

Vite 프로젝트에서는 `public` 폴더의 파일을 **루트 경로(`/`)로 시작**하여 참조합니다:

```typescript
// ✅ 올바른 방법
const imagePath = `/images/recipes/${recipe.id}.jpg`;

// ❌ 잘못된 방법
const imagePath = `./public/images/recipes/${recipe.id}.jpg`;
const imagePath = `public/images/recipes/${recipe.id}.jpg`;
```

### 현재 코드 수정 필요 위치

다음 파일들에서 플레이스홀더 이미지를 실제 이미지로 교체해야 합니다:

1. **`components/SwipeCard.tsx`** (라인 34)
2. **`pages/Plan.tsx`** (라인 301)
3. **`pages/Home.tsx`** (라인 175)

---

## 🎨 이미지 최적화 권장 사항

### 1. 이미지 크기

- **SwipeCard**: 400x500px (또는 비율 유지)
- **Plan/Home 카드**: 100x100px (썸네일)

### 2. 파일 크기

- 각 이미지 파일 크기: **100KB 이하** 권장
- 전체 50개 이미지: **5MB 이하** 권장

### 3. 이미지 최적화 도구

```bash
# ImageMagick 사용 (설치 필요)
brew install imagemagick

# 이미지 압축 예시
convert input.jpg -quality 85 -resize 400x500 output.jpg

# 또는 온라인 도구 사용
# - TinyPNG (https://tinypng.com)
# - Squoosh (https://squoosh.app)
```

---

## ✅ 체크리스트

### 이미지 파일 준비

- [ ] `public/images/recipes/` 폴더 생성 확인
- [ ] 50개 이미지 파일 복사 완료
- [ ] 파일명이 레시피 ID와 일치하는지 확인 (101.jpg ~ 150.jpg)
- [ ] 이미지 파일 크기 최적화 완료

### 코드 수정

- [ ] `components/SwipeCard.tsx` 이미지 경로 수정
- [ ] `pages/Plan.tsx` 이미지 경로 수정
- [ ] `pages/Home.tsx` 이미지 경로 수정
- [ ] 빌드 테스트 (`npm run build`)
- [ ] 개발 서버에서 이미지 표시 확인 (`npm run dev`)

---

## 🚀 다음 단계

이미지 파일을 `public/images/recipes/` 폴더에 저장한 후, 알려주시면 코드를 수정하여 실제 이미지를 사용하도록 업데이트하겠습니다!

