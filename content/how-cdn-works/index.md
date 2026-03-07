---
title: "How CDN Works"
date: 2026-03-07T22:35:08+07:00
draft: false
tags:
    - Tech

# Author
language: en
---

CDN is a servers that are distributed across the globe to serve cached content close to end users. Usually, it is used to serve internet content including HTML, CSS, Javascript, images, and videos. It allows end users a faster access to the content.

**Benefits:**

- **Improves website load time** by caching the content and place it near the end users.
- **Increased security** and protects from DDoS.
- **Increased content availability**, the content is replicated to multiple servers globally. So if one server goes down, there are many server that back it up.

## How CDN works

The cached content are stored in high [IOPS NVME SSD storage](https://blog.cloudflare.com/why-we-started-putting-unpopular-assets-in-memory/). Cloudflare uses RAM for caching unpopular content, and SSD for popular content. This kinda counterintuitive from the fact that RAM is significantly faster than SSD. Why don't use RAM for popular content? The main reason is SSD is bad for writes. It will make the SSD worn out faster and causes slower reads. The unpopular content mostly rely on writes than reads The popular assets stay on SSD where read performance is matter most. Doing this way will extend SSD lifespan.

Cloudflare doesn't immediately store the new content to RAM. When the cache system encounters the same assets multiple times, [the system will start to cache the asset](https://blog.cloudflare.com/why-we-started-putting-unpopular-assets-in-memory/#potential-implementation-approaches). The number of appearance is saved with few methods such as hash tables, count-min sketch, bloom filter.
