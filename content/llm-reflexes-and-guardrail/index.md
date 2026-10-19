---
title: "LLM Reflexes and Guardrail"
date: 2026-10-19T22:05:45+07:00
draft: false
tags:
  - LLM

# Author
language: en
---

AI will try to do something dumb. Not because it's a malicious model, but it's a probabilistic model. You give an AI agent a shell and it will execute `rm -rf` on anything it suggest worth clean up, or `git push --force` and rewrite the entire commit history.

The model actually never executes anything, it requests. The model asked and the machine did.

In this article, there are four layer to guard LLM agents from being astray.

1. **Layer 0: Don't give it the hands**. The cheapest way to guard is to not giving them tools. Every tool you expose is the surface of attack and accident.
2. **Layer 1: deterministic reflexes.** Protect paths, like writing to `~/.ssh` or `.env`. Add allowlist or denylist such as "anything with `--force` ask first." Spend more time writing rules.
3. **Layer 2: Asking the human.** Add human intervention in the loop by adding prompt such as "auto-approve reads, ask for writes."
4. **Layer 3: use LLM to judge the LLM.** Use another model to judge another llm. The big brain could ask "given the user request want to execute this command, is executing it okay or not?"
5. **Layer 4: what if the accident already went through?** Make sure it's recoverable. Most project in damage is on `git checkout` or stashed. You can switch back to the a specific commit back. Next, sandboxes are a good way to prevent the damage to go out. This is an OS-level enforcement.

Source: https://github.com/IsuruMaduranga/harness-engineering-101/blob/main/src/13-reflexes-and-guardrails.md
