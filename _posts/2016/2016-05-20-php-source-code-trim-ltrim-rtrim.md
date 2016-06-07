---
layout: post
title: "[PHP源码阅读]trim、rtrim、ltrim函数"
date: '2016-05-24'
author: Hector
categories: PHP
excerpt: 'php,c,源码分析,源码学习,PHP源码,trim源码,ltrim源码,rtrim源码,php trim源码,php源码阅读,PHP源码阅读'
keywords: 'php,c,源码分析,源码学习,PHP源码,trim源码,ltrim源码,rtrim源码,php trim源码,php源码阅读,PHP源码阅读'
---

trim系列函数是用于去除字符串中首尾的空格或其他字符。ltrim函数只去除掉字符串首部的字符，rtrim函数只去除字符串尾部的字符。

我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。

# trim

    string trim ( string $str [, string $character_mask = " \t\n\r\0\x0B" ] )

## 参数说明

**character_mask**
默认是" \t\n\r\0\x0B"等空白字符。

使用..可以指定一段范围的字符。此处要注意，".."左右两边是一对合法的范围值，如果传递的是非法的值会报错。

<!--more-->

## 运行示例

先来看看用正常的使用：

    $str = 'hello..';
    $new_str = trim($str, '.'); // 结果是hello

 

一个比较诡异的结果。这里报错是因为php把..左右两边看作是范围值，而此处'..'左边是字符'.'，PHP内部将认为其是一个缺少右边界的范围值。

    $str = 'hello...';
    $second_str = trim($str, '...'); // 报错

 

第二个参数使用合法的边界值：

    $str = 'helloabcdefg';
    $new_str = trim($str, 'a..g'); // 输出hello

 

## trim执行步骤

trim、ltrim、rtrim三个函数都是调用了php_do_trim函数，区别在于第二个参数mode的不同。本文主要对trim函数进行分析，ltrim和rtrim函数跟trim的类似。然后php_do_trim会调用了php_trim来实现功能，因此trim函数的核心函数时php_trim函数。其执行步骤如下：

> 1、根据what的值设置保存过滤字符的mask数组
> 
> 2、过滤在字符串首部的待过滤字符
> 
> 3、过滤在字符串尾部的待过滤字符

php_trim函数执行的流程图如下：

![trim流程图](http://7u2eqw.com1.z0.glb.clouddn.com/trim.png)

 

## 源码解读

php_trim函数先调用了php_charmask，这个函数试将过滤字符设置为mask[char] = 1的形式，这样就是一个哈希数组，然后可用于后面的判断。如果第二个参数是范围值时，调用了memset函数给mask数组赋值。

 

在用mode变量判断是哪种过滤时，此处有一个小优化，在PHP内部使用的是与运算，而不是多个的判断条件。该部分代码如下：

    if (mode & 1) {
        for (i = 0; i < len; i++) {
            if (mask[(unsigned char)c[i]]) {
                trimmed++;
            } else {
                break;
            }
        }
        len -= trimmed;
        c += trimmed;
    }
    if (mode & 2) {
        for (i = len - 1; i >= 0; i--) {
            if (mask[(unsigned char)c[i]]) {
                len--;
            } else {
                break;
            }
        }
    }

 

判断的过程：

> 1 && 1 == 1 左边需要过滤
> 
> 2 && 1 == 0 左边不需要过滤
> 
> 3 && 1 == 1 左边需要过滤
> 
> 1 && 2 == 0 右边不需要过滤
> 
> 2 && 2 == 1 右边需要过滤
> 
> 3 && 2 == 1 右边需要过滤


像这样使用位操作可以提高程序的效率，而且代码更加简洁易读。

 

## 小结

阅读这个函数的源码，首先学习到在C语言中，如果需要做键值对数组，而且键值是单个字符，可以使用unsigned char的类型做数组下标，这样可以构造类似字符作为下标的映射数组。

第二个就是使用位运算可以提高程序效率和代码可读性。

 

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^

 
最后再安利一下，我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。