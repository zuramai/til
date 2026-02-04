---
title: "Rust Interview Questions"
date: 2026-02-04T05:37:42+07:00
draft: false
tags:
    - Rust

# Author
language: de
---

# Why can a variable of type usize be passed to a function without losing ownership but not a variable of type # String?

Because usize implements Copy trait but String does not. usize type is stored in the stack and it has fixed size unlike String that is growable, stored in the heap. A shallow copy will only referencing the same string. It implements clone, which provides deep copy.

# &str is a reference to data allocated where? (Kind of a trick question)

It's a reference that can be stored anywhere. A &'static str will be stored in stack and a &str (from String) is stored in the heap.

# What’s a lifetime?

Lifetime is used to make state how long a reference should live in the process

# What’s a static reference?

A variable that lives until the end of the program. A leaked variable.

# What does static mean as a trait bound?

To make sure that the trait passed is passed as a copy

# If I have a &’static str why is it that I can alias it but have the type of the alias be a &str.

a &'static str is initiated once and if it's moved or aliased it won't be a 'static anymore

# How does sub-typing work with respect to lifetimes?

In a function, a &'static T can be downgraded its lifetime to &'a if &'a has shorter lifetime.

# How do you move a value from the stack onto the heap?

We can use Box

# Why can I pass a &Box<T> into functions that expect an &T?

Because &Box<T> implements Deref<Target = T>

# What do you reach for when you want mutability without passing around a mutable reference?

RefCell<T>

# What do you reach for when you want multiple owners of a value in a single-threaded context? Multi-threaded context?

use Rc<T> for single threaded and Arc<T> for multithreaded

# What are the trade-offs of defining a function generic over T constrained by trait Foo vs. defining the function that excepts a dynamic trait object that implements Foo?

Generics at a compile time will be monomorphized,  whereas dynamic trait object will be stored at lookup table and it will create more performance cost at runtime.

# Did you know that Rust was named after a fungus? (Arguably the most important question).

No
