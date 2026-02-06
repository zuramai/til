---
title: "Cap Theorem"
date: 2026-02-06T05:48:24+07:00
draft: false
tags:
    - Computer Science

# Author
language: en
---


We only can choose two from three: 

- Consistency
- Availability
- Partition Tolerance

PostgreSQL is CA, sacrificing partition tolerance for high consistency. ScyllaDB is AP because it prioritizes uptime and reliability over consistency.

### Consistency

To have a consistent data means the read should returns the latest written data or error. Any update to data should immediately take an effect to all clients. Whenever the data is written in one node, it should reflected in all node.

### Availability

Any request to available node should return a response. A highly available system is ready to give response.

### Partition Tolerance

A system that is partition tolerant should works normally whenever the parts of the network can't communicate reliably that makes a node can't communicate to each other. This will possibly make the data inconsistent.
