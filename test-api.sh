#!/bin/bash

# API 테스트 스크립트
# 사용법: ./test-api.sh YOUR_JWT_TOKEN

BASE_URL="http://localhost:3001/api"
TOKEN=$1

if [ -z "$TOKEN" ]; then
  echo "❌ JWT 토큰이 필요합니다."
  echo "사용법: ./test-api.sh YOUR_JWT_TOKEN"
  exit 1
fi

echo "🧪 API 테스트 시작..."
echo ""

# 헤더 설정
HEADERS=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

# 1. 사용자 정보 조회
echo "1️⃣ 사용자 정보 조회 (GET /api/auth/me)"
curl -s "${HEADERS[@]}" "$BASE_URL/auth/me" | jq '.' || echo "❌ 실패"
echo ""

# 2. 사용자 설정 조회
echo "2️⃣ 사용자 설정 조회 (GET /api/users/me)"
curl -s "${HEADERS[@]}" "$BASE_URL/users/me" | jq '.' || echo "❌ 실패"
echo ""

# 3. 냉장고 아이템 조회
echo "3️⃣ 냉장고 아이템 조회 (GET /api/fridge)"
curl -s "${HEADERS[@]}" "$BASE_URL/fridge" | jq '.' || echo "❌ 실패"
echo ""

# 4. 냉장고 아이템 추가
echo "4️⃣ 냉장고 아이템 추가 (POST /api/fridge)"
curl -s -X POST "${HEADERS[@]}" -d '{"name":"테스트재료"}' "$BASE_URL/fridge" | jq '.' || echo "❌ 실패"
echo ""

# 5. 식단 조회
echo "5️⃣ 식단 조회 (GET /api/plans)"
curl -s "${HEADERS[@]}" "$BASE_URL/plans" | jq '.' || echo "❌ 실패"
echo ""

# 6. 레시피 선호도 조회
echo "6️⃣ 레시피 선호도 조회 (GET /api/recipes)"
curl -s "${HEADERS[@]}" "$BASE_URL/recipes" | jq '.' || echo "❌ 실패"
echo ""

# 7. 장보기 목록 조회
echo "7️⃣ 장보기 목록 조회 (GET /api/shopping-list)"
curl -s "${HEADERS[@]}" "$BASE_URL/shopping-list" | jq '.' || echo "❌ 실패"
echo ""

# 8. 식사 완료 상태 조회
echo "8️⃣ 식사 완료 상태 조회 (GET /api/meals)"
curl -s "${HEADERS[@]}" "$BASE_URL/meals" | jq '.' || echo "❌ 실패"
echo ""

# 9. Rate Limiting 테스트 (인증 엔드포인트)
echo "9️⃣ Rate Limiting 테스트 (10회 요청)"
for i in {1..11}; do
  echo -n "요청 $i: "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/kakao/callback?code=test")
  echo "HTTP $STATUS"
  if [ "$STATUS" = "429" ]; then
    echo "✅ Rate Limiting 정상 동작!"
    break
  fi
done
echo ""

echo "✅ API 테스트 완료!"







