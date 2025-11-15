# Aplikasi Perbaikan & Zoom Management  
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?logo=laravel&logoColor=white&style=for-the-badge)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge)

Aplikasi ini terdiri dari **Backend (Laravel)** dan **Frontend (React + Vite)**.  

Liat branch `dev`, di branch ini kita akan developing program.  
`main` adalah **versi stable**, sehingga *tidak boleh langsung push ke main*.

---

# 📂 Struktur Project

backend/ # Laravel API  
frontend/ # React + Vite client  

# Instalasi Backend (Laravel)

## Requirements

Composer versi 2  
PHP minimal veri 8.2  
dan kita akan menginstall Laravel versi 12.0  

## Masuk ke folder backend:

```bash
cd backend
```

## Install dependecies

`composer install`

## Jalankan migrasi

Sementara belum ada data yang dibuat
  
## Jalankan server Laravel

`php artisan serve` (biasanya ada di localhost:8000)

# Instalasi Frontend (React + Vite (typescript))  

Node.js minimal versi 24 LTS  

## Masuk ke folder

`cd frontend`

## Install dependencies

`npm install`

## Buat file .env

Nanti kita atur .env nya ketika backendnya sudah mulai dibuat

## Jalankan frontend

`npm run dev`  
vite akan berjalan di localhost:5173 sedangkan appnya ada di localhost:3000   

# Workflow Pengembangan (Sangat Penting)

1. Semua tugas ada di GitHub Issues
     - Buka tab Issues
     - Pilih tugas
     - Lihat siapa yang mengerjakan
     - Jangan kerjakan tanpa Issue

2. Kerjakan tiap Issue menggunakan branch baru

      - Format nama branch:  
        `feature/<judul-issue>-<nomor-issue>`  
        Contoh:  
        `feature/login-page-7`  
      - Cara membuat branch:

        ```
        git checkout dev  
        git pull  
        git checkout -b feature/login-page-7  
        ```

3. Setelah selesai coding → push ke branch tersebut
```
git add .  
git commit -m "feat: selesai login page (#7)"  
git push -u origin feature/login-page-7  
```

4. Buat Pull Request ke dev

JANGAN PERNAH bikin PR ke main.
main = stable release only.

Review & merge akan dikelola oleh maintainer.

# Branch Rules
 
|Branch	   |Fungsi                                     |  
|----------|-------------------------------------------|  
|main	   |Versi stable. Hanya merge dari dev.        |  
|dev	   |Tempat semua fitur digabung sebelum stable.|  
|feature/* |Branch kerja developer berdasarkan Issue.  | 

# Testing

Belum ada 

# Catatan Penting

Jangan pernah commit .env

Backend .env dan Frontend .env berbeda

PR hanya boleh menuju branch dev

