---
title: "Law of Large Numbers"
date: 2025-11-09T14:09:57+07:00
draft: false
tags:
    - Math

# Author
author: "Ahmad Saugi"
language: id
author_image: "/static/images/author/saugi.jpg"
---

Law of large numbers adalah ketika semakin banyak sampel (n) yang random, semakin dekat dengan expected value. Contohnya, kalo kita ngelempar koin dengan dua sisi, angka atau gambar, which has 50% probability akan keluar angka atau gambar. Semakin banyak kita melempar koin tersebut, akan menghasilkan rata-rata probabilitas keluar angka/gambar yang mendekati expected valuenya, which is 50%.

AVG(X(n)) -> E(x) which n -> infinity

Kita "independence" untuk mendapatkan hasil dari law ini sesuai ekspektasi. Independence means data random ini tidak dipengaruhi dengan data sebelumnya atau "fresh randomness". Kalo dependent, dapat membuat variance (ukuran seberapa besar penyebaran data) menjadi lebih besar.

Contoh independence: coin flip, karena tiap lemparannya itu unpredictable. Probabilitasnya secara konstan adalah 0.5.
Contoh dependence: mengambil kartu dari 52 card deck. Probabilitas mendapatkan kartu pertama kartu As adalah 4/52 (0.076). Tapi ketika sudah mengambil kartu pertama dan mendapatkan Ace, dan kita ingin mengambil kartu kedua, probabilitas mendapatkan kartu Ace kedua adalah 3/51 (0.058). Tapi jika kartu pertamanya bukan ace, probabilitasnya menjadi 4/51 (0.078).

