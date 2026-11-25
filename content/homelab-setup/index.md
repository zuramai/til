---
title: Homelab Setup
date: 2026-11-25T15:42:42+00:00
draft: false
tags:
  - Tech
language: en
---
Today I learn to setup my home server and installed these softwares:

* k3s

  * put all my apps here
  * postgres & mongo
* self-hosted apps

  * vaultwarden
  * infisical
  * navidrome
  * cloudflared
  * AFFiNE

<br />

The device is connected to tailscale so that I can access it everywhere. To serve the apps publicly, we use `tailscale serve` for the self-hosted apps and setup CloudFlare published application to route the domain to the local served URL. The app and cloudflared should be connected within one network.

<br />

The configs are available in my repository: <https://github.com/zuramai/homelab>
