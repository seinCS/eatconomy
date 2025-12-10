import { Recipe } from './types';

// ============================================
// 애플리케이션 상수
// ============================================

/**
 * 주간 식단표 슬롯 수 (7일 × 2끼 = 14개)
 */
export const WEEKLY_PLAN_SLOTS = 14;

/**
 * 스와이프 페이지에서 보여줄 레시피 수
 */
export const SWIPE_CARD_COUNT = 10;

/**
 * 요일 배열
 */
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * 식사 타입
 */
export const MEAL_TYPES = {
  LUNCH: 'lunch',
  DINNER: 'dinner',
} as const;

export type MealType = typeof MEAL_TYPES[keyof typeof MEAL_TYPES];

// ============================================
// 레시피 및 재료 데이터
// ============================================

/**
 * Chain Cooking 알고리즘에서 제외할 기본 양념
 */
export const STAPLES = [
  '소금', '설탕', '물', '파', '마늘', '밥', '김치', '간장', '고춧가루', 
  '후추', '식용유', '참기름', '깨', '식초', '맛술', '올리고당', 
  '다진마늘', '부침가루', '전분', '깨소금', '다시다', '미림'
] as const;

/**
 * 50개 대표 레시피 (MVP 데이터)
 */
export const SEED_RECIPES: Recipe[] = [
  // --- 1. 돼지고기 & 김치 베이스 (Existing + Expanded) ---
  { id: 101, name: "돼지고기 김치찌개", ingredients: ["돼지고기", "김치", "두부", "파", "마늘"], tags: ["#국물", "#한식", "#소울푸드"], time: "30분", calories: 450 },
  { id: 102, name: "제육볶음", ingredients: ["돼지고기", "양파", "당근", "파", "고추장"], tags: ["#고기", "#매콤", "#밥도둑"], time: "20분", calories: 600 },
  { id: 103, name: "두부김치", ingredients: ["두부", "김치", "돼지고기", "참기름", "깨"], tags: ["#안주", "#한식"], time: "20분", calories: 350 },
  { id: 104, name: "삼겹살 구이", ingredients: ["돼지고기", "마늘", "양파", "버섯", "상추"], tags: ["#고기", "#파티"], time: "20분", calories: 700 },
  { id: 105, name: "김치볶음밥", ingredients: ["김치", "밥", "계란", "스팸", "김가루"], tags: ["#분식", "#한그릇"], time: "15분", calories: 500 },
  { id: 106, name: "돼지고기 장조림", ingredients: ["돼지고기", "계란", "간장", "마늘", "고추"], tags: ["#반찬", "#저장식"], time: "40분", calories: 200 },
  { id: 107, name: "김치전", ingredients: ["김치", "부침가루", "양파", "오징어"], tags: ["#비오는날", "#안주"], time: "20분", calories: 400 },
  
  // --- 2. 계란 & 두부 & 스팸 (Staples) ---
  { id: 108, name: "계란말이", ingredients: ["계란", "당근", "파", "소금"], tags: ["#간단", "#단백질"], time: "10분", calories: 200 },
  { id: 109, name: "두부조림", ingredients: ["두부", "양파", "파", "간장", "고춧가루"], tags: ["#반찬", "#가성비"], time: "15분", calories: 250 },
  { id: 110, name: "스팸김치덮밥", ingredients: ["스팸", "김치", "양파", "밥", "계란"], tags: ["#자취생", "#짭짤"], time: "15분", calories: 700 },
  { id: 111, name: "스크램블 에그", ingredients: ["계란", "우유", "버터", "소금", "후추"], tags: ["#브런치", "#초간단"], time: "5분", calories: 300 },
  { id: 112, name: "스팸마요덮밥", ingredients: ["스팸", "밥", "계란", "마요네즈", "김가루"], tags: ["#초딩입맛", "#한그릇"], time: "10분", calories: 650 },
  { id: 113, name: "계란국", ingredients: ["계란", "파", "양파", "국간장"], tags: ["#국물", "#아침"], time: "10분", calories: 150 },
  { id: 114, name: "마파두부", ingredients: ["두부", "돼지고기", "파", "두반장", "전분"], tags: ["#중식", "#덮밥"], time: "25분", calories: 500 },

  // --- 3. 면 요리 (Noodles) ---
  { id: 115, name: "라면", ingredients: ["라면", "계란", "파"], tags: ["#야식", "#국물"], time: "5분", calories: 500 },
  { id: 116, name: "짜파게티", ingredients: ["짜장라면", "계란", "오이"], tags: ["#별미", "#면"], time: "10분", calories: 600 },
  { id: 117, name: "비빔면", ingredients: ["비빔면", "상추", "계란", "오이"], tags: ["#여름", "#매콤"], time: "10분", calories: 550 },
  { id: 118, name: "간장비빔국수", ingredients: ["소면", "간장", "설탕", "참기름", "김가루"], tags: ["#초간단", "#야식"], time: "10분", calories: 400 },
  { id: 119, name: "잔치국수", ingredients: ["소면", "애호박", "당근", "계란", "김가루"], tags: ["#국물", "#따뜻"], time: "20분", calories: 450 },
  { id: 120, name: "파스타 (알리오올리오)", ingredients: ["파스타면", "마늘", "올리브유", "페페론치노"], tags: ["#양식", "#깔끔"], time: "15분", calories: 500 },
  { id: 121, name: "크림파스타", ingredients: ["파스타면", "우유", "치즈", "베이컨", "양파"], tags: ["#양식", "#꾸덕"], time: "20분", calories: 700 },
  
  // --- 4. 볶음 & 덮밥류 (Rice Bowls) ---
  { id: 122, name: "오므라이스", ingredients: ["계란", "양파", "당근", "밥", "케첩"], tags: ["#양식", "#한그릇"], time: "25분", calories: 600 },
  { id: 123, name: "카레라이스", ingredients: ["감자", "양파", "당근", "돼지고기", "카레가루"], tags: ["#한그릇", "#대량조리"], time: "40분", calories: 550 },
  { id: 124, name: "참치마요덮밥", ingredients: ["참치캔", "계란", "양파", "마요네즈", "김가루"], tags: ["#초간단", "#자취생"], time: "10분", calories: 500 },
  { id: 125, name: "비빔밥", ingredients: ["밥", "계란", "상추", "콩나물", "고추장", "참기름"], tags: ["#건강", "#채소"], time: "15분", calories: 550 },
  { id: 126, name: "소세지야채볶음", ingredients: ["소세지", "양파", "피망", "케첩", "마늘"], tags: ["#안주", "#반찬"], time: "15분", calories: 450 },
  { id: 127, name: "어묵볶음", ingredients: ["어묵", "양파", "당근", "간장", "올리고당"], tags: ["#반찬", "#국민반찬"], time: "10분", calories: 220 },
  { id: 128, name: "감자채볶음", ingredients: ["감자", "당근", "양파", "소금", "후추"], tags: ["#반찬", "#담백"], time: "15분", calories: 180 },
  { id: 129, name: "버섯볶음", ingredients: ["버섯", "양파", "당근", "굴소스"], tags: ["#건강", "#반찬"], time: "10분", calories: 150 },
  { id: 130, name: "진미채볶음", ingredients: ["진미채", "고추장", "마요네즈", "올리고당"], tags: ["#반찬", "#오래감"], time: "10분", calories: 300 },
  
  // --- 5. 국 & 찌개 (Soup) ---
  { id: 131, name: "된장찌개", ingredients: ["된장", "두부", "감자", "양파", "애호박"], tags: ["#국물", "#한식"], time: "25분", calories: 300 },
  { id: 132, name: "순두부찌개", ingredients: ["순두부", "계란", "돼지고기", "바지락", "파"], tags: ["#국물", "#얼큰"], time: "20분", calories: 400 },
  { id: 133, name: "콩나물국", ingredients: ["콩나물", "파", "마늘", "소금"], tags: ["#해장", "#시원"], time: "15분", calories: 100 },
  { id: 134, name: "미역국", ingredients: ["미역", "소고기", "마늘", "국간장", "참기름"], tags: ["#생일", "#한식"], time: "30분", calories: 300 },
  { id: 135, name: "부대찌개", ingredients: ["스팸", "소세지", "라면", "김치", "치즈"], tags: ["#파티", "#국물"], time: "20분", calories: 700 },
  { id: 136, name: "북엇국", ingredients: ["북어채", "계란", "무", "파", "참기름"], tags: ["#해장", "#아침"], time: "20분", calories: 200 },
  { id: 137, name: "만둣국", ingredients: ["만두", "계란", "파", "김가루", "육수"], tags: ["#겨울", "#따뜻"], time: "15분", calories: 450 },

  // --- 6. 빵 & 간편식 (Bread & Simple) ---
  { id: 138, name: "토스트", ingredients: ["식빵", "계란", "잼", "버터"], tags: ["#아침", "#빵"], time: "5분", calories: 300 },
  { id: 139, name: "샌드위치", ingredients: ["식빵", "햄", "치즈", "상추", "토마토"], tags: ["#도시락", "#프레시"], time: "10분", calories: 350 },
  { id: 140, name: "프렌치토스트", ingredients: ["식빵", "계란", "우유", "설탕", "버터"], tags: ["#브런치", "#달콤"], time: "10분", calories: 400 },
  { id: 141, name: "길거리토스트", ingredients: ["식빵", "계란", "양배추", "당근", "케첩"], tags: ["#추억", "#든든"], time: "15분", calories: 450 },
  { id: 142, name: "떡볶이", ingredients: ["떡", "어묵", "고추장", "파", "설탕"], tags: ["#분식", "#매콤"], time: "20분", calories: 500 },
  { id: 143, name: "라볶이", ingredients: ["라면", "떡", "어묵", "고추장", "파"], tags: ["#분식", "#면"], time: "20분", calories: 600 },
  { id: 144, name: "콘치즈", ingredients: ["옥수수콘", "마요네즈", "치즈", "설탕"], tags: ["#안주", "#초간단"], time: "10분", calories: 400 },
  
  // --- 7. 메인 요리 (Special) ---
  { id: 145, name: "닭볶음탕", ingredients: ["닭고기", "감자", "당근", "양파", "고추장"], tags: ["#요리", "#메인"], time: "40분", calories: 600 },
  { id: 146, name: "오징어볶음", ingredients: ["오징어", "양파", "당근", "파", "고추장"], tags: ["#매콤", "#밥도둑"], time: "20분", calories: 300 },
  { id: 147, name: "소고기무국", ingredients: ["소고기", "무", "파", "마늘", "국간장"], tags: ["#국물", "#든든"], time: "30분", calories: 250 },
  { id: 148, name: "잡채", ingredients: ["당면", "돼지고기", "시금치", "당근", "양파"], tags: ["#잔치", "#손많이감"], time: "40분", calories: 400 },
  { id: 149, name: "순대볶음", ingredients: ["순대", "양배추", "깻잎", "들깨가루", "고추장"], tags: ["#안주", "#별미"], time: "20분", calories: 500 },
  { id: 150, name: "감자전", ingredients: ["감자", "소금", "식용유"], tags: ["#비오는날", "#고소"], time: "20분", calories: 300 }
];

/**
 * 초기 냉장고 상태 (테스트용)
 */
export const MOCK_FRIDGE = [
  "계란", "김치", "양파", "스팸", "두부", "감자", "돼지고기", "파스타면"
] as const;

// ============================================
// 재료 카테고리
// ============================================

export const INGREDIENT_CATEGORIES = {
  VEGETABLES: "채소/과일",
  MEAT: "정육/계란",
  SEAFOOD: "수산물",
  DAIRY: "유제품/곡류",
  SAUCES: "양념/오일",
  PROCESSED: "가공식품/기타"
} as const;

/**
 * 이름과 카테고리가 매핑된 마스터 데이터
 */
export const MASTER_INGREDIENTS = [
  // 채소류
  { name: "양파", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "대파", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "마늘", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "김치", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "감자", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "당근", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "양배추", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "콩나물", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "버섯", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "청양고추", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "애호박", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "상추", category: INGREDIENT_CATEGORIES.VEGETABLES },
  { name: "무", category: INGREDIENT_CATEGORIES.VEGETABLES },
  
  // 정육/계란
  { name: "계란", category: INGREDIENT_CATEGORIES.MEAT },
  { name: "돼지고기", category: INGREDIENT_CATEGORIES.MEAT },
  { name: "소고기", category: INGREDIENT_CATEGORIES.MEAT },
  { name: "닭고기", category: INGREDIENT_CATEGORIES.MEAT },
  { name: "베이컨", category: INGREDIENT_CATEGORIES.MEAT },
  
  // 수산물
  { name: "오징어", category: INGREDIENT_CATEGORIES.SEAFOOD },
  { name: "새우", category: INGREDIENT_CATEGORIES.SEAFOOD },
  { name: "어묵", category: INGREDIENT_CATEGORIES.SEAFOOD },
  { name: "멸치", category: INGREDIENT_CATEGORIES.SEAFOOD },
  { name: "참치캔", category: INGREDIENT_CATEGORIES.SEAFOOD },

  // 유제품/곡류
  { name: "밥", category: INGREDIENT_CATEGORIES.DAIRY },
  { name: "우유", category: INGREDIENT_CATEGORIES.DAIRY },
  { name: "두부", category: INGREDIENT_CATEGORIES.DAIRY },
  { name: "치즈", category: INGREDIENT_CATEGORIES.DAIRY },
  { name: "라면", category: INGREDIENT_CATEGORIES.DAIRY },
  { name: "파스타면", category: INGREDIENT_CATEGORIES.DAIRY },
  { name: "식빵", category: INGREDIENT_CATEGORIES.DAIRY },
  
  // 양념/오일 (Staples 포함 - 보유 체크용)
  { name: "고추장", category: INGREDIENT_CATEGORIES.SAUCES },
  { name: "된장", category: INGREDIENT_CATEGORIES.SAUCES },
  { name: "간장", category: INGREDIENT_CATEGORIES.SAUCES },
  { name: "소금", category: INGREDIENT_CATEGORIES.SAUCES },
  { name: "설탕", category: INGREDIENT_CATEGORIES.SAUCES },
  { name: "참기름", category: INGREDIENT_CATEGORIES.SAUCES },
  { name: "식용유", category: INGREDIENT_CATEGORIES.SAUCES },
  { name: "케첩", category: INGREDIENT_CATEGORIES.SAUCES },
  { name: "마요네즈", category: INGREDIENT_CATEGORIES.SAUCES },

  // 가공식품
  { name: "스팸", category: INGREDIENT_CATEGORIES.PROCESSED },
  { name: "만두", category: INGREDIENT_CATEGORIES.PROCESSED },
  { name: "소세지", category: INGREDIENT_CATEGORIES.PROCESSED },
  { name: "김", category: INGREDIENT_CATEGORIES.PROCESSED },
  { name: "떡", category: INGREDIENT_CATEGORIES.PROCESSED }
] as const;

// ============================================
// 프로필 설정 옵션
// ============================================

/**
 * 일반적인 알레르기 원인 식품
 */
export const COMMON_ALLERGENS = [
  "계란", "우유", "땅콩", "대두", "밀", "고등어", "게", "새우", 
  "돼지고기", "복숭아", "토마토", "조개류"
] as const;

/**
 * 일반적으로 싫어하는 음식
 */
export const COMMON_DISLIKED_FOODS = [
  "오이", "당근", "가지", "브로콜리", "피망", "고수", "버섯", 
  "생굴", "콩밥", "파"
] as const;
