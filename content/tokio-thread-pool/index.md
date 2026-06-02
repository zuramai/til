---
title: "Tokio Thread Pool"
date: 2026-06-02T21:47:07+07:00
draft: false
tags:
  - Rust

# Author
language: en
---

Tokio async runtime manages the thread pool. By default, it uses `num_cpus` worker threads. We can also set the number of worker threads.

There are tokio async pool and tokio blocking pool. All of them are put in the same CPU cores. The difference is that async thread can handle hundreds of tasks, switching at `.await`. Blocking thread only works for a single task from start to end.

**How many worker thread maximum?**

There is no maximum enforced by tokio. But it depends on your operating system and RAM.
Each created thread creates an overhead of 2 MB stack. If there is 1024 threads, then we allocate 2 GB just for stacks.
