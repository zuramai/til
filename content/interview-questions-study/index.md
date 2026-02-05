---
title: "Interview Questions Study"
date: 2026-02-05T22:11:18+07:00
draft: false
tags:
    - Rust

# Author
language: en
---

## Phase 1: Technical Screening (General Knowledge)

These questions assess your foundational knowledge, specifically bridging your experience in Go with their requirement for Rust.

### Rust vs. Go Concurrency: "Coming from a Go background with Goroutines, how do you contrast that with Rust’s approach to async/await and thread safety? What are the trade-offs?"

Go provides a very easy way to do a concurrency using goroutines. Using goroutines will easily expose us to data racing without mutexes. In contrast, Rust enforces us to make sure the data is safe to be send across threads using `Send` and `Sync` traits.

In Rust, we don't get a scheduler like goroutine. We have to choose async runtime like Tokio that provides zero cost abstraction and control over memory (unlike Go's GC that has overhead)

### Memory Management: "Can you explain the concept of Ownership and Borrowing to someone who has only used Garbage Collected languages like Go or Python?"

In Garbage Collected languages, the garbage collector watches for the unused variables and data that is not even referenced by anything that is safe to be removed from memory. In Rust, there is only one owner of the data. If someone else want to use the data (e.g. functions), the options are: move it or borrow it. And the data will be freed from the memory when it is out of scope. Thus, it is easier to track the memory using Rust instead of garbage collected languages.

### gRPC & Protocol Buffers: "We use gRPC heavily here. How would you handle versioning in Protocol Buffers to ensuring backward compatibility between our mobile clients and the Rust backend?"

To ensure the backward compatibility between client and server, when adding new features that are non-breaking, we can just add an optional parameter for the new feature and keep the old one, until we roll out the old version. Never change the existing type. 

Add a separate service to ensure backward compatibility.

### Database Consistency: "We use ScyllaDB (eventual consistency) and PostgreSQL (strong consistency). Can you give an example of a feature where you would strictly choose one over the other?"

It's a tradeoff. PostgreSQL has Consistency and Availablity (CA) and ScyllaDB has AP (Availability and Partition Tolerance). CA has strong consistency so it guarantees the data will be consistent across nodes when the network is normal. But if we want to guarantee a service to be running properly, we can chose ScyllaDB which has partition tolerance.

In Amo, ScyllaDB might be more useful in features like Likes, View counts, Social feeds because it doesn't need to be consistent across node immediately and it won't break the user experience. Unless we want to do smth like transactions that all the node should reflect the same data immediately.

### Build Systems: "You mentioned interest in compilers/parsers. Have you worked with hermetic build systems like Bazel before? Why might a monorepo architecture benefit from a tool like Bazel?"

With monorepo using bazel, we can easily integrate Rust codebase with another codebase (such as mobile app functions) because I read on reddit that amo is using UniFFI (Foreign Function Interface) to communicate between programming languages.

Bazel also provides hermetic build. We don't build the entire repo if we only change a small part of the code. Bazel can analyze dependency graph.
