---
layout: post
title:  "一步步学习Dwoo模板引擎--变量"
date:   '2015-04-23 19:00:41'
author: Hector
categories: PHP
excerpt: '一步步学习Dwoo,一步步学习Dwoo引擎,PHP,Dwoo,模板引擎'
keywords: '一步步学习Dwoo,一步步学习Dwoo引擎,PHP，Dwoo，模板引擎'
tags: [PHP,Dwoo,模板引擎]
---

##迭代器变量

###变量
> * first (bool) : 如果元素是第一个，则为true，否则为false
> * last (bool) : 如果元素是最后一个，则为true，否则为false
> * index (int) : 索引数字(从0开始计数，每次迭代增加1)
> * iteration (int) : 迭代次数 (从1开始计数，每次迭代过程增加1)
> * show (bool) : 如果loop循环会输出东西，则为true，否则为false
> * total (int) : 数组的元素个数总数

<!--more-->

###说明
> * 你可以通过`{$dwoo.<plugin (foreach, loop or for)>.<foreach name>.<var>}`访问它们
> * 如果你没有为插件提供名字参数，它默认会使用"default"，这意味着你可以这样访问一个foreach变量：`{$dwoo.foreach.default.first}`
> * $dwoo变量可以被简写为$，那就是说，`{$.foreach.default.first}`也是可以运行的

###例子

    {foreach $mArr, key, value, name='default'}
       {if $dwoo.foreach.default.first}
          First element
       {elseif $dwoo.foreach.default.index == 2}
          Second element
       {elseif $dwoo.foreach.default.last}
          Last element
       {/if}
    {/foreach}

#Dwoo变量
Dwoo变量的名字仅限于`/[a-z0-9_]/i`，那就是说仅限于所有的字母数字字符加上下划线，它们区分大小写的。

作为提醒，我强烈建议你使用下划线'_'开始的变量因为当我需要魔法变量的时候我会使用例如`$_foo`的命名变量，这样的话所有人就避免了坏的情况。

###下面的是保留变量：
> * $dwoo
> * $dwoo.parent
> * $_key


###检索作用域变量
你可以在PHP端检索模板的作用域变量。例如：
    
    ...
    $dwoo->get($tpl, $data);
    var_dump($dwoo->getScope()); // 会返回包含所有作用于变量的数组

>注：include文件得到的作用域变量也是这样的方式返回。

##快捷方式

在下面的所有例子中，FOO是你需要展示的变量名。

`{ %FOO } = {$dwoo.const.FOO}`

`{$.FOO} = {$dwoo.FOO}, i.e. for a {$.get.user_id} = {$dwoo.get.user_id}`

`{$} = 当前作用域`, 刚开始它表示全部模板数据，但如果你使用with或者loop改变其作用域的话它的值就会随着改变

`{$_} = {$_parent}`, 这是父作用域，在模板数据中比当前作用域高一个级别

`{$_._._}` 作为 `{$_parent._parent._parent}` 运行

`{$__} = {$_root}`, 这是最高级别的作用域，会一直等于全部模板数据

`{/} = closes` 最后一个打开的块