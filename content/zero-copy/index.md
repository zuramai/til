---
title: "Zero Copy"
date: 2026-05-01T23:18:45+07:00
draft: false
tags:
  - Computer Science

# Author
language: en
---

Zero copy is a technique to transfer data without having the CPU to copy one memory area to another.

In Rust, we can do it by passing around the references such as `&[u8]` or `&str` that copy the pointer to the original buffer.
