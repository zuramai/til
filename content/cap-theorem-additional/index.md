---
title: "CAP Theorem Additional"
date: 2026-11-12T23:11:11+07:00
draft: false
tags:
  - Computer Science

# Author
language: en
---

In the article [CAP Theorem](../cap-theorem) I wrote, it was said that we can only choose 2 of 3 between Consistency, Availability, and Partition Tolerance. In fact, we only have two options: CP and AP. CA is never an option because network partition is not a design choice, it's a fault. CA is only works if partition never happens which we can't assume 100% of the time it runs correctly.

Which to choose? CP or AP? It depends.

Suppose there are two users and two nodes that connect to each other within network. The initial value of `x` is 1. User A update the value `x = 2` in node A. Then user B reads the value `x` in node B. What will node B return? 1 or 2?

It depends. If node B returns 1, it means the system stays available. If the node B returns 2, it stays consistent.
