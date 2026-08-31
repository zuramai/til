---
title: "CIDR"
date: 2026-08-31T21:51:13+07:00
draft: false
tags:
  - Tech
  - Network

# Author
language: en
---

IP address formats are separated into two category: classful address and classless address. The classful address is an IP address that are known as the standard IP address. It consists of 32 bits, which each string of number is a 8 bit separated by a period.

Class A IPv4 address has 8 bit prefix. For example 44.0.0.1, 44 is the network address, and 0.0.1 is the host address.
Class B IPv4 address has 16 network prefix bits, For example 128.16.0.2, 128.16 is the network address and 0.2 is the host address.
Class C IPv4 address has 24 network prefix bits, For example 192.168.0.1, 192.168.0 is the network address and 1 is the host address.

Meanwhile classless addresses, which known by Classless Inter-Domain Routing (CIDR) use subnet masking. Class C only supports 255 hosts. If you have 300 devices, you're forced to connect the 45 devices to class B address which we can't combine both (limited by network design). And we'll have 65,234 unused IP address.

CIDR can reduce IP address wastage. It provides flexibility and we can provision the required number of IP addresses for particular network. CIDR reduces routing table entries and simplifies packet routing.

CIDR allows routers to organize IP address to multiple subnets efficiently. A subnet is a smaller network within a network. For example, devices that connect to the same router are on the same subnet and have the same IP address prefix.
