# Zavod ombori

Zavod ombori uchun kirim-chiqim hisobi. Omborga nima keldi, qancha qoldi, nima qayerga (qaysi sex, texnika yoki kimga) ketdi — hammasi bitta joyda. Telefonda ilova (APK) kabi ishlaydi.

```
ombor/
├── backend/    → Express.js API (Vercel serverless) + MongoDB Atlas
└── frontend/   → Next.js ilova (telefon uchun, PWA)
```

## Imkoniyatlar

- **Ombor**: mahsulotlar ro'yxati, qoldiq, kategoriya bo'yicha filtr, qidiruv, "Kam qoldi" / "Tugagan" belgilari
- **Kirim**: miqdor, narx, yetkazib beruvchi, nakladnoy raqami, kim qabul qildi
- **Chiqim**: bo'lim/sex, texnika/mashina, mas'ul shaxs, izoh. Ombordagidan ortiq chiqim qilib bo'lmaydi
- **Tarix**: kun bo'yicha guruhlangan, davr va filtrlar, Excel (CSV) ga yuklab olish
- **Hisobot**: qaysi mahsulot, qaysi sex, qaysi texnika, kim qancha oldi — summalar bilan
- **Kategoriyalar**: o'zingiz yaratasiz (rang va belgi tanlanadi)
- **Foydalanuvchilar va rollar**: Administrator, Omborchi, Kuzatuvchi
- O'rtacha tannarx avtomatik hisoblanadi, ombor qiymati bosh sahifada ko'rinadi
- Telefonga "ilova" sifatida o'rnatiladi (PWA), tungi rejim avtomatik

---

## 1-qadam. MongoDB Atlas

1. https://cloud.mongodb.com da ro'yxatdan o'ting va **bepul (M0) cluster** yarating.
2. **Database Access** → *Add New Database User* → login va parol yarating (parolni saqlab qo'ying).
3. **Network Access** → *Add IP Address* → **`0.0.0.0/0`** (Allow access from anywhere). Bu shart, chunki Vercel serverlari IP manzilini o'zgartirib turadi.
4. **Database** → *Connect* → *Drivers* → ulanish satrini nusxalang. U shunday ko'rinishda bo'ladi:
   ```
   mongodb+srv://USER:PAROL@cluster0.xxxxx.mongodb.net/ombor?retryWrites=true&w=majority
   ```
   `.net/` dan keyin **`ombor`** (baza nomi) yozilganiga e'tibor bering.

## 2-qadam. GitHub

```bash
cd ombor
git init
git add .
git commit -m "Zavod ombori"
git branch -M main
git remote add origin https://github.com/USERNAME/ombor.git
git push -u origin main
```

## 3-qadam. Backend'ni Vercel'ga joylash

1. https://vercel.com → **Add New… → Project** → GitHub'dagi `ombor` repozitoriyasini tanlang.
2. **Root Directory** → `backend` ni tanlang.
3. **Framework Preset** → `Other`.
4. **Environment Variables** bo'limiga qo'shing:

   | Nomi | Qiymati |
   |---|---|
   | `MONGODB_URI` | Atlas'dan olingan ulanish satri |
   | `JWT_SECRET` | Uzun tasodifiy matn (masalan, 40 ta belgi) |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD` | Birinchi admin paroli |
   | `FRONTEND_URL` | Hozircha bo'sh qoldiring (4-qadamdan keyin to'ldirasiz) |

5. **Deploy**. Tayyor bo'lgach, manzil beriladi, masalan: `https://ombor-backend.vercel.app`
6. Tekshirish: brauzerda `https://ombor-backend.vercel.app/api/health` → `{"ok":true}` chiqishi kerak.

## 4-qadam. Frontend'ni Vercel'ga joylash

1. Vercel → yana **Add New… → Project** → o'sha `ombor` repozitoriyasi.
2. **Root Directory** → `frontend`. Framework avtomatik **Next.js** bo'ladi.
3. **Environment Variables**:

   | Nomi | Qiymati |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | Backend manzili, masalan `https://ombor-backend.vercel.app` (oxirida `/` yo'q) |

4. **Deploy**. Masalan: `https://ombor-zavod.vercel.app`
5. Backend loyihasiga qayting → **Settings → Environment Variables** → `FRONTEND_URL` = frontend manzili → **Deployments → Redeploy**.

> `NEXT_PUBLIC_API_URL` ni keyin o'zgartirsangiz, frontend'ni qayta deploy qiling — bu qiymat build paytida yoziladi.

## 5-qadam. Birinchi kirish

1. Frontend manzilini oching.
2. Login: `ADMIN_USERNAME`, parol: `ADMIN_PASSWORD` (Vercel'da yozganingiz).
3. Birinchi kirishda admin avtomatik yaratiladi. Shu bilan birga boshlang'ich kategoriyalar (Yoqilg'i, Moylar, Metall va armatura…) va bo'limlar qo'shiladi. Ularni **Sozlamalar** dan o'zgartirishingiz yoki o'chirishingiz mumkin.
4. **Sozlamalar → Foydalanuvchilar** dan omborchilarga login bering.
5. Kirgandan keyin **Sozlamalar → Parolni o'zgartirish** orqali admin parolini almashtiring.

## Telefonga ilova qilib o'rnatish

- **Android (Chrome)**: saytni oching → ⋮ menyu → **"Ilovani o'rnatish"** yoki **"Bosh ekranga qo'shish"**.
- **iPhone (Safari)**: Ulashish tugmasi → **"На экран «Домой»" / "Add to Home Screen"**.

Shundan keyin ilova bosh ekrandan to'liq ekranli, brauzer panelisiz ochiladi — xuddi APK kabi. Ilova belgisini uzoq bossangiz, "Kirim" va "Chiqim" tezkor tugmalari chiqadi (Android).

---

## Rollar

| Rol | Nima qila oladi |
|---|---|
| **Administrator** | Hammasi: foydalanuvchilar, o'chirish, noto'g'ri harakatni bekor qilish |
| **Omborchi** | Kirim, chiqim, mahsulot, kategoriya, bo'lim va texnika qo'shish |
| **Kuzatuvchi** | Faqat ko'rish va hisobotlar (masalan, rahbar yoki buxgalter uchun) |

## Kompyuterda ishga tushirish (ixtiyoriy)

```bash
# Backend
cd backend
cp .env.example .env      # ichini to'ldiring
npm install
npm run dev               # http://localhost:4000

# Frontend (boshqa terminalda)
cd frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

## Texnik tafsilotlar

- **Qoldiq hisobi**: har bir kirim/chiqim `movements` kolleksiyasiga yoziladi, mahsulot qoldig'i atomar (`$inc`) tarzda yangilanadi. Chiqimda qoldiq minusga tushmaydi — bir vaqtda ikki kishi chiqim qilsa ham.
- **Noto'g'ri kiritilgan harakat**: admin uni **Tarix** dan ochib "Bekor qilish" tugmasini bosadi, qoldiq avtomatik tiklanadi.
- **O'chirish**: tarixi bor mahsulot yoki bo'lim o'chirilmaydi, arxivlanadi. Shunday qilib eski hisobotlar buzilmaydi.
- **Narx**: kirimda narx kiritilsa, o'rtacha tannarx qayta hisoblanadi. Chiqim shu narx bo'yicha baholanadi.

### API qisqacha

| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/api/auth/login` | Kirish |
| GET | `/api/auth/me` | Joriy foydalanuvchi |
| GET/POST/PUT/DELETE | `/api/categories` | Kategoriyalar |
| GET/POST/PUT/DELETE | `/api/products` | Mahsulotlar (`?search=&category=&status=low\|empty`) |
| GET/POST/PUT/DELETE | `/api/targets` | Bo'limlar va texnika (`?kind=department\|vehicle`) |
| GET | `/api/movements` | Harakatlar (`?type=&product=&from=&to=&page=`) |
| POST | `/api/movements/in` | Kirim |
| POST | `/api/movements/out` | Chiqim |
| DELETE | `/api/movements/:id` | Bekor qilish (admin) |
| GET | `/api/stats/dashboard` | Bosh sahifa |
| GET | `/api/stats/report` | Hisobot (`?type=out\|in&from=&to=`) |
| GET/POST/PUT/DELETE | `/api/users` | Foydalanuvchilar (admin) |
