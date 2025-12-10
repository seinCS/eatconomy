#!/bin/bash

# API 테스트 스크립트
# 사용법: ./test-api.sh <JWT_TOKEN>

API_BASE="http://localhost:3001/api"
TOKEN=$1

if [ -z "$TOKEN" ]; then
    echo "❌ JWT 토큰이 필요합니다."
    echo "사용법: ./test-api.sh <JWT_TOKEN>"
    echo ""
    echo "JWT 토큰은 브라우저 개발자 도구에서 확인할 수 있습니다:"
    echo "localStorage.getItem('eat_jwt_token')"
    exit 1
fi

echo "🧪 API 테스트 시작..."
echo ""

# 테스트 1: 사용자 정보 조회
echo "1️⃣ 사용자 정보 조회"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/users/me")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 성공"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ 실패 (HTTP $HTTP_STATUS)"
    echo "$BODY"
fi
echo ""

# 테스트 2: 냉장고 조회
echo "2️⃣ 냉장고 조회"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/fridge")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 성공"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ 실패 (HTTP $HTTP_STATUS)"
    echo "$BODY"
fi
echo ""

# 테스트 3: 냉장고 재료 추가
echo "3️⃣ 냉장고 재료 추가 (양파)"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"양파"}' \
  "$API_BASE/fridge")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ 성공"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ 실패 (HTTP $HTTP_STATUS)"
    echo "$BODY"
fi
echo ""

# 테스트 4: 식단표 조회
echo "4️⃣ 식단표 조회"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/plans")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 성공"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ 실패 (HTTP $HTTP_STATUS)"
    echo "$BODY"
fi
echo ""

# 테스트 5: 좋아요한 레시피 조회
echo "5️⃣ 좋아요한 레시피 조회"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/recipes/liked")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 성공"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ 실패 (HTTP $HTTP_STATUS)"
    echo "$BODY"
fi
echo ""

# 테스트 6: 장보기 목록 조회
echo "6️⃣ 장보기 목록 조회"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/shopping-list")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 성공"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ 실패 (HTTP $HTTP_STATUS)"
    echo "$BODY"
fi
echo ""

echo "✅ API 테스트 완료!"

