---
title: "Basic Linked List Rust"
date: 2026-02-20T22:39:26+07:00
draft: false
tags:
    - Tech
    - Rust

# Author
language: en
---

I'm using `Rc<RefCell>` for interior mutability.

```rs
use std::{cell::RefCell, rc::Rc};

#[derive(Debug)]
pub struct LinkedList<T> {
    head: Option<Rc<RefCell<Node<T>>>>,
}

#[derive(Debug)]
pub struct Node<T> {
    val: Option<T>,
    next: Option<Rc<RefCell<Node<T>>>>,
}

impl<T> Node<T> {
    pub fn new(val: Option<T>) -> Self {
        Self {
            val: val,
            next: None,
        }
    }
}

impl<T> LinkedList<T> {
    pub fn new(val: Option<T>) -> Self {
        let node = Rc::new(RefCell::new(Node::new(val)));
        Self {
            head: Some(Rc::new(RefCell::new(Node {
                val: None,
                next: Some(node),
            }))),
        }
    }

    pub fn push(&mut self, val: Option<T>) {
        let mut last = self.head.clone();
        while let Some(node) = last {
            let next = node.borrow().next.clone();
            if next.is_none() {
                node.borrow_mut().next = Some(Rc::new(RefCell::new(Node::new(val))));
                break;
            }
            last = next;
        }
    }

    pub fn last(&self) -> Option<Rc<RefCell<Node<T>>>> {
        let mut last = self.head.clone();
        while let Some(ref node) = last {
            let next = node.borrow().next.clone();
            if next.is_none() {
                break;
            }
            last = next.clone();
        }
        last
    }

    pub fn pop(&mut self) {
        let mut prev = self.head.clone().unwrap();
        let mut curr = prev.borrow_mut().next.clone();
        while let Some(node) = curr {
            let next = node.borrow().next.clone();
            if next.is_none() {
                prev.borrow_mut().next = None;
                break;
            }
            prev = node;
            curr = next;
        }
    }
}

impl<T: Clone> Into<Vec<Option<T>>> for LinkedList<T> {
    fn into(self) -> Vec<Option<T>> {
        let mut res = vec![];
        let mut last = self.head.unwrap().borrow().next.clone();
        while let Some(node) = last {
            let next = node.borrow().next.clone();
            res.push(node.borrow().val.clone());
            last = next;
        }

        res
    }
}

fn main() {}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    pub fn test_empty() {
        let linked_list: LinkedList<i32> = LinkedList::new(None);
        assert!(linked_list.head.is_none());
    }
    #[test]
    pub fn test_last() {
        let linked_list: LinkedList<i32> = LinkedList::new(Some(2));
        assert_eq!(linked_list.last().unwrap().borrow().val, Some(2));
    }
    #[test]
    pub fn test_push() {
        let mut linked_list: LinkedList<i32> = LinkedList::new(Some(2));
        linked_list.push(Some(3));

        assert_eq!(linked_list.last().unwrap().borrow().val, Some(3));
    }
    #[test]
    pub fn test_vec() {
        let mut linked_list: LinkedList<i32> = LinkedList::new(Some(2));
        linked_list.push(Some(3));
        linked_list.push(Some(4));
        let result: Vec<Option<i32>> = linked_list.into();

        assert_eq!(result, vec![Some(2), Some(3), Some(4)]);
    }
}

```
