perubahan cukup banyak, mungkin kamu bisa hapus dulu file seluruhnya yang ada di local apabila ada konflik. 

copy repository ini

1) install backend
di folder root

cd backend
composer install
php artisan migrate --seed
php artisan serve 

2) install frontend
di folder root

cd frontend
npm install
npm run dev

buat file: env.local di folder frontend isinya gini:

```
# Backend API Configuration
# URL ke Laravel backend

# API Base URL - Laravel backend running di port 8000
VITE_API=http://localhost:8000/api

# API Timeout (ms) - Optional
VITE_API_TIMEOUT=30000
```

