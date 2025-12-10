#!/bin/bash

# Test create user dengan email notification
# Pastikan server Laravel sudah running (php artisan serve)

# Login sebagai admin dulu untuk dapat token
echo "=== Login sebagai admin ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login gagal! Pastikan ada user admin di database."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "Token: $TOKEN"
echo ""
echo "=== Membuat user baru ==="

# Buat user baru
TIMESTAMP=$(date +%s)
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Test User $TIMESTAMP\",
    \"email\": \"testuser$TIMESTAMP@example.com\",
    \"password\": \"password123\",
    \"nip\": \"19900101$TIMESTAMP\",
    \"jabatan\": \"Staf IT\",
    \"unit_kerja\": \"Bagian TI\",
    \"phone\": \"081234567890\",
    \"roles\": [\"pegawai\"],
    \"is_active\": true
  }"

echo ""
echo ""
echo "=== Cek log email ==="
echo "Email akan tersimpan di: storage/logs/laravel.log"
tail -n 100 storage/logs/laravel.log | grep -A 50 "NewUserMail" || echo "Email belum terkirim, coba cek log lengkap"
