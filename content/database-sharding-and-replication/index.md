---
title: "Database Sharding and Replication"
date: 2026-10-14T21:39:51+07:00
draft: false
tags:
  - Computer Science

# Author
language: en
---

Database sharding and replication are both horizontal scaling technique. But there are key differences. Sharding means writing a different data to a different node depending on the sharding key. Meanwhile replication means multiple database nodes share the same data, the difference is only how they read and write data.

The usual order of escalation is first we can do vertical scaling as it's a simple upgrade. No hassle needed by changing the application code or whatever. But there is ceiling. We can't just upgrade and upgrade the resource as it gets more expensive as more powerful machine is getting more expensive.

Second, if the application is read-heavy, consider adding read-replicas. This scales only for reads, not writes.

Then we can do sharding. We have to set the shard key or sharding function. For example, we want to set `user_id` as the sharding key. If we set `user_id % 4` as the sharding function, the number it produces refers to which shard it will writes into. User ID 4 will write into shard 0. User ID 5 will write into shard 1, and so on.

Sharding and replication solve different problems. Use replication if you need high availability and higher read capacity. Use sharding if you have a huge volume or data size as they can split up to multiple storage.
