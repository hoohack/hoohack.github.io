---
layout: post
title:  "一步步学习Dwoo模板引擎--快捷方式"
date:   '2015-04-23 20:30:41'
author: Hector
categories: PHP
excerpt: 'PHP,Dwoo,模板引擎'
keywords: 'PHP，Dwoo，模板引擎'
tags: [PHP,Dwoo,模板引擎]
---

在下面的所有例子中，FOO是你需要展示的变量名。

`{%FOO} = {$dwoo.const.FOO}`

`{$.FOO} = {$dwoo.FOO}, i.e. for a {$.get.user_id} = {$dwoo.get.user_id}`

`{$} = 当前作用域`, 刚开始它表示全部模板数据，但如果你使用with或者loop改变其作用域的话它的值就会随着改变

`{$_} = {$_parent}`, 这是父作用域，在模板数据中比当前作用域高一个级别

`{$_._._}` 作为 `{$_parent._parent._parent}` 运行

`{$__} = {$_root}`, 这是最高级别的作用域，会一直等于全部模板数据

`{/} = closes` 最后一个打开的块