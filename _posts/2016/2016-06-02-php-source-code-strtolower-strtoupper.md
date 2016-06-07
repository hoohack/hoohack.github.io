---
layout: post
title: "[PHP源码阅读]strtolower和strtoupper函数"
date: '2016-06-02'
author: Hector
categories: PHP
excerpt: 'php,c,PHP源码分析,源码学习,PHP源码,strtolower源码,strtoupper源码,php strtolower源码,php strtoupper源码,php源码阅读,PHP源码阅读'
keywords: 'php,c,PHP源码分析,源码学习,PHP源码,strtolower源码,strtoupper源码,php strtolower源码,php strtoupper源码,php源码阅读,PHP源码阅读'
---

字符串的操作函数中，字符串的大小写转换也算是比较常用的函数，其底层实现也比较简单，下面来一探究竟。

我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。

## strtolower

    string strtolower ( string $string )

将字符串转换成小写字符。

<!--more-->

## strtoupper

    string strtoupper ( string $string )

将字符串转换成大写字符。

## 运行示例

    $str = 'Hello World';
    $new_str = strtolower($str); // hello world

    $str = 'hello world';
    $new_str = strupper($str); // HELLO WORLD

## 代码运行步骤

> 拷贝一份字符串
> 
> php_strtolower/php_strtoupper进行转换

## 源码解读

两个函数的核心操作都差不多，讲一下strtolower，另一个是类似的。
php_strtolower函数的核心代码如下：

    c = (unsigned char *)s;
    e = c+len;

    // 遍历s，逐个变为小写
    while (c < e) {
    　　*c = tolower(*c);
    　　c++;
    }
    return s;
 

这个函数就是遍历整个字符串，逐个转成小写字符。这也是一个经典的指针操作。

 

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^

 

最后再安利一下，我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。

更多源码文章，欢迎访问个人主页继续查看：[hoohack](http://www.hoohack.me)