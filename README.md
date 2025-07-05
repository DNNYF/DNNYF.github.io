# Proyek Chatbot dengan Konfigurasi LLM

Selamat datang di proyek Chatbot & LLM Config Manager. Aplikasi ini adalah aplikasi web Next.js yang menyediakan antarmuka chat dengan AI (menggunakan API Heroku kustom) dan dasbor admin untuk mengonfigurasi parameter model bahasa (LLM).

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Prasyarat](#prasyarat)
- [Cara Mengonfigurasi URL API Heroku](#cara-mengonfigurasi-url-api-heroku)
- [Instalasi & Menjalankan Proyek](#instalasi--menjalankan-proyek)
- [Struktur Proyek](#struktur-proyek)
- [Cara Kerja Aplikasi](#cara-kerja-aplikasi)
- [Akses Admin](#akses-admin)
- [Menghubungkan ke Database (Opsional)](#menghubungkan-ke-database-opsional)

---

### Fitur Utama

- **Antarmuka Chat Interaktif**: Pengguna dapat berinteraksi dengan chatbot AI yang didukung oleh model dari API Heroku kustom Anda.
- **Histori Percakapan**: Semua percakapan disimpan secara lokal di peramban, memungkinkan pengguna untuk melanjutkan percakapan sebelumnya.
- **Dasbor Admin yang Dilindungi**: Halaman admin terpisah untuk mengelola dan menyesuaikan perilaku LLM.
- **Konfigurasi LLM Dinamis**: Admin dapat mengubah parameter seperti *system prompt*, *temperature*, *top-k*, *top-p*, dan lainnya secara langsung dari antarmuka.
- **Desain Responsif**: Dibuat dengan komponen ShadCN UI dan Tailwind CSS untuk pengalaman yang baik di desktop dan perangkat seluler.

### Teknologi yang Digunakan

- **Framework**: Next.js (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS & ShadCN UI
- **AI & Backend**: API kustom yang di-host di Heroku (atau platform lain)
- **Manajemen Form**: React Hook Form & Zod
- **Animasi**: Framer Motion

### Prasyarat

- [Node.js](https://nodejs.org/) (versi 20 atau lebih tinggi direkomendasikan)
- [npm](https://www.npmjs.com/) (biasanya terinstal bersama Node.js)
- URL API LLM Anda sendiri yang di-host di Heroku atau platform lain.

---

### Cara Mengonfigurasi URL API Heroku

Aplikasi ini menggunakan API kustom untuk fungsionalitas AI-nya. Untuk menjalankannya, Anda **wajib** menyediakan URL endpoint API Anda sendiri.

1.  **Siapkan API Anda**:
    -   Pastikan Anda memiliki API yang berjalan dan dapat diakses secara publik, yang menerima permintaan POST dengan format JSON seperti yang dijelaskan di bawah ini.

2.  **Konfigurasi Environment Variable**:
    -   Di direktori utama proyek Anda, buat file baru bernama `.env`. Jika file tersebut sudah ada, buka saja.
    -   Tambahkan baris berikut ke dalam file `.env`, ganti `https://your-heroku-llm-api-url.com/infer` dengan URL API Anda yang sebenarnya.

    ```bash
    HEROKU_API_URL=https://your-heroku-llm-api-url.com/infer
    ```

3.  **Mulai Ulang Server**:
    -   Jika server pengembangan Anda sedang berjalan, hentikan (dengan menekan `Ctrl + C`) dan jalankan kembali dengan `npm run dev` agar perubahan pada file `.env` dapat dibaca.

Logika untuk memanggil API ini ada di file `src/ai/flows/chat.ts`.

---

### Instalasi & Menjalankan Proyek

1.  **Clone Repositori** (jika berlaku) atau pastikan Anda berada di direktori proyek yang benar.

2.  **Instal Dependensi**:
    Buka terminal dan jalankan perintah berikut untuk menginstal semua paket yang diperlukan:
    ```bash
    npm install
    ```

3.  **Konfigurasi URL API**:
    Ikuti langkah-langkah di [Cara Mengonfigurasi URL API Heroku](#cara-mengonfigurasi-url-api-heroku) di atas.

4.  **Jalankan Server Pengembangan**:
    Setelah instalasi selesai, jalankan perintah berikut untuk memulai aplikasi dalam mode pengembangan:
    ```bash
    npm run dev
    ```
    Aplikasi akan tersedia di [http://localhost:9002](http://localhost:9002).

### Struktur Proyek

Berikut adalah gambaran umum tentang file dan direktori penting dalam proyek ini:

```
.
├── src/
│   ├── app/
│   │   ├── chat/         # Halaman chat untuk pengguna
│   │   ├── admin/        # Halaman admin (dilindungi login)
│   │   ├── login/        # Halaman login untuk admin
│   │   ├── layout.tsx    # Layout utama aplikasi
│   │   └── page.tsx      # Halaman utama (mengarahkan ke /chat)
│   │
│   ├── ai/
│   │   └── flows/
│   │       └── chat.ts   # Logika inti untuk memanggil API LLM
│   │
│   ├── components/       # Komponen React yang dapat digunakan kembali (UI dari ShadCN)
│   │   ├── chat-interface.tsx
│   │   ├── chat-history.tsx
│   │   └── llm-config-form.tsx
│   │
│   ├── lib/
│   │   ├── schemas.ts    # Skema Zod untuk validasi form
│   │   └── utils.ts      # Fungsi utilitas (misalnya, cn untuk classname)
│   │
│   └── middleware.ts     # Middleware Next.js untuk melindungi rute /admin
│
├── .env                  # File environment variable (tempat Anda meletakkan URL API)
├── package.json          # Daftar dependensi dan skrip proyek
└── tailwind.config.ts    # Konfigurasi Tailwind CSS
```

### Cara Kerja Aplikasi

- **Halaman Admin (`/admin`)**:
  - Admin login melalui halaman `/login`.
  - Setelah berhasil, mereka dapat mengakses dasbor di `/admin` untuk mengubah parameter LLM.
  - Saat konfigurasi disimpan, pengaturan tersebut disimpan di `localStorage` peramban.

- **Halaman Chat (`/chat`)**:
  - Halaman ini dapat diakses oleh semua pengguna tanpa login.
  - Sebelum mengirim pesan, aplikasi memeriksa `localStorage` untuk setiap konfigurasi yang disimpan oleh admin.
  - Aplikasi mengirim permintaan `fetch` ke `HEROKU_API_URL` yang ditentukan, dengan menyertakan pesan pengguna, riwayat percakapan, dan parameter yang dikonfigurasi.
  - Riwayat percakapan juga disimpan dan diambil dari `localStorage`.

### Akses Admin

Untuk mengakses dasbor admin, gunakan kredensial berikut di halaman `/login`:

- **Email**: `root@gmail.com`
- **Password**: `123`

Kredensial ini di-hardcode di file `src/app/login/actions.ts` dan dapat diubah sesuai kebutuhan.

---

### Menghubungkan ke Database (Opsional)

Saat ini, aplikasi ini menggunakan `localStorage` peramban untuk menyimpan riwayat chat dan konfigurasi LLM. Ini berarti data hanya disimpan di peramban pengguna dan tidak akan tersinkronisasi antar perangkat atau sesi yang berbeda.

Untuk aplikasi produksi, Anda sebaiknya menggunakan database untuk menyimpan data ini secara permanen. Berikut adalah panduan konseptual tentang cara mengintegrasikan **Firestore** (database NoSQL dari Firebase) ke dalam proyek ini.

#### 1. Siapkan Firebase & Firestore

1.  Buka [Firebase Console](https://console.firebase.google.com/).
2.  Buat proyek Firebase baru (atau gunakan yang sudah ada).
3.  Di dalam proyek Anda, buka bagian **Firestore Database** dan buat database baru. Mulai dalam **mode produksi** untuk keamanan.
4.  Buka **Pengaturan Proyek** (ikon gerigi) > **Pengaturan Proyek**.
5.  Di tab **Umum**, scroll ke bawah ke bagian "Aplikasi Anda" dan daftarkan aplikasi web baru.
6.  Salin objek konfigurasi Firebase yang diberikan. Objek ini akan terlihat seperti ini:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIza...",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project.appspot.com",
      messagingSenderId: "...",
      appId: "..."
    };
    ```

#### 2. Konfigurasi di Proyek Next.js

1.  **Tambahkan Konfigurasi ke Environment Variables**:
    Buka file `.env` Anda dan tambahkan kredensial yang Anda salin.

    ```bash
    # Firebase Config
    NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
    NEXT_PUBLIC_FIREBASE_APP_ID="..."
    ```

2.  **Buat File Inisialisasi Firebase**:
    Buat file baru di `src/lib/firebase.ts` untuk menginisialisasi koneksi Firebase.

    ```typescript
    // src/lib/firebase.ts
    import { initializeApp, getApps } from "firebase/app";
    import { getFirestore } from "firebase/firestore";

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Initialize Firebase
    let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    const db = getFirestore(app);

    export { app, db };
    ```
    *Catatan: Paket `firebase` sudah ada di `package.json`.*

#### 3. Ubah Kode Aplikasi

Sekarang Anda perlu mengganti semua logika yang menggunakan `localStorage` dengan panggilan ke Firestore.

-   **Login Admin (`src/app/login/actions.ts`)**:
    Ganti pengecekan kredensial yang di-hardcode dengan query ke koleksi `users` di Firestore.

-   **Konfigurasi LLM (`src/app/actions.ts` dan `src/components/llm-config-form.tsx`)**:
    -   Di `updateLlmConfig` dalam `src/app/actions.ts`, ganti `console.log` dengan logika untuk menyimpan data ke dokumen Firestore.
    -   Di `LlmConfigForm` dalam `src/components/llm-config-form.tsx`, ganti `localStorage.getItem` dengan panggilan untuk mengambil konfigurasi dari Firestore saat komponen dimuat.

-   **Riwayat Chat (`src/app/chat/page.tsx`)**:
    Ini adalah perubahan terbesar. Anda perlu:
    -   Membuat Server Actions baru untuk mengambil dan menyimpan percakapan ke Firestore berdasarkan ID pengguna (jika Anda mengimplementasikan autentikasi pengguna penuh) atau ID unik lainnya.
    -   Mengganti `localStorage.getItem(LS_CHAT_KEY)` di `useEffect` dengan panggilan ke Server Action untuk memuat riwayat chat dari Firestore.
    -   Mengubah `handleSendMessage` dan fungsi terkait lainnya untuk menyimpan pesan baru ke Firestore melalui Server Action, bukan `localStorage.setItem`.

Setelah mengikuti langkah-langkah ini, aplikasi Anda akan menggunakan Firestore sebagai backend database-nya, menjadikannya lebih kuat dan siap untuk produksi.
