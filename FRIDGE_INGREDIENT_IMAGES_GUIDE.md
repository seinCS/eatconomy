# 냉장고 재료 이미지 업데이트 가이드

## 📋 목차
1. [폴더 구조](#폴더-구조)
2. [이미지 파일명 규칙](#이미지-파일명-규칙)
3. [이미지 추가/업데이트 절차](#이미지-추가업데이트-절차)
4. [코드 수정 방법](#코드-수정-방법)
5. [이미지 요구사항](#이미지-요구사항)
6. [테스트 방법](#테스트-방법)

---

## 📁 폴더 구조

### 현재 구조
```
public/
  └── images/
      ├── recipes/        # 레시피 이미지 (101.jpg, 102.jpg, ...)
      └── icon/          # 앱 아이콘
```

### 추가할 구조
```
public/
  └── images/
      ├── recipes/        # 레시피 이미지
      ├── icon/          # 앱 아이콘
      └── ingredients/    # 냉장고 재료 이미지 (새로 생성)
          ├── 계란.jpg
          ├── 김치.jpg
          ├── 양파.jpg
          └── ...
```

---

## 📝 이미지 파일명 규칙

### 규칙
- **재료명 그대로 사용** (한글 포함)
- **확장자**: `.jpg` 또는 `.png` (권장: `.jpg`)
- **대소문자 구분**: 재료명과 정확히 일치해야 함

### 예시
```
계란.jpg
김치.jpg
양파.jpg
돼지고기.jpg
참치캔.jpg
```

### 주의사항
- 파일명에 공백, 특수문자 사용 가능 (한글 포함)
- `constants.ts`의 `MASTER_INGREDIENTS` 배열의 `name` 필드와 정확히 일치해야 함

---

## 🔧 이미지 추가/업데이트 절차

### 1단계: 폴더 생성
```bash
# 프로젝트 루트에서 실행
mkdir -p public/images/ingredients
```

### 2단계: 이미지 파일 추가
1. 재료 이미지를 준비 (권장 크기: 400x400px, 정사각형)
2. 파일명을 재료명과 정확히 일치시킴
3. `public/images/ingredients/` 폴더에 복사

### 예시
```bash
# 예: 계란 이미지 추가
cp ~/Downloads/계란.jpg public/images/ingredients/계란.jpg
```

### 3단계: 코드 수정 (아래 섹션 참조)

### 4단계: 테스트
- 개발 서버 실행: `npm run dev`
- 냉장고 페이지에서 이미지 확인
- 이미지가 없으면 이모지로 폴백되는지 확인

---

## 💻 코드 수정 방법

### `pages/Fridge.tsx` 수정

#### 현재 코드 (이모지 사용)
```typescript
const getEmoji = (name: string, category: string) => {
  if (name.includes('계란')) return '🥚';
  // ... 이모지 반환
};
```

#### 수정 후 코드 (이미지 우선, 이모지 폴백)

**1. 이미지 경로 생성 함수 추가**
```typescript
// 이미지 경로 생성 함수
const getIngredientImage = (name: string): string => {
  return `/images/ingredients/${name}.jpg`;
};
```

**2. IngredientImage 컴포넌트 생성 (권장)**
```typescript
// 재료 이미지 컴포넌트 (이미지 + 이모지 폴백)
const IngredientImage: React.FC<{ name: string; category: string }> = ({ name, category }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <span className="text-2xl mb-1 filter drop-shadow-sm">
        {getEmoji(name, category)}
      </span>
    );
  }
  
  return (
    <img
      src={getIngredientImage(name)}
      alt={name}
      className="w-16 h-16 object-cover rounded-lg mb-1"
      onError={() => setImageError(true)}
    />
  );
};
```

**3. renderItem 함수 수정**
```typescript
// Helper to render an item
const renderItem = (item: {name: string, category: string}) => {
  const hasItem = fridge.includes(item.name);
  
  return (
    <div 
      key={item.name} 
      onClick={() => toggleFridgeItem(item.name)}
      className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 relative overflow-hidden ${
        hasItem 
        ? 'bg-orange-50 border-orange-200 shadow-sm' 
        : 'bg-white border-gray-100'
      }`}
    >
      {/* 이미지 또는 이모지 표시 */}
      <IngredientImage name={item.name} category={item.category} />
      
      <span className={`text-xs font-bold text-center px-1 break-keep ${hasItem ? 'text-gray-900' : 'text-gray-400'}`}>
        {item.name}
      </span>
      
      {hasItem && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></div>
      )}
    </div>
  );
};
```

**전체 수정 예시** (`pages/Fridge.tsx` 상단 부분)
```typescript
import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { Refrigerator, Search, X } from 'lucide-react';
import { INGREDIENT_CATEGORIES, MASTER_INGREDIENTS } from '../constants';

const FridgePage: React.FC = () => {
  const { fridge, toggleFridgeItem } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // 이미지 경로 생성 함수
  const getIngredientImage = (name: string): string => {
    return `/images/ingredients/${name}.jpg`;
  };

  // 이모지 폴백 함수 (기존 유지)
  const getEmoji = (name: string, category: string) => {
    // ... (기존 코드 동일)
  };

  // 재료 이미지 컴포넌트
  const IngredientImage: React.FC<{ name: string; category: string }> = ({ name, category }) => {
    const [imageError, setImageError] = useState(false);
    
    if (imageError) {
      return (
        <span className="text-2xl mb-1 filter drop-shadow-sm">
          {getEmoji(name, category)}
        </span>
      );
    }
    
    return (
      <img
        src={getIngredientImage(name)}
        alt={name}
        className="w-16 h-16 object-cover rounded-lg mb-1"
        onError={() => setImageError(true)}
      />
    );
  };

  // ... (나머지 코드)
  
  // renderItem 함수에서 기존 이모지 부분을 IngredientImage로 교체
  const renderItem = (item: {name: string, category: string}) => {
    const hasItem = fridge.includes(item.name);
    
    return (
      <div 
        key={item.name} 
        onClick={() => toggleFridgeItem(item.name)}
        className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 relative overflow-hidden ${
          hasItem 
          ? 'bg-orange-50 border-orange-200 shadow-sm' 
          : 'bg-white border-gray-100'
        }`}
      >
        <IngredientImage name={item.name} category={item.category} />
        
        <span className={`text-xs font-bold text-center px-1 break-keep ${hasItem ? 'text-gray-900' : 'text-gray-400'}`}>
          {item.name}
        </span>
        
        {hasItem && (
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></div>
        )}
      </div>
    );
  };
  
  // ... (나머지 코드는 동일)
};
```

---

## 🖼️ 이미지 요구사항

### 권장 사양
- **형식**: JPG (권장) 또는 PNG
- **크기**: 400x400px (정사각형)
- **비율**: 1:1 (정사각형)
- **용량**: 50KB 이하 (최적화 권장)
- **배경**: 투명 또는 단색 배경 권장

### 이미지 최적화 도구
- [TinyPNG](https://tinypng.com/) - 이미지 압축
- [Squoosh](https://squoosh.app/) - 이미지 최적화
- [ImageOptim](https://imageoptim.com/) - Mac용 이미지 최적화

### 이미지 준비 팁
1. **일관된 스타일**: 모든 재료 이미지를 동일한 스타일로 준비
2. **명확한 구분**: 재료가 명확하게 보이도록
3. **배경 제거**: 투명 배경 또는 단색 배경 사용
4. **고해상도**: Retina 디스플레이 대응을 위해 2x 크기 권장 (800x800px)

---

## ✅ 테스트 방법

### 1. 로컬 테스트
```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 확인
# http://localhost:3000/fridge
```

### 2. 확인 사항
- [ ] 이미지가 정상적으로 표시되는가?
- [ ] 이미지가 없는 재료는 이모지로 폴백되는가?
- [ ] 이미지 클릭 시 재료 추가/제거가 정상 작동하는가?
- [ ] 모바일 화면에서도 이미지가 잘 보이는가?

### 3. 배포 전 체크리스트
- [ ] 모든 재료 이미지 파일이 `public/images/ingredients/` 폴더에 있는가?
- [ ] 파일명이 `constants.ts`의 재료명과 정확히 일치하는가?
- [ ] 이미지 파일이 Git에 커밋되었는가?
- [ ] 빌드가 성공하는가? (`npm run build`)

---

## 📦 배포 시 주의사항

### Vercel 배포
- `public/` 폴더의 파일은 자동으로 배포됨
- 이미지 파일이 Git에 커밋되어 있어야 함
- 배포 후 이미지가 표시되지 않으면 브라우저 캐시 삭제 후 재시도

### Railway 배포
- 정적 파일은 Vercel에서 서빙되므로 Railway 설정 불필요
- 프론트엔드가 Vercel에 배포되면 자동으로 이미지 사용 가능

---

## 🔄 점진적 마이그레이션 전략

### 단계별 접근
1. **1단계**: 핵심 재료 10개만 이미지 추가 (계란, 김치, 양파, 돼지고기 등)
2. **2단계**: 나머지 재료 이미지 추가
3. **3단계**: 모든 재료 이미지 완성 후 이모지 폴백 제거 (선택사항)

### 우선순위 재료 목록
```
1. 계란
2. 김치
3. 양파
4. 돼지고기
5. 소고기
6. 닭고기
7. 두부
8. 참치캔
9. 스팸
10. 라면
```

---

## 🐛 문제 해결

### 이미지가 표시되지 않을 때
1. **파일 경로 확인**: `public/images/ingredients/재료명.jpg` 경로가 정확한지 확인
2. **파일명 확인**: 재료명과 파일명이 정확히 일치하는지 확인 (대소문자, 공백 포함)
3. **브라우저 캐시**: 하드 리프레시 (`Cmd+Shift+R` 또는 `Ctrl+Shift+R`)
4. **콘솔 에러 확인**: 브라우저 개발자 도구에서 404 에러 확인

### 이미지 로드 실패 시
- `onError` 핸들러가 자동으로 이모지로 폴백
- 콘솔에 에러 로그 출력 (개발 모드)

---

## 📚 참고 자료

### 관련 파일
- `pages/Fridge.tsx` - 냉장고 페이지 컴포넌트
- `constants.ts` - 재료 목록 (`MASTER_INGREDIENTS`)
- `public/images/recipes/` - 레시피 이미지 참고

### 유사 구현 참고
- 레시피 이미지: `/images/recipes/${recipe.id}.jpg`
- 재료 이미지: `/images/ingredients/${재료명}.jpg`

---

## 💡 추가 개선 아이디어

### 향후 개선 가능 사항
1. **이미지 CDN 연동**: Cloudinary, Imgix 등 사용
2. **이미지 지연 로딩**: Lazy loading 구현
3. **WebP 형식 지원**: 더 작은 파일 크기
4. **다크 모드 대응**: 다크 모드용 이미지 추가
5. **애니메이션**: 이미지 로드 시 페이드인 효과

---

**작성일**: 2024-12-09  
**최종 업데이트**: 2024-12-09

