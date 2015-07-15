---
layout: post
title:  "在Linux中使用dd刻录系统"
date:   '2015-01-15 15:46:41'
author: Hector
categories: Linux
---

第一次接触Linux操作系统的时候使用的是Ubuntu发行版，装系统的时候只需要使用ultraisoPE软件添加镜像文件就可以进行刻录了，但是后来经过朋友的
介绍，改为使用OpenSUSE的发行版，在刻录的时候，不可以像Ubuntu那样刻录，可以通过Linux下的dd命令进行刻录的操作。

## dd
在linux查看该命令的用途：`man dd`
    
可以看到

<!--more-->

    dd - convert and copy a file
    
可见dd命令是转换和复制文件。

在Unix上，硬件的设备驱动（如硬盘）和特殊设备文件（如/dev/zero和/dev/random）就像普通文件一样，出现在文件系统中；只要在各自的驱动程序中
实现了对应的功能，dd也可以读取自和/或写入到这些文件。这样，dd也可以用在备份硬件的引导扇区、获取一定数量的随机数据等任务中。dd程序也可以在
复制时处理数据，例如转换字节序、或在ASCII与EBCDIC编码间互换。

## dd参数说明

    dd if="input file" of="output file" bs="block size" count="number" 

if ： 就是input file，也可以是设备

of ： 就是output file，也可以是设备

bs ： 规划一个block的大小，若未指定则默认是512bytes（一个扇区的大小）

count ： 多少个bs的意思

## 刻录的步骤

### 查找USB设备
    
    ls -l /dev/disk/by_id/*usb*/
    
此时可以看到你插入的USB设备，找到有数字后缀的设备进行卸载

### 卸载U盘
    
    umount /dev/sdX1
    
### 刻录镜像

    dd if=/path/to/downloaded.iso of=/dev/sdX1 bs=4M
    
## ？无法格式化修复U盘
使用dd命令刻录U盘后，你的U盘可能在Windows下即使再次重新格式化，也无法显示正常的大小，如果您确信您的U盘是正品，那么可以使用类似如下命令修复U盘

    dd if=/dev/zero of=/dev/sdc bs=512 count=1
    