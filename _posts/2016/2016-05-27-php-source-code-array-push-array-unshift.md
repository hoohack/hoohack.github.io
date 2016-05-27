---
layout: post
title: "[PHP源码阅读]array_push和array_unshift函数"
date: '2016-05-27'
author: Hector
categories: PHP
excerpt: 'php,c,PHP源码分析,源码学习,PHP源码,array_push源码,array_unshift源码,php array_push源码,php array_unshift源码,php源码阅读,PHP源码阅读'
keywords: 'php,c,PHP源码分析,源码学习,PHP源码,array_push源码,array_unshift源码,php array_push源码,php array_unshift源码,php源码阅读,PHP源码阅读'
---

在PHP中，在数组中添加元素也是一种很常用的操作，分别有在数组尾部和头部添加元素，看看PHP内部是如何实现数组插入的操作。


我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/hoohack/read-php-src)。可以通过[commit记录](https://github.com/hoohack/read-php-src/commits/master)查看已添加的注解。
 
## array_push

    int array_push ( array &$array , mixed $value1 [ , mixed $... ] )

array_push函数将array参数看做一个栈，将传递进来的变量压倒array的尾部。array的长度随着被压进去的变量个数增加。下面的代码有意义的效果：

     $array[] = $var; 

<!--more-->

如果只需要添加一个元素到数组，使用$array[] 这种方式更好，因为这样做不用调用函数。

### 运行示例

    $arr = array();
    array_push($arr, 1, 2, 3); // return 3; $arr = [1, 2, 3]

### 运行步骤

array_push函数相对比较简单，就相当于压栈操作，把array看做一个栈，然后对每一个参数，让其变成引用，引用数加一，然后添加它到数组的尾部。

内部实现的流程图如下：

![array_push流程图](http://7u2eqw.com1.z0.glb.clouddn.com/array_push.png)

### 源码解读

添加元素使用了**zend_hash_next_index_insert**函数，此函数是_zend_hash_next_index_insert函数的宏定义，这个函数是PHP内部实现数组的数据结构--哈希表包含的一些API，这个API用于追加元素到哈希表或者更新哈希表中已有的哈希值。此函数实现的流程图如下：

![zend_insert](http://7u2eqw.com1.z0.glb.clouddn.com/zend_insert.png)


## array_unshift

    int arrat_unshift ( array &$array , mixed $value1 [ , mixed $... ] )

array_unshift函数将数据元素插入到数组的头部，插入时是作为整体插入，因此后面的参数将保持同样的顺序。插入后所有的数值键名将修改为从零开始计数，所有的文字键名不变。

### 运行示例

    $arr = array(1, 2, 3);
    array_unshift($arr, 4, 5, 6); // 4 5 6 1 2 3

### 运行步骤

> 1、调用php_splice将数据元素插入到数组头部，用新的哈希表替换就得哈希表并将其销毁
> 
> 2、如果操作后的stack等于运行时的符号表，则重置哈希表的内部指针
> 
> 3、stack指向新的哈希表，释放新的哈希表红箭，销毁就得哈希表

### 源码解读

由上面的步骤可知，array_unshift的核心步骤是php_splice函数。对于array_unshift函数，php_splice实现时新建一个哈希表out_hash，将需要插入的list数据先插入到out_hash中，然后再把原来的数组数据写入到out_hash中，这样实现在数组前面插入数据元素的功能。

实现的效果图如下：

![php_splice](http://7u2eqw.com1.z0.glb.clouddn.com/php_splice.png)

## 小结

要理解array_push函数的执行过程主要理解栈的思想即可，而array_unshift则是新建一个数组，然后将两数组合并为结果数组。
这次阅读源码过程中，同时也研究了PHP中的哈希表数据结构及一些API，也给自己补充了一些哈希表的知识。学习到了PHP底层是使用双向链表做哈希冲突的处理，获益匪浅。日后再做关于PHP数据结构的分享。

 
原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，**点收藏的同时也请点下推荐吧**，谢谢^_^

 

我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/hoohack/read-php-src)。可以通过[commit记录](https://github.com/hoohack/read-php-src/commits/master)查看已添加的注解。


更多源码文章，欢迎访问个人主页继续查看：[hoohack](http://www.hoohack.me)