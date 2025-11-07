---
title: "Loading LLM Models"
date: 2025-11-07T20:47:43+07:00
draft: false
tags:
    - Tech
# Author
author: "Ahmad Saugi"
language: en
author_image: "/static/images/author/saugi.jpg"
---

Why do people are drawn to macs to run LLM locally instead of Nvidia with CUDA support?

1. Mac are more portable and cheaper for equal performance of NVIDIA GPUs.
2. Unified memory can use the same data in CPU and GPU without moving the data back and forth.
3. Mac Metal and MLX is improving.

How LLM models are loaded:

1. The LLM models (safetensors, gguf, etc) are loaded from disk into the memory.
2. When inference, the weights are transferred from RAM to VRAM. But we still need RAM to keep the system overhead and if VRAM is full, it can possibly spills to RAM when GPU memory spikes.
3. When inference is done, the weights stays in the VRAM. 
4. In unified memory, there is no "offload" step because the RAM and VRAM stay in the same pool. So this is more efficient.
5. The VRAM gets freed when the model is explicitly unloaded.