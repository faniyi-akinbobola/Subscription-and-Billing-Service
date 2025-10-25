#!/bin/bash

echo "🧪 Testing Authentication System"
echo "================================"

BASE_URL="http://localhost:3000"

echo
echo "1. Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Signup Response:"
echo "$SIGNUP_RESPONSE" | jq '.'

# Extract token from signup response
TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token from signup"
  exit 1
fi

echo
echo "2. Testing Profile Access with Token..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "Profile Response:"
echo "$PROFILE_RESPONSE" | jq '.'

echo
echo "3. Testing Signin..."
SIGNIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Signin Response:"
echo "$SIGNIN_RESPONSE" | jq '.'

echo
echo "4. Testing Signout..."
SIGNOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signout" \
  -H "Authorization: Bearer $TOKEN")

echo "Signout Response:"
echo "$SIGNOUT_RESPONSE" | jq '.'

echo
echo "5. Testing Profile Access After Signout (should fail)..."
PROFILE_AFTER_SIGNOUT=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "Profile After Signout Response:"
echo "$PROFILE_AFTER_SIGNOUT" | jq '.'

echo
echo "6. Testing Protected Users Route (should fail without token)..."
USERS_NO_TOKEN=$(curl -s -X GET "$BASE_URL/users")

echo "Users Without Token Response:"
echo "$USERS_NO_TOKEN" | jq '.'

echo
echo "✅ Authentication testing complete!"