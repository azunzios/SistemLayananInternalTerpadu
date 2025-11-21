perubahan cukup banyak, mungkin kamu bisa hapus dulu file seluruhnya yang ada di local apabila ada konflik. 

copy repository ini

1) install backend
di folder root

cd backend
composer install
php artisan migrate --seed
php artisan serve 

3) install frontend
di folder root

cd frontend
npm install
npm run dev

