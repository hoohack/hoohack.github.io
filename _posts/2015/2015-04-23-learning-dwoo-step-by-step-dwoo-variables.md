---
layout: post
title:  "一步步学习Dwoo模板引擎--Dwoo变量"
date:   '2015-04-23 19:48:41'
author: Hector
categories: PHP
excerpt: 'PHP,Dwoo,模板引擎'
keywords: 'PHP，Dwoo，模板引擎'
tags: [PHP,Dwoo,模板引擎]
---

Dwoo变量的名字仅限于`/[a-z0-9_]/i`，那就是说仅限于所有的字母数字字符加上下划线，它们区分大小写的。

作为提醒，我强烈建议你使用下划线'_'开始的变量因为当我需要魔法变量的时候我会使用例如`$_foo`的命名变量，这样的话所有人就避免了坏的情况。

##下面的是保留变量：
> * $dwoo
> * $dwoo.parent
> * $_key

##检索作用域变量
你可以在PHP端检索模板的作用域变量。例如：
    
    ...
    $dwoo->get($tpl, $data);
    var_dump($dwoo->getScope()); // 会返回包含所有作用于变量的数组

>注：include文件得到的作用域变量也是这样的方式返回。