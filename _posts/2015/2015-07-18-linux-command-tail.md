---
layout: post
title:  "Linux命令总结--tail"
date:   '2015-07-18 23:28:37'
author: Hector
categories: php
excerpt: 'Linux,tail'
keywords: 'Linux,tail'
---

tail

>输出文件的最后一部分

最近在Linux开发过程中,经常使用tail命令来查看日志文件进行调试,这是因为在开发过程中,每运行一次程序,log就会被追加到日志文件中,所以使用tail命令来查看新增的日志内容十分方便.由于经常使用,而且在平时的使用过程中只用到了`-n`的参数,于是就想多学几个参数,并记录一下.

##命令格式
    
    tail [必要参数][选择参数][文件]

<!--more-->

##命令参数
    
    -f --follow 表示持续监测后面所接的文档名,直到按下`ctrl c`才会结束tail的监测

    -v --verbase 输出给出文件名的首部

    -c,--byte=K 输出最后的K个字节数的内容;或使用-c +k输出每一行的K个字节数的内容

    -n,--line=K 输出最后的K行,默认输出10行.或使用-n +K 输出从第K行开始的内容

    --pid=PID 与-f合用,表示在进程ID-PID结束之后也结束

    -q --quiet --slient 从不输出给出文件名的首部

##使用实例

文件test.log内容

    1
    2
    3
    4
    5
    6
    7
    8
    9
    10
    11
    12

###实例1 查看文件最后5行内容 

    tail -n 5 test.log

输出

    8
    9
    10
    11
    12

###实例2 从第5行开始显示文件

    tail -n +5 test.log

结果

    5
    6
    7
    8
    9
    10
    11
    12