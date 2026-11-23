---
title: Kubernetes Core Objects
date: 2026-11-23T16:08:46+00:00
draft: false
tags:
  - Tech
language: en
---
1. Pod

   a smallest deployable unit that wrap (one or more) containers that share network and storage
2. Deployment

   Manages replicas and handle rolling updates without downtime
3. Service

   Gives pods a network identity and load balances the traffic
4. ConfigMap & Secret

   Basically the name. Stores non-sensitive configurations and sensitive creds from container images
5. Namespace

   Logical isolation boundaries inside a single cluster.
