---
layout: post
title: "Raft探索历程--Part1"
date: '2020-06-21'
tags: tech
author: hoohack
categories: Raft
excerpt: 'Raft,Consensus,Consensus algorithms,脑裂,Split Brain,MIT 6.824'
keywords: 'Raft,Consensus,Consensus algorithms,脑裂,Split Brain,MIT 6.824'
---

## 前言
Raft是一个保证分布式系统数据一致性的共识算法，诞生的目的就是为了探索一种更容易理解的共识算法，原因是上一个描述这个算法的协议--Paxos较难理解和在生产环境上使用。（注：笔者没有掌握Paxos算法，所以这里不会去作比较，后续如果学习到的话会做一个比较）

笔者主要是通过阅读[Raft论文](https://raft.github.io/raft.pdf)和观看[MIT 6.824的教程视频](https://www.bilibili.com/video/BV1R7411t71W?p=7)学习的。

论文原文是英文版的，里面的一些专用名词笔者打算尽量保留英文的描述，因为这些关键名词对于理解概念十分重要，但是翻译过来会比较拗口，也找不到合适的中文名词代替，所以打算保留英文的描述，当然，名词的含义还是有必要先解释一下。



## 英文名词备注
Consensus algorithms：共识算法，用来保证分布式系统一致性的方法。[Consensus algorithm](https://en.wikipedia.org/wiki/Consensus_algorithm)
leader：节点集群中的领导者，决策者，负责复制和提交客户端的日志。
term：任期，领导者的当任时间。
candidate：准备参与leader选举的候选机器
follower：追随者，选举结束后，没有成为leader的candidate就是跟随者，接收leader的指令
majority：大多数投票机制，指集群中大多数机器同意某个节点成为leader，这里的大多数机器不只是指正在运行的服务器，即使机器投票后挂了也是majority中的一部分

## Raft简介

在MIT 6.824视频中，在Raft之前讨论了Map Reduce、GFS、VMWare FT，这些现存容错系统的处理方式

- MapReduce系统，只是复制计算，但是依赖单master
- GFS，复制副本数据，依赖master另外选主
- VMware FT复制服务依赖test-and-set选择master

单点master可以避免“脑裂”，但是master始终是单点，无法实现分布式存储。

[脑裂](https://en.wikipedia.org/wiki/Split-brain_(computing))，是指一个集群中出现了网络异常的情况导致有两个节点各自都认为它们都是主节点，于是一个集群被拆分为两个集群，解决脑裂问题的方式就是添加majority机制，而Paxos和Raft就是这类解决方案中的其中两种。

由于Paxos的晦涩难懂导致难以理解以及实现起来的难度，经过不断的挣扎，学者们就发明了Raft。Raft的目标是为了设计一种更易于理解的共识算法。

为了让共识算法更容易理解，Raft将共识算法中的核心内容拆分开来实现：leader选举，日志复制，安全性，以及通过实施一个更强级别的一致性来减少需要考虑的状态数量。

Raft跟现存的共识算法很相似，但是它有新增一些独特的特性：
- Strong Leader，比如日志只能由首领发送到其他的服务器
- Leader Election，Raft使用随机定时器进行选举，解决冲突时更简单快捷
- Membership changes，使用共同共识的方法来处理集群内成员变换的问题，这种方法处理时，处于调整过程中的两种不同配置的集群中的大多数机器会重叠。这样一来，集群在成员变换阶段依然能继续运行。

## 复制状态机
Replicated state machine，状态复制机，共识算法是在复制状态机的背景下诞生的，复制状态机用于来解决分布式系统的各种容错问题。

![RSM](https://www.hoohack.me/assets/images/2020/06/raft-RSM.jpg)

如图，复制状态机实现方式是使用复制日志，每份日志都使用相同顺序来保存相同的指令，服务器执行时是按照日志的顺序来执行，最终得到的结果都是一致的。

共识算法在复制状态机的工作就是保证所有的复制日志都是一致的。共识实现模块（如Raft）接收来自客户端的请求后，添加到机器的日志里，使用共识模块进行通信，保证所有日志最终都包含相同顺序的请求。看到这里想起了[MySQL的主从复制原理](https://www.hoohack.me/2017/07/11/learning-mysql-replication-detail)，有点类似复制状态机的实现方式。

共识算法在实际应用中的特性：
- 安全性保证，绝不返回一个错误的结果，在错误情况下都能保证正确
- 可用性，集群中只要有大多数的机器可运行且能够相互通信，就可以保证可用。
- 不依赖时序保证一致性
- 通常情况下，一条指令能在集群中大多数节点响应一次远程过程调用时完成。少部分较慢的节点不会影响系统整体的性能。

## Paxos
Paxos定义了一个能够达成单一决策共识的协议，比如单条的复制日志项。主要的两个缺点：
- 原理很难理解，完整的解释不够透明。
- 没有提供一个较好的基础来构建一个现实中的系统。

注：笔者没有深入学习过Paxo，不能更多的评论，只能从论文和视频的角度做个小总结。

## 初衷--更容易理解的设计
Raft有很多个设计的目标：
- 提供一个完整构建系统的基础
- 高效性
- 安全性

而Raft最重要的目标，也是最大的挑战，就是让有一个更容易理解的设计。核心目标就是可理解性，必须是容易理解的，即使是普通开发者也能理解。

Raft的学者们意识到要达到Raft的目标非常难，所以使用了**问题分解**和*通过减少状态数量*来达到这一目的。

问题分解也是平常开发中用到的一个很重要的技能，如需求拆解、实现细节拆解，把大问题拆解为小问题，然后逐个击破，最后完成目标。

在大多数情况下Raft都试图去消除不确定性，但也有一些情况下增加一些不确定性可以提升系统的可理解性。比如，随机化方法增加了不确定性，但通过使用相似的方法处理所有可能的选择，有利于减少状态空间数量。系统中使用随机化去简化Raft中领导选举算法。

接下来要探索Raft的设计和实现原理，包含了数据结构和函数的定义，leader选举、日志复制、安全性等拆解功能的详细设计。

## Raft共识算法
Raft是一种用来管理复制日志的共识算法。

通过选举一个唯一的leader，Raft给予leader完整的责任去管理复制日志来实现共识。leader会接受来自客户端的日志条目，复制这些条目到其他服务器，leader自己就可以决定将日志条目放到哪台服务器，数据流的方向只能从leader到其他服务器。

一个集群里有且只能有一台leader，leader拥有最大的权利。如果某一台leader当机了，会马上选出下一台leader。

如前面提到过的，Raft将整个共识算法拆分为三个独立的子问题：
- leader选举：当leader挂了，会选举出新的leader
- 日志复制：日志条目只能从leader通知到集群的其他服务器，服务器只会认leader的数据
- 安全性：Raft的核心安全性是状态机的安全，Raft通过在选举机制增加一些限制来保证提供的状态数据都是安全的

如图所示是Raft的数据结构和函数的定义：

![raft-condense](https://www.hoohack.me/assets/images/2020/06/raft-image-2.jpg)

图里是Raft算法的实现概览，定义了一个集群中维护的状态以及两个方法。方法分别是复制日志条目和请求投票，复制日志条目是在客户端发送给服务端后，由leader复制到其他的follower时调用，可被用做leader的心跳包请求。请求投票时每一个leader的选举时，candidate向其他机器返发起的请求，如果机器被选中为leader，会马上发一个心跳包出去，其他candidate会成为follower，也意味着该次term的选举结束了。

下图列举了Raft算法中的关键特性：

![raft-properties](https://www.hoohack.me/assets/images/2020/06/raft-image-3.jpg)

Raft通过以上这些特性来保证集群里leader选举和日志复制的正常运行，同时也保证了运行的安全性。

接下来继续探索Raft的实现：包括leader选举、日志复制、安全性等等，全部写完的话，涉及的篇幅较长，篇幅太长的文章会影响阅读体验，也较难消化，所以笔者打算另外开一篇文章继续。

到这里为止，第一次的探索历程就暂告一个段落了，笔者想留下一个在探索过程中困惑住的问题。

Q1:在leader选举过程中，candidate是怎么决定要投票给发起RequestVote Rpc的机器？是不是接收到请求就要投票？成为leader有没有什么要求？

这个问题，会在下一次探索历程中给出答案。如果你有任何问题，欢迎留言。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。




