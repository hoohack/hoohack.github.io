---
layout: post
title: "[深入学习Redis]RedisAPI的原子性分析"
date: 2017-04-04
tags: tech
author: hoohack
categories: Redis
excerpt: 'Redis,atomic,redis atomic,why redis can atomic,redis原子性,redis api原子性'
keywords: 'Redis,atomic,redis atomic,why redis can atomic,redis原子性,redis api原子性'
---

在学习Redis的常用操作时，经常看到介绍说，Redis的set、get以及hset等等命令的执行都是原子性的，但是令自己百思不得其解的是，为什么这些操作是原子性的？

## 原子性
原子性是数据库的事务中的特性。在数据库事务的情景下，原子性指的是：一个事务（transaction）中的所有操作，要么全部完成，要么全部不完成，不会结束在中间某个环节。[【维基百科】](https://zh.wikipedia.org/wiki/ACID)

对于Redis而言，命令的原子性指的是：一个操作的不可以再分，操作要么执行，要么不执行。

## Redis操作原子性的原因



Redis的操作之所以是原子性的，是因为Redis是单线程的。

由于对操作系统相关的知识不是很熟悉，从上面这句话并不能真正理解Redis操作是原子性的原因，进一步查阅进程与线程的概念及其区别。

## 进程与线程

### 进程
计算机中已执行程序的实体。[【维基百科】](https://zh.wikipedia.org/wiki/%E8%A1%8C%E7%A8%8B)。比如，一个启动了的php-fpm，就是一个进程。

### 线程
操作系统能够进行运算调度的最小单元。它被包含在进程之中，是进程的实际运作单位。一条线程指的是进程中一个单一顺序的控制流，一个进程中可以并发多个线程，每条线程并行执行不同的任务。[【维基百科】](https://zh.wikipedia.org/wiki/%E7%BA%BF%E7%A8%8B)。比如，mysql运行时，mysql启动后，该mysql服务就是一个进程，而mysql的连接、查询的操作，就是线程。

### 进程与线程的区别
> * 资源（如打开文件）：进程间的资源相互独立，同一进程的各线程间共享资源。某进程的线程在其他进程不可见。
> * 通信：进程间通信：消息传递、同步、共享内存、远程过程调用、管道。线程间通信：直接读写进程数据段（需要进程同步和互斥手段的辅助，以保证数据的一致性）。
> * 调度和切换：线程上下文切换比进程上下文切换要快得多。

线程，是操作系统最小的执行单元，在单线程程序中，任务一个一个地做，必须做完一个任务后，才会去做另一个任务。

## Redis在并发中的表现
Redis的API是原子性的操作，那么多个命令在并发中也是原子性的吗？

看看下面这段代码：

        $redis = new Redis();
        $redis->connect('127.0.0.1', 6379);
        for($i = 0; $i < 1000; $i++) {
                $num = (int) $redis->get('val');
                $num++;
                $redis->set('val', $num);
                usleep(10000);
        }

用两个终端执行上面的程序，发现val的结果是小于2000的值，那么可以知道，在程序中执行多个Redis命令并非是原子性的，这也和普通数据库的表现是一样的。

如果想在上面的程序中实现原子性，可以将get和set改成单命令操作，比如incr，或者使用Redis的事务，或者使用Redis+Lua的方式实现。

## 总结
综上所述，对Redis来说，执行get、set以及eval等API，都是一个一个的任务，这些任务都会由Redis的线程去负责执行，任务要么执行成功，要么执行失败，这就是Redis的命令是原子性的原因。

Redis本身提供的所有API都是原子操作，Redis中的事务其实是要保证批量操作的原子性。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^



