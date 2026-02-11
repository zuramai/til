---
title: "RAG Llamaindex"
date: 2026-02-11T17:46:15+07:00
draft: false
tags:
    - Tech
    - AI

# Author
language: en
---


There are many libraries that can be used as a RAG tooling, such as LangChain and LlamaIndex. Although they provide similar features such as tool calling and RAG, they excel at a different point. LlamaIndex excels in data ingestion, indexing, and Retrieval-Augmented Generation while LangChain is more versatile, connecting LLM with tools, and managing chain logic.


There are five steps in building RAG with LlamaIndex:

1. Data Loading
2. Indexing
3. Storing
4. Query
5. Evaluation

First, load the data from the source you want LLM to have the knowledge. It could be from markdown files, json files, web pages, or anything. The data is loaded into the workflow.

LlamaIndex provides many way to read the data, such as using `SimpleDirectoryReader(path)` and we got all the `Document`.

Next, indexing means converting the data to vector embeddings, a numerical representation of your data. There are many strategies to make it easy to accurately find the data. After indexing, we can just use `StorageContext(vector_store)` to avoid re-indexing.

After we got the vector embeddings, we store it into a vector database including its metadata.

We can retrieve the data stored in vector database by querying. There are many ways to utilize the LLM and LlamaIndex structure to query. Many retriever methods are available, including `RetrieverQueryEngine` and `AutoMergingRetriever`.

Last step, the most critical step is to evaluate whether the response is accurate. Evaluation provides objective measures of how accurate and reliable the responses are.
