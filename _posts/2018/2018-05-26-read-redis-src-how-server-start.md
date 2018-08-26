---
layout: post
title: "［Redis源码阅读］当你启动Redis的时候，Redis做了什么"
date: '2018-05-26 10:00:00'
author: hoohack
categories: Redis
excerpt: 'redis,c,源码分析,源码学习,redis源码,redis 4.0源码,redis启动'
keywords: 'redis,c,源码分析,源码学习,redis源码,redis 4.0源码,redis启动'
---

直奔主题，当启动Redis的时候，Redis执行了哪些操作？

假设Redis安装在了/usr/local/目录下，那么启动Redis是通过执行`/usr/local/bin/redis-server -c xxx.conf`的方式执行。
redis-server是一个通过编译server.c文件生成的程序，因此想了解redis是怎么启动的，应该从server.c/main函数入手。

具体代码可见：[server.c](https://github.com/hoohack/read-redis-src/blob/master/redis-4.0/src/server.c)

<!--more-->

阅读main函数，可以知道，整个启动大致分为五个步骤：初始化server结构体、从配置文件夹在加载参数、初始化服务器、载入持久化文件、开始监听事件。

redis用redisServer结构体来保存服务器的属性和信息，在server.c文件中，定义了一个全局服务器变量：

    struct redisServer server;

另外，还定义了一个redis命令表，表里包含了命令以及命令对应的函数：

    struct redisCommand redisCommandTable;

在main函数里，redis先调用initServerConfig函数初始化server结构体。

## 初始化server结构体
main函数调用initServerConfig函数为server的属性设置一些默认值，比如：

服务器的运行ID

redis使用的默认端口号，是在server.h定义的CONFIG_DEFAULT_SERVER_PORT = 6379

LRU时钟

主从备份相关参数

命令表

慢查询参数

接着会保存当前执行的路径和参数，为之后的服务器重启使用相同的参数做准备：
    
    server.executable = getAbsolutePath(argv[0]);
    server.exec_argv = zmalloc(sizeof(char*)*(argc+1));
    server.exec_argv[argc] = NULL;
    for (j = 0; j < argc; j++) server.exec_argv[j] = zstrdup(argv[j]);

## 从配置文件加载参数
redis的启动参数有很多，其中一个是指定配置文件。初始化server结构体后，大部分的属性都会设置到结构体了，但是有部分参数可以通过配置文件重现设置，比如redis的端口号。

初始化完server结构体后，函数会判断是否有指定配置文件，如果有，调用loadServerConfig函数，从配置文件加载相关的配置，把配置文件对应的参数设置到server结构体。

读取配置文件加载参数的流程如下：

> * 1、分割参数项
> * 2、跳过空行和注释行
> * 3、逐项检查，如果参数合法，设置配置值到server属性

至此，redisServer大部分属性已经设置好，server还有很多数据结构没有初始化，initServer函数就继续接下来的初始化工作。

## 初始化服务器数据结构
main函数会调用initServer函数初始化服务器状态，比如：

进程ID

客户端链表

从库链表

为常用值创建共享对象

初始化事件循环器

打开TCP开始监听套接字

创建服务器的数据库，并初始化内部状态

为serverCron定时器创建时间事件定时器

如果开启了AOF，打开AOF文件，之后恢复数据时需要用到

初始化慢查询日志模块

初始化后台IO模块

## 载入持久化文件，还原数据库
初始化完服务器的状态后，服务器已经处于一个可启动状态，因为redis有持久化特性，服务器还需要加载相应的文件来还原之前数据库的数据。
判断Redis当前开启了哪种模式，如果是AOF，则通过AOF还原数据库的数据，否则，载入RDB文件，通过RDB文件还原数据库的数据。

## 开始监听事件
main函数会设置beforeSleep和afterSleep回调函数，然后调用aeMain函数启动事件循环器，开始监听事件。aeMain函数是一个死循环，不断的监听新请求的到来。

    /*
     * server启动后，main函数的最终步骤，不断地调用beforesleep和aeProcessEvents
     */
    void aeMain(aeEventLoop *eventLoop) {
        eventLoop->stop = 0;
        while (!eventLoop->stop) {
            if (eventLoop->beforesleep != NULL)
                eventLoop->beforesleep(eventLoop);
            aeProcessEvents(eventLoop, AE_ALL_EVENTS|AE_CALL_AFTER_SLEEP);
        }
    }

综上所述，服务器整个启动简化流程图如下：

![redisServer](http://7u2eqw.com1.z0.glb.clouddn.com/redis%E5%90%AF%E5%8A%A8.png)

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

更多精彩内容，请关注个人公众号。

![](http://7u2eqw.com1.z0.glb.clouddn.com/qrcode_for_gh_4906075ba3ae_258.jpg)