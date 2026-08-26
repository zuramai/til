---
title: "ZenML"
date: 2026-08-26T21:20:31+07:00
draft: false
tags:
  - AI

# Author
language: en
---

ZenML is an open source framework to help building the entire line of AI development. Classical ML, ML pipelines, and AI Agents. It can acts as an MLOps tools that can train and serve ML models, and even create AI agents.

ZenML has dashboard to make it easier to manage and track models. Here, we can create pipelines, and each pipeline can contains multiple steps.

For example, to put ML workflows in production, we divide into three pipelines: feature engineering, model training, and inference pipeline.

~[pipeline overview](./pipeline_overview.png)

Feature engineering pipeline split the dataset into train and test dataset, and bake it into training-ready dataset. Model training pipeline fetch the data from the feature pipeline, training, go through model evaluator, then save the output. The output then consumed in the production. We can promote the best model into production just by a single command.

Btw, during training, we can also track the metrics, metadata, and many other data we can put just by executing `.log_metadata()` function.
