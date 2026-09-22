# Jadwal Terpadu dan Pustaka Organisasi

## Ringkasan
- Rapikan kartu **Kelas berikutnya** agar penanda waktu, hari/tanggal, dan kelas memiliki jarak serta hierarki yang jelas.
- Susun **Jadwal hari ini** berdasarkan waktu mulai paling awal.
- Gabungkan kuliah, sesi asistensi, dan rapat rutin organisasi ke daftar hari ini.
- Tambahkan pintu pilihan di **Pustaka**: **Akademik** atau **Organisasi**.
- Buat ruang Organisasi yang bersifat opsional dan diisi sendiri oleh pengguna.

## Perubahan yang Dibangun
1. **Jadwal hari ini**
   - Urutkan semua agenda berdasarkan jam mulai.
   - Tampilkan kelas dan sesi asistensi dengan label jenis agenda yang berbeda.
   - Tampilkan rapat rutin organisasi yang jatuh pada hari tersebut.
   - Kelas tetap membuka rincian mata kuliah; agenda lain menampilkan informasi yang relevan tanpa tautan palsu.

2. **Kelas berikutnya**
   - Tetap hanya berisi kelas mulai besok dan seterusnya.
   - Pisahkan visual “Besok/Minggu ini”, hari-tanggal, dan label kelas agar tidak berdempetan.

3. **Pilihan Pustaka**
   - Saat masuk Pustaka, tampilkan dua pilihan yang jelas: Akademik dan Organisasi.
   - Akademik mempertahankan seluruh tampilan dan fungsi yang sudah ada.
   - Pengguna dapat kembali ke pilihan awal untuk berpindah ruang.

4. **Pustaka Organisasi**
   - Pengguna dapat menambah organisasi sendiri; bagian ini sepenuhnya opsional.
   - Di dalam setiap organisasi, pengguna dapat menyimpan: tautan, tugas, rutinitas harian, rutinitas mingguan, rapat rutin, SOP, dan item lainnya.
   - Form menyesuaikan jenis item: judul/deskripsi, tautan opsional, serta hari dan jam untuk rutinitas atau rapat.
   - Item dapat dibuka, ditandai selesai untuk tugas, dan dihapus.
   - Data organisasi disimpan per akun pada perangkat yang digunakan, mengikuti pola penyimpanan akun yang sudah ada.

## Detail Teknis
- Tambahkan model dan penyimpanan terpisah untuk organisasi agar tidak bercampur dengan arsip akademik.
- Hubungkan rapat rutin organisasi ke Beranda melalui data bersama yang sama.
- Pertahankan bahasa visual, warna, kartu, dan tombol aplikasi yang sudah ada.
- Verifikasi tampilan desktop dan seluler serta alur tambah/hapus item organisasi.
