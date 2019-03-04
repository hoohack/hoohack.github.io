---
layout: post
title: "MySQL主从复制原理探索"
date: '2017-07-11 11:00:00'
author: hoohack
categories: mysql
excerpt: 'mysql,mysql主从延迟,mysql主从复制,mysql主从复制原理'
keywords: 'mysql,mysql主从延迟,mysql主从复制,mysql主从复制原理'
---

[上一篇文章](https://www.hoohack.me/2017/06/24/mark-mysql-replication-bad-case)里面，讲到了遇到mysql主从延迟的坑，对于这次的坑多说两句，以前也看过这样的例子，也知道不能够写完之后马上更新，但是真正开发的时候还是没有注意到这一点，道理大家都懂，但是还是会犯错，只有等到自己亲生体验到该错误之后，才真正的掌握到该道理。

经历过一次mysql主从延迟之后，就开始思考，主从复制是什么东西？它是怎么实现的呢？它的原理是什么？于是乎就开始查阅资料、文章，现将自己理解到的内容总结在此，加深印象。

## 为什么要做主从复制？
1、在业务复杂的系统中，有这么一个情景，有一句sql语句需要锁表，导致暂时不能使用读的服务，那么就很影响运行中的业务，使用主从复制，让主库负责写，从库负责读，这样，即使主库出现了锁表的情景，通过读从库也可以保证业务的正常运作。

<!--more-->

2、做数据的热备

3、架构的扩展。业务量越来越大，I/O访问频率过高，单机无法满足，此时做多库的存储，降低磁盘I/O访问的频率，提高单个机器的I/O性能。

## mysql主从复制的原理是什么？
binlog: binary log，主库中保存所有更新事件日志的二进制文件。

主从复制的基础是主库记录数据库的所有变更记录到binlog。binlog是数据库服务器启动的那一刻起，保存所有修改数据库结构或内容的一个文件。

mysql主从复制是一个异步的复制过程，主库发送更新事件到从库，从库读取更新记录，并执行更新记录，使得从库的内容与主库保持一致。

在主库里，只要有更新事件出现，就会被依次地写入到binlog里面，之后会推到从库中作为从库进行复制的数据源。

**binlog输出线程。**每当有从库连接到主库的时候，主库都会创建一个线程然后发送binlog内容到从库。
对于每一个即将发送给从库的sql事件，binlog输出线程会将其锁住。一旦该事件被线程读取完之后，该锁会被释放，即使在该事件完全发送到从库的时候，该锁也会被释放。

在从库里，当复制开始的时候，从库就会创建两个线程进行处理：

**从库I/O线程。**当START SLAVE语句在从库开始执行之后，从库创建一个I/O线程，该线程连接到主库并请求主库发送binlog里面的更新记录到从库上。
从库I/O线程读取主库的binlog输出线程发送的更新并拷贝这些更新到本地文件，其中包括relay log文件。

**从库的SQL线程。**从库创建一个SQL线程，这个线程读取从库I/O线程写到relay log的更新事件并执行。

可以知道，对于每一个主从复制的连接，都有三个线程。拥有多个从库的主库为每一个连接到主库的从库创建一个binlog输出线程，每一个从库都有它自己的I/O线程和SQL线程。

从库通过创建两个独立的线程，使得在进行复制时，从库的读和写进行了分离。因此，即使负责执行的线程运行较慢，负责读取更新语句的线程并不会因此变得缓慢。比如说，如果从库有一段时间没运行了，当它在此启动的时候，尽管它的SQL线程执行比较慢，它的I/O线程可以快速地从主库里读取所有的binlog内容。这样一来，即使从库在SQL线程执行完所有读取到的语句前停止运行了，I/O线程也至少完全读取了所有的内容，并将其安全地备份在从库本地的relay log，随时准备在从库下一次启动的时候执行语句。

## 查看主从复制的状态
当主从复制正在进行中时，如果想查看从库两个线程运行状态，可以通过执行在从库里执行”show slave status\G”语句，以下的字段可以给你想要的信息：
    
    Master_Log_File — 上一个从主库拷贝过来的binlog文件
    Read_Master_Log_Pos — 主库的binlog文件被拷贝到从库的relay log中的位置
    Relay_Master_Log_File — SQL线程当前处理中的relay log文件
    Exec_Master_Log_Pos — 当前binlog文件正在被执行的语句的位置

整个主从复制的流程可以通过以下图示理解：

![DB Replication](https://www.hoohack.me/assets/images/2017/07/DB-replication.png)

> * 步骤一：主库db的更新事件(update、insert、delete)被写到binlog
> * 步骤二：从库发起连接，连接到主库
> * 步骤三：此时主库创建一个binlog dump thread，把binlog的内容发送到从库
> * 步骤四：从库启动之后，创建一个I/O线程，读取主库传过来的binlog内容并写入到relay log
> * 步骤五：还会创建一个SQL线程，从relay log里面读取内容，从**Exec_Master_Log_Pos**位置开始执行读取到的更新事件，将更新内容写入到slave的db

    注：上面的解释是解释每一步做了什么，整个mysql主从复制是异步的，不是按照上面的步骤执行的。

## 其他
关于主从复制架构的搭建，可以参考网上更多的文档，文笔有限，不做更多的介绍。

作为一名开发，这些基础的mysql知识还是需要多多学习。

## 参考资料

[What is MySQL Replication and How Does It Work?](http://dbadiaries.com/what-is-mysql-replication-and-how-does-it-work)

[Replication Implementation Details](https://dev.mysql.com/doc/refman/5.6/en/replication-implementation-details.html)

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点个赞吧，谢谢^_^

更多精彩内容，请关注个人公众号。

![](https://www.hoohack.me/assets/images/qrcode.jpg)