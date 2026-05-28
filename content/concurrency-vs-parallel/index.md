---
title: "Concurrency vs Parallelism"
date: 2026-05-28T22:36:05+07:00
draft: false
tags:
  - Rust
  - Computer Science

# Author
language: en
---

## Concurrency vs Parallelism

Concurrency is working at multiple task at the same time. Consider a chef in a restaurant. He managed to do all the work like cooking, chopping vegetables, then checking the oven. Only one action happens at a time.

Parallelism is doing multiple thing at the exact same time. There are multiple chef handling multiple tasks at the same moment. It's an actual simultaneous work. We need multiple cores or CPU to do true parallelism.

### Core vs Thread

We need to understand how concurrency works in core and threads. Modern CPU has two threads per core. Back with the example of a kitchen, consider a chef is working on two pads at once. A chef is a representation of a core, and a pad is executed in a thread. In pad 1, the chef has to boil water for 4 minutes. While waiting for the water to boil, the chef is chopping vegetables for pad 2.

When the water starts boiling, the CPU hardware notices that Thread 1 is stalled (waiting). The chef leaves and start working to chop vegetables, which the task will be executed in thread 2.

The real-world example of "boiling water" is I/O operation such as network calls or reading from storage/database. I/O operation is a delay where the CPU has to wait from outside its chip.

On the other side, chopping vegetables is an example for CPU is doing raw, heavy mathematical calculations and zero-waiting around. The data it needs (vegetable) is already sitting xbeside it in L1/L2 caches.

## Rust Concurrency

Handling concurrency while ensuring memory safety is one of Rust major advantage. Historically, problems such as data race and deadlocks are very common when implementing concurrency. By leveraging ownership and type checking, many concurrency errors are prevented in compile-time rather than runtime errors.

To achieve concurrency in Rust, we can utilize the most popular asynchronous runtime, `tokio`. Consider this example:

```rs
use tokio::time::{Duration, sleep};

async fn run_task(task_name: &str) {
    println!("task {} start", task_name);
    sleep(Duration::from_millis(100)).await;
    println!("task {} end", task_name);
}

#[tokio::main]
async fn main() {
    tokio::join(run_task("A"), run_task("B"));
}
```

In above code, we have an async function `run_task` which executes `sleep` function inside. See below output:

```
task "A" start
task "B" start
task "C" start
task "B" end
task "C" end
task "A" end
```

Notice that the task B starts when task A is sleeping. Task C starts when task B is sleeping. When they are all sleeping, tokio reschedules the tasks and pick whatever the CPU scheduling picks. The result could be different between executions, depends on how the operating system schedules this thread.

For those who are familiar with JavaScript, it is equivalent to `Promise.all(run_task("A"), run_task("B"))`.

Tokio also provides `spawn` function that immediately spawn a thread to run the work inside closure. And there is `spawn_blocking` function which we can use to run tasks that requires CPU-heavy or blocking synchronous work so that it won't block the main async executor.
