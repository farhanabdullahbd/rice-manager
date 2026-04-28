#!/bin/bash
echo "======================================"
echo "  POS সিস্টেম সেটআপ শুরু হচ্ছে..."
echo "======================================"

# Backend dependencies
echo ""
echo "1. Backend package install করা হচ্ছে..."
cd backend && npm install --silent

# Database setup
echo "2. Database তৈরি করা হচ্ছে..."
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init
echo "3. Sample data যোগ করা হচ্ছে..."
node prisma/seed.js

# Frontend dependencies & build
echo "4. Frontend package install করা হচ্ছে..."
cd ../frontend && npm install --silent
echo "5. Frontend build করা হচ্ছে..."
npm run build

cd ..

echo ""
echo "======================================"
echo "  ✅ সেটআপ সম্পন্ন!"
echo "======================================"
echo ""
echo "  এখন server চালু করতে:"
echo "  node backend/src/app.js"
echo ""
echo "  লগইন তথ্য:"
echo "  ইমেইল:    admin@pos.com"
echo "  পাসওয়ার্ড: admin123"
echo "======================================"
