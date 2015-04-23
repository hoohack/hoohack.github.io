---
layout: post
title:  "一步步学习Dwoo模板引擎--迭代器变量"
date:   '2015-04-23 19:00:41'
author: Hector
categories: PHP
excerpt: 'PHP,Dwoo,模板引擎'
keywords: 'PHP，Dwoo，模板引擎'
tags: [PHP,Dwoo,模板引擎]
---

接下来介绍的是一些特殊的变量，当你运行迭代器(如foreach，loop或者for)的时候它们会被自动地加载到$dwoo变量中。

##变量
> * first (bool) : 如果元素是第一个，则为true，否则为false
> * last (bool) : 如果元素是最后一个，则为true，否则为false
> * index (int) : 索引数字(从0开始计数，每次迭代增加1)
> * iteration (int) : 迭代次数 (从1开始计数，每次迭代过程增加1)
> * show (bool) : 如果loop循环会输出东西，则为true，否则为false
> * total (int) : 数组的元素个数总数

<!--more-->

##说明
> * 你可以通过`{$dwoo.<plugin (foreach, loop or for)>.<foreach name>.<var>}`访问它们
> * 如果你没有为插件提供名字参数，它默认会使用"default"，这意味着你可以这样访问一个foreach变量：`{$dwoo.foreach.default.first}`
> * $dwoo变量可以被简写为$，那就是说，`{$.foreach.default.first}`也是可以运行的

##例子

    {foreach $mArr, key, value, name='default'}
       {if $dwoo.foreach.default.first}
          First element
       {elseif $dwoo.foreach.default.index == 2}
          Second element
       {elseif $dwoo.foreach.default.last}
          Last element
       {/if}
    {/foreach}