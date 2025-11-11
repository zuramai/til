---
title: "Retrieval-Augmented Generation"
date: 2025-11-11T19:12:00+07:00
draft: false
tags:
    - Tech 
    - AI

# Author
author: "Ahmad Saugi"
language: id
author_image: "/static/images/author/saugi.jpg"
---

RAG adalah teknik untuk meretrieve informasi yang akurat dari konteks yang diberikan. LLM punya limitasi, yaitu akses ke knowledge dan konteks yang terbatas. LLM mempunyai *context window* yang terbatas, jadi kita tidak bisa secara langsung memasukkan semua knowledgenya ketika inference.

Jadi, agar LLM dapat memberikan respon yang lebih baik, kita seharusnya hanya memberikan knowledge yang sesuai dengan query yang diberikan oleh user.

## Beberapa metode RAG

Ada beberapa metode untuk melakukan RAG:

### 2-steps RAG

Cara paling simpel untuk melakukan RAG adalah dengan step ini:

1. User bertanya
2. **Ambil relevant context dari vector database**
3. **Generate jawaban**
4. Return jawaban ke user


### Agentic RAG

Jika di 2-steps RAG kita meretrieve langsung informasi dari vector database, pada agentic RAG ini kita hanya membuat vector search itu sebagai sebuah tool yang dapat digunakan. Stepnya adalah begini:

1. User bertanya
2. Kirim ke LLM, apakah LLM itu membutuhkan external knowledge? 
3. Jika iya, maka LLM memanggil tool untuk mendapatkan external knowledge tersebut (vector search).
4. Jika tidak, maka LLM langsung memberikan jawaban dari knowledge yang sudah dipunyai.


### Hybrid RAG

Ada sebuah problem yang dapat ditemukan ketika kita mengimplementasikan 2-steps RAG, dimana teks pertanyaan tersebut tidak selalu semantically similar dengan knowledge yang kita punya. Jadi, pada Hybrid RAG ini, kita merefine query kita dengan LLM sampai LLM dapat mereturn informasi yang akurat.

Jadi stepnya adalah:

1. User bertanya
2. Pertanyaan user tersebut dienhance agar dapat mendapatkan knowledge yang lebih akurat di vector search
3. Apakah knowledgenya sufficient? Jika iya, maka generate answer. Jika tidak, maka balik ke nomor 2 sampai knowledgenya sufficient.
4. Generate answer.
5. Jika jawabannya memuaskan, return ke user. Jika tidak, cari approach lain (browser search tool, dll).

## Contoh

Jadi, let's say kita ingin membuat AI chat app dengan knowledge tertentu (contoh: hukum dan pasal-pasal indonesia). Step yang akan dilakukan untuk membuat aplikasi tersebut adalah:

1. Kumpulkan semua data hukum dan pasal-pasal di Indonesia. Semakin banyak semakin baik. Bisa didapatkan melalui cara apapun (scraping atau minta data ke suatu pihak)
2. Load semua document tersebut
3. Split ke banyak chunks
4. Ubah setiap chunk tersebut jadi embeddings.
5. Simpan ke vector store

Ketika user bertanya:

1. Vector search dari pertanyaan yang diberikan untuk mendapatkan relevant information
2. Pass knowledgenya ke LLM
3. Return jawaban ke user