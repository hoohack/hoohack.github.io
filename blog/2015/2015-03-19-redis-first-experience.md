---
layout: post
title:  "Redis初体验--在Window安装Redis和配置PHPRedis扩展"
date:   '2015-03-19'
tags: tech
author: hoohack
categories: Redis
---

这两天在学习Redis，刚在Windows下安装好，记录一下安装的过程。

#Redis是什么?
Redis是完全开源免费的，遵守BSD协议，先进的key-value持久化产品。是一个高性能的key-value数据库。因为值可以是字符串(String)、哈希(Map)、
列表(List)、集合(Sets)和有序集合(Sorted sets)等类型，所以它通常也被称为数据结构服务器。

你可以在这些数据类型中执行原子性操作，例如在字符串后面追加字符；在哈希表中增加值；增加一个元素到列表中；计算集合的交集，并集和差集；或者取得已排序的集合中的最大值。

为了得到高效的运行，Redis与内存中的数据集一起运行。根据你的使用情况，为了使其持久化，你可以每次都将数据集导出到硬盘中或者把命令保存到日志文件中。



Redis也支持简单且易用的主从复制功能。使用不会阻塞主服务器的异步复制以及自动重连。

其他特性有：使用 check-and-set(CAS)操作实现乐观锁，发布/订阅和配置设置使其像缓存一样运行。

#Redis的特点
> * 支持数据持久化，可以将内存中的数据保存在磁盘，重启Redis可以再次加载使用；
> * Redis不仅仅支持简单的key-value类型的数据，同时还支持list，set，hash等数据结构的存储；
> * Redis支持类似MySQL的主从备份，即master-slave的数据备份

#Redis的优势：
> * 性能极高-Redis能达到的读的速度是11000次/s，写的速度是81000次/s；
> * 丰富的数据类型-string(字符串类型)、hash(哈希散列类型)、list(列表类型)、set(集合类型)、zset(有序集合类型);
> * 原子性-redis执行单个命令是原子性的，但是redis没有对事务进行原子性保护，如果一个事务没有执行成功，是不会进行回滚的；
> * Redis运行在内存中，但可持续化到磁盘

#安装与配置

##在windows下安装Redis

###下载Redis

官方网站：[http://redis.io](http://redis.io/)

官方下载：[http://redis.io/download](http://redis.io/download) 可以根据需要下载不同版本

官网上是没有windows版本的，如果需要在windows下安装redis的话需要到github上下载。

windows版：[https://github.com/MSOpenTech/redis](https://github.com/MSOpenTech/redis)

根据网上的教程，下载完成后解压到硬盘下比如`D:\Redis\redis`，在D:\Redis\redis\bin\release下有两个zip包一个32位一个64位，根据自己windows的位数 解压到D:\Redis\redis根目录下。但是我在该目录下找不到相应的压缩文件，于是乎需要另辟蹊径。

###下载解压软件放在bin目录下(github)

下载网址：[https://github.com/ServiceStack/redis-windows](https://github.com/ServiceStack/redis-windows)

下载后解压，可根据相应的版本解压相应的压缩文件到bin目录下

###测试Redis运行

打开控制台，进入bin目录，运行`redis-server.exe redis-windows.conf`

![redis-server运行](http://7u2eqw.com1.z0.glb.clouddn.com/redis_run.png)

###开启Redis Client测试

打开一个新的控制台，进入bin目录，运行`redis-cli.exe`

![redis-cli运行](http://7u2eqw.com1.z0.glb.clouddn.com/redis_client_run.png)

###运行示例

![redis-test](http://7u2eqw.com1.z0.glb.clouddn.com/redis_test.jpg)

##配置PHP-Redis的扩展

###下载dll文件
本人用的是php5.5.12，网上很多教程中的下载链接都不适合。于是又要另辟蹊径，下面给出链接，根据对应的php版本以及对应的电脑配置下载就行

>php_redis-5.5-vc11-ts-x86-00233a.zip [http://d-h.st/4A5](http://d-h.st/4A5)
>
>php_igbinary-5.5-vc11-ts-x86-c35d48.zip [http://d-h.st/QGH](http://d-h.st/QGH)

>php_redis-5.5-vc11-nts-x86-00233a.zip [http://d-h.st/uGS](http://d-h.st/uGS)
>
>php_igbinary-5.5-vc11-nts-x86-c35d48.zip [http://d-h.st/bei](http://d-h.st/bei)

>php_redis-5.5-vc11-ts-x64-00233a.zip [http://d-h.st/1tO](http://d-h.st/1tO)
>
>php_igbinary-5.5-vc11-ts-x64-c35d48.zip [http://d-h.st/rYb](http://d-h.st/rYb)

>php_redis-5.5-vc11-nts-x64-00233a.zip [http://d-h.st/N0d](http://d-h.st/N0d)
>
>php_igbinary-5.5-vc11-nts-x64-c35d48.zip [http://d-h.st/c1a](http://d-h.st/c1a)

看下自己的phpinfo的信息

![php-version](http://7u2eqw.com1.z0.glb.clouddn.com/phpversion.png)

![zend-version](http://7u2eqw.com1.z0.glb.clouddn.com/zendversion.png)

就选择ts-X64的包来下载

###添加extension扩展(注意顺序)

将下载解压后的php_igbinary.dll和php_redis.dll放入php的ext目录下

然后修改php.ini，加入这两个扩展，注意顺序不要反了。

`extension=php_igbinary.dll`

`extension=php_redis.dll`

添加完之后重启WEBServer，查看phpinfo看到有redis扩展的信息就说明可以了

![php-redis-success](http://7u2eqw.com1.z0.glb.clouddn.com/php-redis-success.png)

###PHP-Redis扩展测试

PHP-Redis使用示例代码

    $redis = new Redis();
    $redis->connect("127.0.0.1", "6379");  //php客户端设置的ip及端口
    
    //存储一个值
    $redis->set("say","Hello World");
    echo $redis->get("say");     //输出Hello World

    //存储多个值
    $array = array('first_key'=>'first_val',
        'second_key'=>'second_val',
        'third_key'=>'third_val');
    $array_get = array('first_key','second_key','third_key');
    $redis->mset($array);
    var_dump($redis->mget($array_get));
