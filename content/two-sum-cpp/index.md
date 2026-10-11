---
title: "Two Sum C++"
date: 2026-10-10T06:44:20+07:00
draft: false
tags:
  - Programming

# Author
language: en
---

This is the first time after college years I wrote C++ again. Still trying to remember and getting used to the C++ syntax.

```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        map<int,int> num;

        num[target - nums[0]] = 0;
        for(int i = 1; i < nums.size(); i++) {
            if (num.contains(nums[i])) {
                return {i, num[nums[i]]};
            }
            num[target - nums[i]] = i;
        }

        return {};
    }
};
```

We use `map<type1, type2>` to initialize maps. It's easier than Rust, we don't have to concern about Option or Result. C++ also have many useful built-in functions in the std types.
