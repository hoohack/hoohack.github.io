---
layout: post
title: "Raft探索历程--Part2"
date: 2020-07-04
author: hoohack
categories: Raft
excerpt: 'Raft,Consensus,Consensus algorithms,log replication,leader election,Split Brain,MIT 6.824'
keywords: 'Raft,Consensus,Consensus algorithms,log replication,leader election,Split Brain,MIT 6.824'
tags: blog

---

> 声明：本系列文章面向的读者需要看过Raft论文或者对Raft有一定的了解，如果没有看过论文或者不了解Raft，建议先去学习后再来看，否则会比较难懂。

紧接着[上一篇](https://www.hoohack.me/2020/06/21/exploring-raft-part-one)的内容，继续探索Raft的leader选举、日志复制、安全性等等实现细节。

## Raft基础
一个Raft集群通常包含多个机器，比较普遍的Raft集群组成是2F+1，F代表的是可以发生失败的机器数量。比如集群有5台机器，那么Raft只能容忍两台服务失败，如果三台服务不能工作了，那么整个集群也就失败了。大多数Raft集群的机器数量都是5个。

每台机器都有三个状态：leader、follower、candidate，如下图所示，就是三种状态之间的转换图。

<!--more-->

![Raft三种状态转换图](https://www.hoohack.me/assets/images/2020/07/raft-state-exchange.jpg)

>* leader接收所有的请求，如果client请求到了follower，那么follower会将请求转发到leader
>* follower只是接收来自leader和candidate的请求，不会主动发起请求。如果follower没有收到任何通信或信号，转变为candidate，然后重新进行一轮新的选举
>* candidate，是在选举新leader时出现的状态，如果candidate收到来自大多数机器的投票请求(RequestVote RPC，以下称为RequestVote请求)，就会转变为leader

Raft把时间按照term划分，每个term以一次选举开始，如果某一个candidate成为新的leader后，就进入正常运行阶段，如果没有选举出新的leader，那么就再次进行一次新的选举，这时候又是一个新的term。简单地说，在Raft中，是以term做时间单位。如下图所示：

![Raft时间单位](https://www.hoohack.me/assets/images/2020/07/raft-time-unit.jpg)

每一个服务器都会保存当前的term序号，当前的term序号会在服务器通信之间传递。如果服务器收到的请求包含了旧的term，服务器会拒绝该请求。

## leader选举
再来看看Raft是如何进行leader选举的，Raft使用心跳机制来触发leader选举。当服务器启动的时候，初始状态是follower，leader发送心跳的方式是发起一个不包含日志条目的AppendEntries RPC（以下称为Append请求）到所有的follower，follower收到来自leader的心跳请求包，说明leader还在"存活"着，如果长时间没有收到leader的心跳，那么follower就会认为当前没有leader，转为candidate，然后发起一次新的leader选举。

当leader选举开始时，follower会将当前的term自增，随后马上进入candidate状态，并发起一次RequestVote请求到所有机器，请求其他机器对它进行投票。Raft集群中的服务器在一个term里，除了投给自己之外，只能投票给一个candidate。

如果有以下三种情况发生，candidate的状态就会发生转变：
1、candidate获得大多数服务器的投票，成为leader，此时leader会马上发出心跳消息包，通知其他机器它成为了leader
2、candidate收到来自其他机器的心跳消息包，且该心跳包含的term大于当前candidate的term，说明已经有新的leader产生，candidate转为follwoer。（如果心跳包含的term小于当前candidate的term，candidate会直接忽略该心跳）。
3、所有的candidate在一段时间内都没能成功获得大多数投票，该次选举被认为超时，candidate会重新进行一次选举。但是如果没有其他的限制，多个follower同时成为candidate，candidate就会同时发出RequestVote请求，投票就会被分散到多个candidate上，因此没有candidate赢得选举，选举超时，再发起一次选举又是相同的结果，就会进入一个超时导致没有leader的死循环。

为了解决第三种情况，Raft用了随机超时时间来确保投票分散的情况不会发生。随机超时时间的意思就是，Raft的超时时间是在一个区间（如150-300ms）里面选择，而不是固定的一个时间单位。这样一来，大部分情况下就只有一个服务器会超时。另外，在超时之后，Raft使用随机时间来启动一次新的选举，这样就不会出现所有的candidate同时开始重新选举而导致进入选举超时的死循环。

这个随机超时时间机制简单且有效地解决这个死循环的问题。

## 日志复制
Raft是保证分布式系统数据一致性的协议，主要的工作就是接收客户端的数据，并同步数据，保证所有节点的数据一致。


### 日志复制流程
论文里面多次提到的log是RAFT系统中要同步的数据，称为日志条目，日志的格式如下图所示，每个日志包含要执行的指令、term和日志的下标，保存term的目的是为了及时发现日志之间的不一致性。

![Raft日志格式](https://www.hoohack.me/assets/images/2020/07/raft-log-structure.jpg)

leader选举出来后，leader就开始正常工作，接受来自客户端的请求，客户端的请求包含了需要执行的指令，leader收到客户端的指令后，把指令作为日志条目(log entry)保存起来，同时发送Append请求到所有的follower，通知它们同步该日志条目，同步完成后，请求返回成功。如果大多数服务器都完成了日志的同步，leader认为这个指令是可以commit的，commit时会检查所有的日志，会将上一个term产生的可提交的日志一并提交（下面会提到），然后leader就会将可提交的日志里面的指令执行到状态机，并把返回结果给客户端。

如果follower同步过程比较缓慢（比如超时、网络缓慢、响应丢失），leader会一直重试Append请求，直到所有的follower成功保存了所有的日志条目。

> 这里要注意的是，即使leader已经给客户端响应了，leader还是会重试，这个是合理的，因为只要leader给客户端响应了，说明该日志条目是可提交的，剩下的工作就是保证日志同步到所有的follower。对于follower而言，一个日志条目被复制了，还是需要被执行，只有在follower意识到该条目是可提交的，才会将它真正执行到follower的状态机。

上面描述的日志复制流程如下图所示：

![Raft日志复制流程](https://www.hoohack.me/assets/images/2020/07/raft-leader-log-replicate.jpg)

1、client发起指令

2、leader收到指令，发起Append请求到所有follower

3、follower同步日志到本地

4、follower操作完成，返回给leader

5、如果大多数的follower完成同步，leader返回响应给client

### 日志匹配特性
关于日志，Raft实现并维护了以下两个特性：

1、如果两个日志条目有相同的下标和term，那么它们保存的指令是一样的

2、如果两个日志条目有相同的下标和term，那么在它们之前的日志都是一样的

这两个特性共同构成了Raft的日志匹配特性。如果两个日志条目有相同的下标和term，那么这些日志都是相同的。在Raft中，leader在某个term的某个下标最多只会创建一个日志条目，且它的下标不会发生变化。每一次Append请求时都会做一致性检查（follower在收到Append请求时，如果发现前一个日志条目的下标和term与请求包含prevLogIndex与prevLogTerm的不一致，follower会拒绝该请求）。Raft通过以上操作来维护日志匹配特性，从而保证了日志条目的一致性。

### 日志的一致性
正常情况下，leader与follower的数据是保持一致的，但是如果leader突然挂了，可能会导致数据出现不一致。

在Raft里面，leader通过强制follower直接复制leader的日志条目来解决数据不一致的问题，如果follower与leader的日志条目不一样，那么follower只认leader的数据，本地的数据会被leader的数据覆盖。

leader为每个follower维护一个nextIndex（leader即将发给follower的下一个日志条目的下标），在Append请求执行时，如果发现follower的log与leader的不一致，follower会拒绝该请求，leader收到拒绝的响应，会将拒绝的follower的nextIndex减一，然后再发起一次Append请求，如果Append请求成功，leader和follower在该下标位置上的日志条目就一致了，且在接下来的任期里，这个日志会一直保持。

有了日志复制的功能，leader不需要其他任何操作就能恢复数据的一致性，leader不会删除或覆盖自己的日志条目，只需要正常的执行，在Append请求失败时会自动检查一致性，最终达到一致。

日志复制的机制也展示了Raft的特性：只要大多数机器都是正常运行的情况下，Raft会接收、复制和执行新的日志条目；正常情况下，经过一次RPC后新的日志条目都可以被复制到大多数机器；单个机器超时不会影响整体的性能。


## 安全性
前面介绍了leader的选举和日志的复制，但仅靠这两个机制还不能有效地保证每一台状态机使用相同的顺序执行相同的命令。比如在仅有这两种机制的前提下，遇到一些异常的情况，日志就会乱序或者被其他当选的leader覆盖，因此还需要一些其他的机制来保障数据的一致性。

### 选举限制
在Raft里的第一个限制：限制日志的流向只能从leader到follower，且leader不会覆盖已经存在的日志条目。

第二个限制，是选举leader时候的投票限制，candidate包含了所有已提交的日志条目才能被选上leader。

每一次选举leader，candidate都会向其他机器发起请求，获得每个机器最新的日志条目信息，如果candidate的日志比大多数机器的版本还新，那么它就能被选上leader。

日志版本是最新的定义为：如果两条日志最大下标的term不相同，那么term较大者胜出；如果两条日志最大下标相同，那么日志长度较大者胜出。可以用以下逻辑描述：

有机器s1，s2，定义机器包含的日志log，log里面最新的日志下标为lastIndex，log的长度为log.length，通过以下的逻辑可以判断日志是否最新：

```go
	log1 := s1.log
	log2 := s2.log

	if log1[lastIndex].term != log2.[lastIndex].term && log1.term > log2.term ||
		log1[lastIndex].term == log2.[lastIndex].term && log1.length > log2.length 
	then
		s1 win
	else
		s2 win
```

### 提交之前term的日志条目
前面提到，如果一个日志被复制到大多数机器，那么leader就认为该日志是可提交的，但是，如果leader提交该日志前崩溃了，就会出现意想不到的现象，举个例子：

![leader在提交前挂了](https://www.hoohack.me/assets/images/2020/07/raft-leader-crash-before-commit.jpg)

如图所示的场景：
a、S1被选中leader，在index=2处复制日志进行到一半（只在S2进行了）
b、S1挂了，通过S3、S4和自己的投票，S5被选中leader，term=3，在index=2的地方接收了一个与S1不同的日志
c、S5挂了，S1重新启动，被选中为leader，term=4，但是会继续它上一次的复制，term=2，index=2的日志复制到S3，此时这条日志已经被复制到大多数机器，被认为可以提交的，此时准备进行提交

以下两种是假设的情景：
如果
d、S1挂了，S5可以被选为leader，复制步骤b的数据，此时index=2的数据就被S5覆盖了

如果
e、如果S1在挂了之前复制了当前term收到的日志数据（index=3，term=4）到大多数机器，而根据投票的限制，S5不能被选为leader，因为log5[3].term < log3[3].term。复制到大多数机器后，这条数据可以被提交，提交时它之前的日志条目也会被一并提交

上面的d、e是假设的场景，为了避免上面描述的问题，Raft有另一个限制，*leader不会提交前一个term被认为可以提交的日志，只能提交当前term认为可以被提交的日志*。由于日志匹配特性，Raft会在提交当前term的日志时，把之前term可提交的日志间接地一并提交（如果两个日志条目有相同的下标和term，那么在它们之前的日志都是一样的，所以leader必须把上一个可提交的日志提交了，否则就会出现leader或follower之间的数据不一致）。

leader提交日志时的操作是：

```c
for entry in GetEntries(lastCommited, newCommited):
   entry.Commit();
```

通过选举条件限制和leader只能提交当前term的日志的限制，就不会出现上面途中描述的问题。

根据Raft算法的基础，可以论证leader完整性特性，可以进一步证明状态机，详细的论证过程就不翻译了，如果有兴趣的话可以翻阅论文。

## follower和candidate崩溃
follower或candidate崩溃处理方式是一样的，如果follower/candidate崩溃了，那么后续的Append请求或者RequestVote请求就会失败。Raft的实现是不断重试这些请求，直到机器重新启动。（Raft的RPC请求是幂等的，所以重复的RPC不会影响系统。）

## 时间和可用性
为了保证Raft系统的高可用，Raft要求安全性不会受执行时间的影响，即，系统不会由于机器的响应时间出现异常的结果。因为需要一个稳定的leader来保证Raft系统的正常运行。

Raft有三个时间属性
>* broadcastTime: 服务器发出rpc到收到响应的时间，通常是0.5～20ms，因为rpc需要将数据持久化到本地
>* electTimeout: 选举leader超时时间，10～500ms
>* MTBF：机器平均故障时间，通用以月为单位

通过以下的时间表达式，Raft可以保证leader的稳定性：

`broadcastTime<=electionTimeout<=MTBF`

1、因为Raft需要依赖心跳包来维持一个leader，所以broadcastTime<=electionTimeout

2、为了保持系统稳定，electionTimeout<=MTBF

## 解答Q&A
上一次留下的一个问题：

Q1：在leader选举过程中，candidate是怎么决定要投票给发起RequestVote Rpc的机器？是不是接收到请求就要投票？成为leader有没有什么要求？

这个问题在选举限制部分讲到，一次选举leader，candidate都会向其他机器发起请求，获得每个机器最新的日志条目信息，如果candidate的日志比大多数机器的版本还新，那么它就能被选上leader。

日志版本是最新的定义为：如果两条日志最大下标的term不相同，那么term较大者胜出；如果两条日志最大下标相同，那么日志长度较大者胜出。即：
```go
	log1 := s1.log
	log2 := s2.log

	if log1[lastIndex].term != log2.[lastIndex].term && log1.term > log2.term ||
		log1[lastIndex].term == log2.[lastIndex].term && log1.length > log2.length 
	then
		s1 win
	else
		s2 win
```

Q2：日志匹配特性与leader提交时要提交上一个term可提交的日志有什么关联？

回顾一下日志匹配特性：

1、如果两个日志条目有相同的下标和term，那么它们保存的指令是一样的

2、如果两个日志条目有相同的下标和term，那么在它们之前的日志都是一样的

如果leader不提交了上一个term的日志，会出现数据不一致，无法维持日志匹配特性第二部分。

举个例子，如图所示：

![Raft日志复制解释](https://www.hoohack.me/assets/images/2020/07/raft-log-match.jpg)

假设有5台机器，如果在term2时，S1是leader，大多数机器都复制了下标2的日志，此时S4、S5并没有数据，提交之前S1挂了，然后term3时S3被选为leader，大多数机器都复制了下标3的日志，此时leader（S3）提交了下标3的日志，但是不提交下标2的数据。那么S4只能收到index=3，term=3的数据，那么就会出现S1、S4的index=3，term=3之前的日志数据不一致了。

如果term3时把下标2到下标3之间的数据都提交了，leader在复制时发现日志不一致，就会强制使用leader的数据，就不会出现这个问题。就符合日志匹配特性了。

## 总结
到这里为止，本次探索Raft的历程告一段落，这一次的探索，收获颇深，日志复制和leader应该算是Raft中最难的部分，反复阅读论文和上网查阅资料，终于搞懂了遇到的难题。

Raft通过选举限制确保了成为leader的机器必须是拥有最新数据的，避免了数据被覆盖的情况；通过提交时提交之前term的日志满足日志匹配特性；通过数据的一致性检查保证了leader与follower之间的数据一致性。总的来说，Raft通过限制和规定，保证了系统的稳定运行和数据一致性，这也是协议的功能，使用该协议的系统必须遵从这些约定才能正常的运作。

下一次再继续探索集群关系变化、日志压缩处理等等话题。

参考链接：

[Question about Committing entries from previous terms](https://groups.google.com/forum/#!topic/raft-dev/d-3XQbyAg2Y)

[Raft算法详解](https://zhuanlan.zhihu.com/p/32052223)

[一文搞懂Raft算法](https://www.cnblogs.com/xybaby/p/10124083.html)

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，麻烦顺手点个赞吧，谢谢

更多精彩内容，请关注个人公众号。

![](https://www.hoohack.me/assets/images/qrcode.jpg)