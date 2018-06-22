---
layout: post
title: "［Redis源码阅读］实现一个redis命令--nonzerodecr"
date: '2018-06-21 9:00:00'
author: hoohack
categories: PHP
excerpt: 'redis,c,源码分析,源码学习,redis源码,redis 4.0源码,实现redis命令,秒杀'
keywords: 'redis,c,源码分析,源码学习,redis源码,redis 4.0源码,实现redis命令,秒杀'
---

[上篇文章](http://u6.gg/dCVQx)介绍了命令的执行流程，对redis如何执行命令也有了初步的了解，通过实现一个redis命令来再次加深印象。

笔者平时主要语言是PHP，有些功能PHP无法满足就会用到PHP的扩展，比如swoole。因此，就想到redis可不可以以做扩展？为了满足一些特殊的需求，可不可以为redis开发一个命令？

## 前期准备

因为redis是用C开发的，为了能开发redis命令，首先也是必须的是，你要懂一点C语言基础，另一个就是，需要了解一下redis命令是如何执行的，知道redis执行命令大概的流程，最简单的一个流程描述就是：

    读取命令->解析命令->调用命令函数->返回执行结果

或者再读一次[上篇文章](http://u6.gg/dCVQx)。

我们要做的就是，确保redis能解析到新增的命令，能根据输入的命令找到对应的方法并执行。

<!--more-->

## 函数需求

要实现一个命令，说明当前redis的命令无法满足开发的需求。考虑这样的一个需求，在秒杀的情景下，达到了这样的case：商品剩下最后一件，两个用户同时抢购，使用业务代码：

```c
if (redis->decr(key) >= 0) {
        return success
}
```

这样做有个问题就是活动结束后，key的值可能为-1，这样对于最终查询库存时会出现负值，不利于数据对账及统计。那么，能不能新增一个命令，让redis在计算时判断key的值，如果是0就不进行扣减呢？

将函数命名为nonzerodecr，开始实现。

## 添加函数名到命令表

把函数名称添加到命令表，参照decr命令的命令表：

```c
{"decr",decrCommand,2,"wmF",0,NULL,1,1,1,0,0}
```

增加nonzerodecrCommand：

```c
{"nonzerodecr",nonzerodecrCommand,2,"wmF",0,NULL,1,1,1,0,0},
```

声明nonzerodecr，因为新增的命令nonzerodecr只是内部增加一个非0的判断，其余操作没有变化，因此只需要跟decrCommand一样的声明即可：

```c
void nonzerodecrCommand(client *c);
```

## 实现函数

在实现新的函数之前，先看看decrComamnd命令的实现：

```c
void decrCommand(client *c) {
    incrDecrCommand(c, -1);
}
```

函数调用了incrDecrCommand实现自增和自减，实现如下：

```c
/*
* incr、decr具体的实现
*/

void incrDecrCommand(client *c, long long incr) {
  long long value, oldvalue;
  robj *o, *new;

  // 检查key和value的类型
  o = lookupKeyWrite(c->db,c->argv[1]);
  if (o != NULL && checkType(c,o,OBJ_STRING)) return;
  if (getLongLongFromObjectOrReply(c,o,&value,NULL) != C_OK) return;

  // 处理执行后溢出的情况
  oldvalue = value;
  if ((incr < 0 && oldvalue < 0 && incr < (LLONG_MIN-oldvalue)) ||
      (incr > 0 && oldvalue > 0 && incr > (LLONG_MAX-oldvalue))) {
      addReplyError(c,"increment or decrement would overflow");
      return;
  }

  value += incr;
  /*
  * 在long范围内，直接赋值，否则使用longlong创建字符串后再赋值
  */
  if (o && o->refcount == 1 && o->encoding == OBJ_ENCODING_INT &&
    (value < 0 || value >= OBJ_SHARED_INTEGERS) &&
    value >= LONG_MIN && value <= LONG_MAX) {
    new = o;
    o->ptr = (void*)((long)value);
  } else {
    new = createStringObjectFromLongLong(value);
    if (o) {
        dbOverwrite(c->db,c->argv[1],new);
    } else {
        dbAdd(c->db,c->argv[1],new);
    }
  }
  signalModifiedKey(c->db,c->argv[1]);
  notifyKeyspaceEvent(NOTIFY_STRING,"incrby",c->argv[1],c->db->id);
  server.dirty++;
  addReply(c,shared.colon);
  addReply(c,new);
  addReply(c,shared.crlf);
}

```

函数的流程图如下：

![incrDecrCommand](http://7u2eqw.com1.z0.glb.clouddn.com/incrDecrCommand.png)


如图所示，要实现函数nonzerodecrCommand，只需要在进行增/减操作前增加一个大于等于0 的判断即可，其余的逻辑不变，实现如下：
```c
void nonzerodecrCommand(client *c) {
    long long incr = -1;
    long long value, oldvalue;
    robj *o, *new;
    // 检查key和value的类型
    o = lookupKeyWrite(c->db,c->argv[1]);
    if (o != NULL && checkType(c,o,OBJ_STRING)) return;
    if (getLongLongFromObjectOrReply(c,o,&value,NULL) != C_OK) return;
    // 处理执行后溢出的情况
    oldvalue = value;
    if (incr < 0 && oldvalue < 0 && incr < (LLONG_MIN-oldvalue)) {
        addReplyError(c,"increment or decrement would overflow");
        return;
    }
    value += incr;
    // 判断，如果操作后结果小于0，直接返回
    if (value < 0) {
        addReply(c,shared.czero);
        return;
    }
    
    if (o && o->refcount == 1 && o->encoding == OBJ_ENCODING_INT &&
      (value < 0 || value >= OBJ_SHARED_INTEGERS) &&
      value >= LONG_MIN && value <= LONG_MAX) {
      new = o;
      o->ptr = (void*)((long)value);
    } else {
      new = createStringObjectFromLongLong(value);
      if (o) {
          dbOverwrite(c->db,c->argv[1],new);
      } else {
          dbAdd(c->db,c->argv[1],new);
      }
    }
    signalModifiedKey(c->db,c->argv[1]);
    notifyKeyspaceEvent(NOTIFY_STRING,"incrby",c->argv[1],c->db->id);
    server.dirty++;
    addReply(c,shared.colon);
    addReply(c,new);
    addReply(c,shared.crlf);
}
```

## 编译测试

编写完代码后，对代码进行编译测试：

```shell
127.0.0.1:6379> set totalCount 1
OK
127.0.0.1:6379> get totalCount
"1"
127.0.0.1:6379> nonzerodecr totalCount
(integer) 0
127.0.0.1:6379> get totalCount
"0"
127.0.0.1:6379> nonzerodecr totalCount
(integer) 0
127.0.0.1:6379> get totalCount
"0"
```

结果符合最初的需求，在值等于0之后，再进行扣减，值不会变为负数。



## 总结与思考

通过介绍实现nonzerodecr命令的过程，对如何实现一个命令有了一个初步的认识，之后如果有新的需求也可以根据这个步骤去实现一个新的命令。

上面介绍的命令实现方式比较粗暴，可能会有隐藏的bug，但对于入门实现一个命令这个目的来说，这个代码时可以的，另外，一开始提到的秒杀场景除了可以使用新命令来解决，也可以使用redis-lua脚本的形式来实现，实现方法是多样的，具体的技术选型需要根据业务的场景来选择，如果你有更好的方案，欢迎评论留下你的方案。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点个赞吧，谢谢^_^

更多精彩内容，请关注个人公众号。

![](https://user-gold-cdn.xitu.io/2018/6/11/163ec67c55f88857?w=258&h=258&f=jpeg&s=28215)