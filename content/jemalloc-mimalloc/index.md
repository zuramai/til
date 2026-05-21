---
title: "Jemalloc Mimalloc"
date: 2026-05-21T13:10:43+07:00
draft: false
tags:
  - Rust
# Author
language: en
---

Jemalloc and mimalloc is a memory allocator, a subsystem that decides how much memory to allocate, when and what to free, and where the bytes come from (heap, arena).

jemalloc is a memory allocator developed by Jason Evans for FreeBSD. It aims for a better performance for multithreaded applications by reducing memory fragmentation---an inefficient use of memory where free space is split into small and non-contiguous chunks.

Traditional `malloc` allocates memory by searching a large continuous memory region and allocate the heap space, then return the pointer of the allocated memory. On the other hand, `jemalloc` uses many strategies like size classes, thread caching to reduce lock contention, delayed reclamation and segmentation to reduce memory fragmentation.
