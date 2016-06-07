---
layout: post
title: "[PHP源码阅读]array_pop和array_shift函数"
date: '2016-05-30'
author: Hector
categories: PHP
excerpt: 'php,c,PHP源码分析,源码学习,PHP源码,array_pop源码,array_shift源码,php array_pop源码,php array_shift源码,php源码阅读,PHP源码阅读'
keywords: 'php,c,PHP源码分析,源码学习,PHP源码,array_pop源码,array_shift源码,php array_pop源码,php array_shift源码,php源码阅读,PHP源码阅读'
---

[上篇文章](http://www.hoohack.me/2016/05/27/php-source-code-array-push-array-unshift)介绍了PHP添加元素到数组的函数，那么当然有从数组中删除元素。array_pop和array_shift只从数组的头或尾删除一个元素。经过阅读源码，发现这两个函数的实现都是调用了同一个函数--_phpi_pop来实现从数组中删除一个数组元素的功能。因此解读时将这两个函数一并讲了。

我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。

 

## 函数语法

### array_pop

    mixed array_pop ( array $&array )

array_pop函数弹出并返回数组的最后一个单元，并将数组长度减一。如果array为空则返回NULL。

<!--more-->

### array_shift

    mixed array_shift ( array &$array )

将数组开头的单元移出数组并作为结果返回，将array长度减一并将所有数字键值改为从0开始计数，文字键值不变。

## 代码示例

下面代码展示了array_pop和array_shift的使用方法

    $arr = array(‘apple’, ‘banana’, ‘cat’);
    $val = array_pop($arr); // val == cat
    $arr = array(‘apple’, ‘banana’, ‘cat’);
    $val = array_shift($arr); // val == apple

## 执行步骤

两个函数都是调用了_phpi_pop函数，区别不同的是调用_phpi_pop函数时传递的第二个参数off_the_end的不同，如果off_the_end是1，则是array_pop，否则是array_shift。下面是_phpi_pop这个函数执行的详细步骤：

> 1、如果数组长度为0，则返回NULL。
> 
> 2、根据off_the_end参数移动内部指针指向需要删除的数组元素。
> 
> 3、设置返回值为第二步指针指向的元素。
> 
> 4、从数组中移出第一个或最后一个值并将长度减一。
> 
> 5、如果是array_shift操作，则需要重置数组下标，将数字下标改为从0开始计数，文字键值不变；否则只需要修改下一个数字索引的位置。
> 
> 6、重置array指针。

函数执行的过程可以用下面的流程图描述：
![phpi_pop](http://7u2eqw.com1.z0.glb.clouddn.com/phpi_pop.png)


下面两个图展示了根据上面的示例代码执行时数组元素和内部指针的变化的效果图：
![array_pop](http://7u2eqw.com1.z0.glb.clouddn.com/array_pop.png)
           
**array_pop**

![array_shift](http://7u2eqw.com1.z0.glb.clouddn.com/array_shift.png)

**array_shift**

 

array_pop和array_shift调用此函数执行的步骤都大同小异，不同之处在于：

1、在移动指针时，前者移动到数组尾部，后者移动指针到数组第一个单元。

2、删除操作完成后，前者只需修改下一个数字索引的位置，而后者需要重置数组下标。

## 小结

如果两个函数实现的步骤差不多，可以用一个参数区别执行的是哪一个函数以减少程序中重复的代码。

 

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^

 

最后再安利一下，我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。

更多源码文章，欢迎访问个人主页继续查看：[hoohack](http://www.hoohack.me)