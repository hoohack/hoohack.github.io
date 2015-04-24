---
layout: post
title:  "一步步学习Dwoo模板引擎--介绍、安装"
date:   '2015-04-22 18:56:41'
author: Hector
categories: PHP
excerpt: '一步步学习Dwoo,PHP,Dwoo,模板引擎'
keywords: '一步步学习Dwoo,PHP，Dwoo，模板引擎'
tags: [PHP,模板引擎,Dwoo]
---

使用Dwoo模板引擎有一个多月了，网上的中文文档比较少，在这里记录自己学到的相关知识。

##Dwoo是什么
Dwoo是一款基于PHP5的模板引擎。

Dwoo来自一个众所周知的，已经越来越老的模板引擎--Smarty。

随着年龄的增大，Smarty显得越来越重了，有着与新版本不一致的旧特性。作为一个为PHP4写的模板引擎，在某些地方，它的面向对象特征没有利用到PHP5更多的高级特性。

因此Dwoo就诞生了，为了提供一个更新更强壮的引擎。

<!--more-->

自从发布以来，已被证实它在很多地方都比Smarty更快，而且它提供了一个兼容层来让使用了多年Smarty的开发者逐步地过渡到Dwoo。

Dwoo2嵌入了PHP的新特性，比如：Namespaces,CamelCase等等...因此Dwoo2需要PHP5.3或以上的版本才能运行。

##安装Dwoo
>1、使用composer是最简单地方法。在[https://packagist.org/packages/dwoo/dwoo](packagist.org)也可以找到。

2、也可以使用Dwoo的PHAR包。

##使用

###Autoload

    <?php
        // Include autoloader
        require 'lib/Dwoo/Autoloader.php';

        // Register Dwoo namespace and register autoloader
        $autoloader = new Dwoo\Autoloader();
        $autoloader->add('Dwoo', 'lib/Dwoo');
        $autoloader->register(true);

        // Create the controller, it is reusable and can render multiple templates
        $dwoo = new Dwoo\Core();

        // Create some data
        $data = array('a'=>5, 'b'=>6);

        // Output the result directly ... 
        $dwoo->output('path/to/index.tpl', $data);
        // ... or get it to use it somewhere else
        $var = $dwoo->get('path/to/index.tpl', $data);
        echo $var;

###使用PHAR

    <?php
        // Include phar archive, not need to call autoloader anymore
        require 'phar://dwoo.phar';

        // Create the controller, it is reusable and can render multiple templates
        $dwoo = new Dwoo\Core();

        // Create some data
        $data = array('a'=>5, 'b'=>6);

        // Output the result directly ... 
        $dwoo->output('path/to/index.tpl', $data);
        // ... or get it to use it somewhere else
        $var = $dwoo->get('path/to/index.tpl', $data);
        echo $var;