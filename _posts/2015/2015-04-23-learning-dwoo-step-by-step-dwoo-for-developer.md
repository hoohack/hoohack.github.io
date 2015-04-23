---
layout: post
title:  "一步步学习Dwoo模板引擎--后台开发者使用"
date:   '2015-04-23 11:20:41'
author: Hector
categories: PHP
excerpt: 'PHP,Dwoo,模板引擎'
keywords: 'PHP，Dwoo，模板引擎'
tags: [PHP,Dwoo,模板引擎]
---

##基本使用

    <?php
        // 引入主要的类和注册autoloader类(它会自己处理接下来的事情)
        require 'lib/Dwoo/Autoloader.php';
        \Dwoo\Autoloader::register();

        // 创建一个Dwoo对象
        $dwoo = new \Dwoo\Core();

        // 创建一些数据
        $data = array('a'=>5, 'b'=>6);

        // 输出结果...
        $dwoo->output('path/to/index.tpl', $data);
        // ... 或者获得结果
        echo $dwoo->get('path/to/index.tpl', $data);

<!--more-->

##文件以及数据对象
    
    <?php
    require 'lib/Dwoo/Autoloader.php';
    \Dwoo\Autoloader::register();

    $dwoo = new \Dwoo\Core();

    // 加载模板文件，如果你想使用不同数据多次渲染一个模板文件可以重复使用这句
    $tpl = new \Dwoo\Template\File('path/to/index.tpl');

    // 创建一个数据集合，如果你想渲染多个可以被这个集合填充的模板的话可以重复使用这个数据集合
    $data = new \Dwoo\Data();

    // 赋值
    $data->assign('foo', 'BAR');
    $data->assign('bar', 'BAZ');

    // 输出结果
    $dwoo->output($tpl, $data); 
    // ... 或者获得它们的值
    echo $dwoo->get($tpl, $data);

##编译对象

    <?php
    require 'lib/Dwoo/Autoloader.php';
    \Dwoo\Autoloader::register();

    $dwoo = new \Dwoo\Core();
    $tpl = new \Dwoo\Template\File('path/to/index.tpl');
    $data = array('a' => 5, 'b' => 6);

    // 实例化一个编译类
    $compiler = new \Dwoo\Compiler();
    // 增加一个插件目录的预处理器
    $compiler->addPreProcessor('Processor_Name', true);
    // 或者使用你的过滤器
    $compiler->addPreProcessor('Processor_Function_Name');

    // 输出结果，提供给编译器使用
    $dwoo->output($tpl, $data, $compiler);

##设置目录
学习一下怎么使用`setCompileDir`和`setTemplateDir`方法。
    
    <?php
    require 'lib/Dwoo/Autoloader.php';
    \Dwoo\Autoloader::register();

    $dwoo = new \Dwoo\Core();

    // 配置目录
    $dwoo->setCompileDir('path/to/compiled/dir/'); // 保存编译模板的目录
    $dwoo->setTemplateDir('path/to/your/template/dir/'); // 保存.tpl文件

    $data = array('a'=>5, 'b'=>6);

    $dwoo->output('index.tpl', $data);
    echo $dwoo->get('index.tpl', $data);
