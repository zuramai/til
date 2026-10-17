---
title: "Zigzag Conversion"
date: 2026-10-16T22:22:53+07:00
draft: false
tags:
  - Leetcode

# Author
language: en
---

Example:

```
Input: s = "PAYPALISHIRING", numRows = 4
Output: "PINALSIGYAHRPI"
Explanation:
P     I    N
A   L S  I G
Y A   H R
P     I
```

```cpp
class Solution {
public:
    string convert(string s, int numRows) {
        if (numRows == 1) {
            return s;
        }

        int cycle = (numRows - 1) * 2;
        string result = "";
        for (int row = 0; row < numRows; row++) {
            for(int i = row; i < s.size(); i+=cycle) {
                result += s[i];
                int diag = i + cycle - 2 * row;
                if (row != 0 && row != numRows - 1 && diag < s.size()) {
                    result += s[diag];
                }
            }
        }

        return result;
    }
};
```
