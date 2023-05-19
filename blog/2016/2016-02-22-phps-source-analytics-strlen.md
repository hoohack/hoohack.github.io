---
layout: post
title: "[PHP源码阅读笔记]strlen函数"
date: 2016-02-22
tags: blog
author: hoohack
categories: PHP
excerpt: 'PHP,PHP源码,PHP源码结构,PHP源码分析,strlen函数'
keywords: 'PHP,PHP源码,PHP源码结构,PHP源码分析,strlen函数'
---

我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。

strlen函数说明。

    int strlen ( string $string )

在[这篇文章](https://www.hoohack.me/2016/02/10/understanding-phps-internal-function-definitions-ch)，我们可以知道`strlen`函数是通过Zend Engine定义的。函数的定义可以在[这里](http://lxr.php.net/xref/PHP_5_4/Zend/zend_builtin_functions.c#478)查看。

在这里也给出函数的源码：



    ZEND_FUNCTION(strlen)
    {
        char *s1;
        int s1_len;

        if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "s", &s1, &s1_len) == FAILURE) {
            return;
        }

        RETVAL_LONG(s1_len);
    }

该文章讲到，该函数很简单，并不需要进一步的解释。而[这篇文章](https://www.hoohack.me/2016/02/12/phps-source-code-for-php-developers-part3-variables-ch)也有对`zend_parse_parameters`函数做介绍。笔者较笨，于是便想理解`zend_parse_parameters`函数是怎么返回变量长度的。

在`zend_parse_arg_impl`函数，就是解析参数的地方，我们继续看`case 's'`的分支。这个分支是对字符串变量的解析。

`int *pl = va_arg(*va, int *);`是字符串长度变量的定义。

继续往下看，可以看到对`pl`变量的赋值语句：`*pl = Z_STRLEN_PP(arg);`。

而`Z_STRLEN_PP`宏的定义在`zend_operators.h`文件中：

    #define Z_STRLEN_PP(zval_pp)    Z_STRLEN(**zval_pp)

再继续看`Z_STRLEN`宏的定义，`#define Z_STRLEN(zval)          (zval).value.str.len`。由此我们可以知道，`strlen`函数是通过直接返回zval结构体中的str的len属性来实现的。

最后再安利一下，我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。
