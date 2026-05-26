---
title: "Bitmask Operations Leetcode S3120"
date: 2026-05-26T19:17:18+07:00
draft: false
tags:
  - Rust
  - Computer Science

# Author
language: en
---

```rs
impl Solution {
    pub fn number_of_special_chars(word: String) -> i32 {
        let (mut lower, mut upper) = (0u32, 0u32);

        for b in word.bytes() {
            if b.is_ascii_lowercase() {
                lower |= 1 << (b - b'a');
            } else if b.is_ascii_uppercase() {
                upper |= 1 << (b - b'A');
            }
        }

        (lower & upper).count_ones() as i32
    }
}
```

First, we will save the number of lower and upper in zeroes.

```rs
let (mut lower, mut upper) = (0u32, 0u32);
```

Then, we convert the string to bytes since we only need the ascii representation.

```rs
(b - b'a')
```

If the variable `b` value is `c` (ASCII 99), then it substracted by 'a' (ASCII 97) then the value is 2.

```rs
1 << (b - b'a')
```

We create the number 1 in binary, then move by `(b - b'a')` which is 2 (in 'c' example) . So from 001 it moves left the 1 twice, so the result is 100.

```rs
lower |= 1 << (b - b'a');
```

We use bitwise or that compares the bits, if either one is `1`, the result is 1. For example, if the lower value is `101` (c and a exists) and the right side is `010` (b) it will be `111` (abc).

It goes the same to `upper` variable.

At the end, we check the `lower` and `upper` using Bitwise AND.

```rs
(lower & upper).count_ones() as i32
```

if the lower is `101` (a and c) and upper is `011` (b and a), the bitwise and result is `001` (only a). The `.count_ones()` function returns the number of equal value lower and upper.
