---
layout: post
title: "［Redis源码阅读］当你输入get/set命令的时候，redis做了什么"
date: '2018-06-11 8:00:00'
author: hoohack
categories: PHP
excerpt: 'redis,c,源码分析,源码学习,redis源码,redis 4.0源码,get-set调用链路'
keywords: 'redis,c,源码分析,源码学习,redis源码,redis 4.0源码,get-set调用链路'
---

[上一篇文章](http://www.hoohack.me/2018/05/26/read-redis-src-how-server-start)介绍了redis-server的启动过程，服务端启动之后，就启动事件循环机制监听新事件的到来，此时不同的客户端就可以通过发送指令的方式请求server并得到处理结果的回复。在开发过程中，用到最多的就是get和set命令，那么，当我们输入get/set命令时，redis做了什么呢？

## redis-cli启动

了解命令是如何使用之前，先了解下redis-client启动时做了什么。redis客户端有多种实现，不同的语言也有自己的实现，在这里可以看到各种版本：[redis版本](https://redis.io/clients)，平常调试过程中比较常用的是redis-client，即命令行的形式，redis-client的主要实现代码在`redis-cli.h`和`redis-cli.c`。redis-client的启动入口是在main函数，阅读代码可以看到是先给config设置属性，然后判断客户端使用哪种模式启动，启动模式有：Latency、Latency分布式、从库、获取RDB、查找大key、管道、Stat、Scan、LRU、Intrinsic Latency、交互模式。我们用的命令行就是交互模式。

<!--more-->

在redis整个连接过程中，使用了redisContext结构体来保存连接的上下文，看看结构体的定义：

```c
/* 代表一个Redis连接的上下文结构体 */
typedef struct redisContext {
    int err;
    char errstr[128]; 
    int fd;
    int flags;
    char *obuf;
    redisReader *reader; 
    enum redisConnectionType connection_type;
    struct timeval *timeout;
    struct {
        char *host;
        char *source_addr;
        int port;
    } tcp;

    struct {
        char *path;
    } unix_sock;
} redisContext;
```
> err：操作过程中的错误标志，0表示无错误

> errstr：错误信息字符串

> fd：redis-client连接服务器后的socket文件

> obuf：保存输入的命令

> tcp：保存一个tcp连接的信息，包括IP，协议族，端口

介绍完使用的数据结构后，继续连接过程，在交互模式下，redis调用`cliConnect`函数进行连接。

cliConnect函数的执行流程：

> * 1、调用redisConnect函数连接到redis服务器实例，使用redisContext保存连接上下文。

> * 2、通过设置KeepAlive属性避免连接断开，KeepAlive的默认时间是15s。

> * 3、连接成功后，进行验证并选择正确的DB。

连接建立成功后，redis-cli启动就完成了，此时进入了交互阶段，redisContext封装了客户端连接服务器的状态，之后有关客户端的操作都会操作这个结构体。

## 跟踪get/set命令的全过程

客户端启动成功，就可以输入指令调用redis的命令了。
本文测试使用的key是`username:1234`，先输入`get username:1234`。

继续阅读代码，发现客户端进入交互模式之后，就调用repl读取终端命令、发送命令到客户端并返回结果，repl函数是交互模式的核心函数。repl函数调用linenoise函数读取用户输入的命令，读取方式是通过空格分隔多个参数，读取到命令请求之后，就会调用`issueCommandRepeat`函数启动命令执行，`issueCommandRepeat`函数调用`cliSendCommand`发送命令给服务器。

`cliSendCommand`函数调用`redisAppendCommandArgv`函数使用redis的协议编码输入的命令，然后调用`cliReadReply`函数发送数据到服务端并读取服务端的返回数据。读到这里的时候，挺想看看使用redis协议编码后的数据是怎样的，于是想到使用gdb断点调试，查看每一个步骤的数据以及交互。

## gdb调试redis准备工作

在使用gdb调试的时候，输出其中一些变量会得到如下结果：

​   `<value optimized out>`

这是因为在编译的时候默认使用了-O2优化选项，在这个选项下，编译器会把它认为冗余的部分变量进行优化，因此看不到具体的值，要想去掉这个优化，在gcc编译的时候指定-O0就可以了，对于redis的编译来说，修改makefile文件，把-O2改为-O0或者执行`make noopt`即可。

## redis通信协议介绍

众所周知，HTTP有自己的协议，协议是通信计算机双方必须共同遵从的一组约定。 如怎么样建立连接、怎么样互相识别等。 只有遵守这个约定，计算机之间才能相互通信交流。 对于redis而言，为了保证服务器与客户端的正常通信，也定义了自己的通信协议，客户端和服务器在接收解析数据时都需要遵循这个协议才能保证通信正常进行。

redis请求协议的一般形式：

```c
*<参数数量> CR LF
$<参数 1 的字节数量> CR LF
<参数 1 的数据> CR LF
...
$<参数 N 的字节数量> CR LF
<参数 N 的数据> CR LF
```

回复的协议：

```c
状态回复（status reply）的第一个字节是 "+"
错误回复（error reply）的第一个字节是 "-"
整数回复（integer reply）的第一个字节是 ":"
批量回复（bulk reply）的第一个字节是 "$"
多条批量回复（multi bulk reply）的第一个字节是 "*"
```



## 解析命令

根据上面的描述可知，`issueCommandRepeat`函数是执行命令的核心实现，为函数进行一个断点。

```shell
(gdb) b issueCommandRepeat
Breakpoint 1 at 0x40f891: file redis-cli.c, line 1281.
(gdb) run
Starting program: /usr/local/src/redis-stable/src/redis-cli
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".
127.0.0.1:6379> get username:1234
Breakpoint 1, issueCommandRepeat (argc=2, argv=0x68a950, repeat=1) at redis-cli.c:1281
1281            config.cluster_reissue_command = 0;
```

把`issuseCommandRepeat`的参数打印出来：

```shell
(gdb) p *argv
$1 = 0x685583 "get"
(gdb) p *(argv+1)
$2 = 0x68a973 "username:1234"
```

可以知道，用户输入的命令通过`lineinoise`解析后通过数组传递给`issuseCommandRepeat`函数了。

继续执行，就进入了`cliSendCommand`函数，这个函数主要做的事情是使用redis协议编码发送过来的命令（调用`redisAppendCommandArgv`函数），然后发送给服务器，并等待服务器的回复（调用`cliReadReply`函数）。

命令的解析过程是，使用redis的协议编码，然后将结果保存到redisContext->obuf，结合前面介绍的redis通信协议看代码，非常直观，编码过程：

```c
/*
 * 使用Redis协议格式化命令，通过sds字符串保存，使用sdscatfmt函数追加
 * 函数接收几个参数，参数数组以及参数长度数组
 * 如果参数长度数组为NULL，参数长度会用strlen函数计算
 */
int redisFormatSdsCommandArgv(sds *target, int argc, const char **argv,
    const size_t *argvlen)
{
    sds cmd;
    unsigned long long totlen;
    int j;
    size_t len;
    /* Abort on a NULL target */
    if (target == NULL)
        return -1;
    /* 计算总大小 */
    totlen = 1+countDigits(argc)+2;
    for (j = 0; j < argc; j++) {
        len = argvlen ? argvlen[j] : strlen(argv[j]);
        totlen += bulklen(len);
    }
    /* 初始化一个sds字符串 */
    cmd = sdsempty();
    if (cmd == NULL)
        return -1;
    /* 使用前面计算得到的totlen分配空间 */
    cmd = sdsMakeRoomFor(cmd, totlen);
    if (cmd == NULL)
        return -1;
    /* 构造命令字符串 */
    cmd = sdscatfmt(cmd, "*%i\r\n", argc); // *%i 表示包含命令在内，共有多少个参数
    for (j=0; j < argc; j++) {
        len = argvlen ? argvlen[j] : strlen(argv[j]);
        cmd = sdscatfmt(cmd, "%u\r\n", len); // %u 表示该参数的长度
        cmd = sdscatlen(cmd, argv[j], len); // 参数的值
        cmd = sdscatlen(cmd, "\r\n", sizeof("\r\n")-1); // 最后加上\r\n
    }
    assert(sdslen(cmd)==totlen);
    *target = cmd;
    return totlen;
}
```

结合编码过程，对于输入的命令，得到的编码结果应该是：

​   `*2\r\n$3\r\nget\r\n$13\r\nusername:1234\r\n`

在gdb打印验证一下，在执行redisAppendCommandArgv函数前后打印context->obuf结果如下，验证成功：

```shell
(gdb)
984             redisAppendCommandArgv(context,argc,(const char**)argv,argvlen);
(gdb) p context->obuf
$3 = 0x6855a3 ""
(gdb) n
985             while (config.monitor_mode) {
(gdb) p context->obuf
4 = 0x68a9e3 "*2\r\n3\r\nget\r\n$13\r\nusername:1234\r\n"
```

把\r\n去掉，通过一种更直观展示：

>  *2 // 命令参数的总数量，包含命令在内
>
>   $3 // 第一个参数的长度
>
>   get // 第一个参数的值
>
>   $13 // 第二个参数的长度
>
>   username:1234 // 第二个参数的值

## 发送命令

客户端解析完命令，并对其进行编码后，就进入下一阶段，将命令发给服务器，对cliReadReply函数进行断点：

```shell
Breakpoint 3, cliReadReply (output_raw_strings=0) at redis-cli.c:840
840     static int cliReadReply(int output_raw_strings) {
(gdb) n
843         sds out = NULL;
(gdb)
844         int output = 1;
(gdb)
846         if (redisGetReply(context,&_reply) != REDIS_OK) {
```

调用了`redisGetReply`函数，函数接收连接上下文redisContext参数，并把结果写到_reply。在redisGetReply函数里，函数做的事情是把命令发送给服务器，然后等待服务器返回，里面一个I/O操作，底层调用了系统调用write和read。

调用write函数发送命令之后，请求到了服务器，上一篇文章有讲到了redis服务器是怎么启动的，启动之后就进入了事件循环状态，接下来就看看服务器是怎么处理请求的。

## 处理请求

服务器启动会注册文件事件，注册的回调`acceptTcpHandler`，当服务器可读时（即客户端可以write/close），`acceptTcpHandler`被调用，追踪函数，调用链路如下：

>  acceptTcpHandler -> anetTcpAccept -> acceptCommonHandler

`acceptTcpHandler`函数会调用anetTcpAccept函数发起accept，接收客户端请求，请求到来后，会调用`acceptCommonHandler`函数处理。`acceptCommonHandler`调用链：
>  acceptCommonHandler-> createClient -> readQueryFromClient

`acceptCommonHandler`函数调用`createClient`创建一个客户端，注册回调函数，如果有请求到来，会调用`readQueryFromClient`函数读取客户端的请求。客户端创建成功后，redis会将它添加到当前服务器的客户端链表中，之后如果需要对所有客户端进行交互，都会使用这个链表。

梳理整个调用链路后，对readQueryFromClient函数加一个断点，看看接收到的数据：

```shell
(gdb) b readQueryFromClient
Breakpoint 1 at 0x440b6b: file networking.c, line 1377.
1377        client c = (client) privdata;
(gdb) n
1383        readlen = PROTO_IOBUF_LEN;
(gdb) n
1390        if (c->reqtype == PROTO_REQ_MULTIBULK && c->multibulklen && c->bulklen != -1
(gdb) n
1398        qblen = sdslen(c->querybuf);
(gdb) n
1399        if (c->querybuf_peak < qblen) c->querybuf_peak = qblen;
(gdb) n
1400        c->querybuf = sdsMakeRoomFor(c->querybuf, readlen);
(gdb) n
1401        nread = read(fd, c->querybuf+qblen, readlen);
```

从执行步骤发现，redis-server为请求的命令创建一个字符串结构体保存，然后发起系统调用read从当前socket读取数据，执行完这步后，打印读取到的字符串，以及字符串结构体在内存中的保存情况：

```shell
(gdb) p nread
$7 = 33
(gdb) p c->querybuf
8 = (sds) 0x7ffff6b3a345 "*2\r\n3\r\nget\r\n$13\r\nusername:1234\r\n"
(gdb) x/33 c->querybuf
0x7ffff6b3a345: 42 '*'  50 '2'  13 '\r' 10 '\n' 36 '$'  51 '3'  13 '\r' 10 '\n'
0x7ffff6b3a34d: 103 'g' 101 'e' 116 't' 13 '\r' 10 '\n' 36 '$'  49 '1'  51 '3'
0x7ffff6b3a355: 13 '\r' 10 '\n' 117 'u' 115 's' 101 'e' 114 'r' 110 'n' 97 'a'
0x7ffff6b3a35d: 109 'm' 101 'e' 58 ':'  49 '1'  50 '2'  51 '3'  52 '4'  13 '\r'
0x7ffff6b3a365: 10 '\n'
```

如果根据redis协议计算解析到的字符串长度，得到长度是33，打印`c->querybuf`在内存中的保存情况，可以看到整个命令的字节字符串都在这，每一个字节都是紧挨着地保存。

因为redis是事件驱动的，在每一次有数据到来，`readQueryFromClient`函数都会被调用，读取命令。本次调试用的get命令比较短，redis-server只需要一次事件循环过程就解析完整个命令了，server每次最多读取1024*16个字节的字符放到缓冲区，如果命令长度超过缓冲最大长度，会分别在多次事件中读取完然后再执行。

读取完命令后，下一步就是解析和执行了。命令是根据之前介绍的redis协议编码的，server也是根据同样的协议解码，然后保存到redisClient，解析过程是一个反编码过程，具体是在processMultibulkBuffer函数中，有兴趣了解细节的可以查看这个函数。

解析完命令后，通过调用`processCommand`函数执行命令。上一篇文章说到，服务器启动时会加载命令表到server中，`processCommand`函数先在命令表查找命令是否存在，查找方式是通过以命令名称作为key去redis的命令字典查找，对于get命令，定义的格式如下：

    {"get",getCommand,2,"rF",0,NULL,1,1,1,0,0}

读取到之后，command->proc就会被设置为getCommand函数，接着server进行一系列检查：参数是否正确、是否授权、集群模式处理、是否超出最大内存、如果硬盘有问题不处理等等，然后调用call函数执行命令。call函数是redis执行命令的核心函数，call函数的核心代码：

```c
void call(client *c, int flags) {
    -- 执行前检查 --
    /* 调用命令执行函数 */
    dirty = server.dirty;
    start = ustime();
    c->cmd->proc(c);
    duration = ustime()-start;
    dirty = server.dirty-dirty;
    if (dirty < 0) dirty = 0;

    -- 执行后处理 --
}
```
看看上面的代码，是redis动态分发命令调用函数的实现，在命令表中配置好每个命令对应的执行函数，参数数量等信息，在server启动时把命令加载到命令表`server.commands`，这时会将命令表中的命令函数保存到`redisCommand.proc`，因此，在call函数，只需要执行`c->cmd->proc(c)`就可以执行执行命令对应的函数了。

## getCommand实现

对于本次get命令而言，直接看getCommand函数，调用了getGenericCommand

```
/*
* get命令的"通用"实现
*/
int getGenericCommand(client *c) {
    robj *o;
    // 调用lookupKeyReadOrReply函数查找指定key，找不到，返回
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk)) == NULL)
        return C_OK;
    // 如果找到的对象类型不是string返回类型错误
    if (o->type != OBJ_STRING) {
        addReply(c,shared.wrongtypeerr);
        return C_ERR;
    } else {
        addReplyBulk(c,o);
        return C_OK;
    }
}

/*
* get命令
* 调用getGenericCommand函数实现具体操作
*/
void getCommand(client *c) {
    getGenericCommand(c);
}
```

getGenericCommand函数调用的`lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk)`，传递的参数是客户端c，key，以及shared.nullbulk。

`shared.nullbulk`是由redis在服务器启动时创建的一个共享变量，因为使用的地方较多，所以redis会创建这些共享变量，减少重复创建过程以及减少内存的损耗。它的值是：

`shared.nullbulk = createObject(OBJ_STRING,sdsnew("$-1\r\n"));`

lookupKeyReadOrReply函数只是做了简单的封装，看起来非常简洁，实际上，底层访问数据库是调用了db.c/lookupKey函数，这是get命令实现的核心：

```c
/*
* 查找数据库中指定key的对象并返回，查询出来的对象用于读操作
*/
robj *lookupKeyReadOrReply(client *c, robj *key, robj *reply) {
    robj *o = lookupKeyRead(c->db, key);
    if (!o) addReply(c,reply);
    return o;
}

robj *lookupKey(redisDb *db, robj *key, int flags) {
    // 在字典中根据key查找字典对象
    dictEntry *de = dictFind(db->dict,key->ptr);
    if (de) {
        // 获取字典对象的值
        robj *val = dictGetVal(de);
        /* 更新key的最新访问时间 */
        if (server.rdb_child_pid == -1 &&
            server.aof_child_pid == -1 &&
            !(flags & LOOKUP_NOTOUCH))
        {
            if (server.maxmemory_policy & MAXMEMORY_FLAG_LFU) {
                unsigned long ldt = val->lru >> 8;
                unsigned long counter = LFULogIncr(val->lru & 255);
                val->lru = (ldt << 8) | counter;
            } else {
            val->lru = LRU_CLOCK();
            }
        }
        return val;
    } else {
        return NULL;
    }
}
```

在redis中，所有的键值对都会用内置的哈希表保存在内存里，因此，在lookupKey的实现里，先使用`dictFind`函数查找传进来的key是否存在哈希表中，如果找到，则调用`dictGetVal`获取哈希节点对象的value属性，否则，返回NULL，函数的时间复杂度是O(1)。

函数lookupKeyRead在接收到返回后，判断值的类型：

如果是NULL，则将函数接收的参数shared.nullbulk返回给客户端。shared.nullbuk是上层函数传递进来的reply对象，一个null共享对象，根据redis的协议，解析为nil。

如果函数不为空，则调用dictGetVal获取查找到的对象的值，然后返回。

查找到的两种结果最终都是调用函数addReply返回结果给客户端，addReply函数将回复传递给客户端，addReply函数将回复结果写入到client的buf中，在redis的事件循环过程中，只要buf有数据就会输出到客户端。客户端得到内容后，根据redis协议解析结果，输出。在这个例子中，要查找的key不存在，因此客户端显示的是
(nil)

至此，get命令的全流程已经介绍完，接着看看set命令的执行链路，输入`set username:1234`。

## set命令

set的执行流程与get的流程几乎一样，不同点在于处理请求的时候调用的是`setCommand`，`setCommand`先做了一些参数的校验，然后会为value做一次编码转换，因为保存redis字符串的有两种编码格式：embstr和sds，使用embstr编码字符串，可以节省空间，这也是redis做的其中一项优化，继续往下看，最终是调用了`setGenricCommand`函数：

```
void setGenericCommand(client *c, int flags, robj *key, robj *val, robj *expire, int unit, robj *ok_reply, robj *abort_reply) {
    long long milliseconds = 0; /* 初始化，避免报错 */
    // 如果需要设置超时时间，根据unit单位参数设置超时时间
    if (expire) {
        // 获取时间值
        if (getLongLongFromObjectOrReply(c, expire, &milliseconds, NULL) != C_OK)
            return;
        // 处理非法的时间值
        if (milliseconds <= 0) {
            addReplyErrorFormat(c,"invalid expire time in %s",c->cmd->name);
            return;
        }
        if (unit == UNIT_SECONDS) milliseconds *= 1000; // 统一用转换成毫秒
    }
    /*
     * 处理非法情况
     * 如果flags为OBJ_SET_NX 且 key存在或者flags为OBJ_SET_XX且key不存在，函数终止并返回abort_reply的值
     */
    if ((flags & OBJ_SET_NX && lookupKeyWrite(c->db,key) != NULL) ||
        (flags & OBJ_SET_XX && lookupKeyWrite(c->db,key) == NULL))
    {
        addReply(c, abort_reply ? abort_reply : shared.nullbulk);
        return;
    }
    // 设置val到key中
    setKey(c->db,key,val);
    // 增加服务器的dirty值
    server.dirty++;
    // 设置过期时间
    if (expire) setExpire(c,c->db,key,mstime()+milliseconds);
    // 通知监听了key的数据库，key被操作了set、expire命令
    notifyKeyspaceEvent(NOTIFY_STRING,"set",key,c->db->id);
    if (expire) notifyKeyspaceEvent(NOTIFY_GENERIC,
        "expire",key,c->db->id);
    // 返回成功的信息
    addReply(c, ok_reply ? ok_reply : shared.ok);
}

void setKey(redisDb *db, robj *key, robj *val) {
    /*
     * 如果key不在数据库里，新建
     * 否则，用新值覆盖
     */
    if (lookupKeyWrite(db,key) == NULL) {
        dbAdd(db,key,val);
    } else {
        dbOverwrite(db,key,val);
    }
    incrRefCount(val); // 增加值的引用计数
    removeExpire(db,key); // 重置键在数据库里的过期时间
    signalModifiedKey(db,key); // 发送修改键的通知
}
```

`setGenericCommand`调用`setKey`函数将**key-value**的键值对添加到数据库，setKey调用`dictFind`函数查找key是否在数据库，如果在数据库，就用value覆盖旧值，否则将key-value添加到数据库。对于本文的例子，因为**username:1234**这个key不存在，`dictFind`查找返回的是空，因此函数`dbAdd`被调用，`dbAdd`函数只会在key不存在当前数据库的情况下被调用。

redis中的键值对都会保存到dict（字典对象）数据结构中。
dict数据结构的介绍可见之前的文章：[dict字典的实现](http://www.hoohack.me/2018/01/07/read-redis-src-dict)。具体操作API实现直接看代码：[dict.c](https://github.com/hoohack/read-redis-src/blob/master/redis-4.0/src/dict.c)。

追踪dbAdd函数代码细节可以发现，调用了`dictAdd`函数执行具体的操作，`_dictKeyIndex`函数为key返回合适的字典数组下标，然后分配内存保存新节点，将节点添加到哈希表中，并设置key和value的具体值。操作成功后，返回**DICT_OK**，否则返回**DICT_ERR**。

现在，username:1234已经设置了值，如果再次调用命令：`get username:1234`，过程跟上面描述的一样，到了`dictFind`阶段，函数能在数据库中找到`key username:1234`，函数返回的结果不为空，因此调用dictGetVal函数获取key的值，然后调用`addReply`返回对象的值。

至此，set/get命令的整个流程到此结束，通读一遍可能还会有点懵逼，因此根据本次分享的内容再加一个图，看完这个图再回顾整个流程可以加深理解。[查看大图](https://user-gold-cdn.xitu.io/2018/6/11/163ec67400ec3f0b?w=2467&h=1344&f=png&s=130445)

![redis调用链路](https://user-gold-cdn.xitu.io/2018/6/11/163ec67400ec3f0b?w=2467&h=1344&f=png&s=130445)


## 总结

通过本次的学习，从外层代码一只追溯到底层的网络代码实现，了解到了很多网络知识和代码封装技巧，再次感叹redis代码的优美。也借此机会将学习到的内容分享出来，如果有需要查看其它命令实现或者其他函数实现，也可以作为一次参考。

参考文章：[More Redis internals: Tracing a GET & SET](https://pauladamsmith.com/blog/2011/03/redis_get_set.html)

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

更多精彩内容，请关注个人公众号。

![](https://user-gold-cdn.xitu.io/2018/6/11/163ec67c55f88857?w=258&h=258&f=jpeg&s=28215)