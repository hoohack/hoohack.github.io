---
layout: post
title:  "PHP匿名函数"
date:   '2015-05-16 17:55:41'
author: Hector
categories: PHP
excerpt: 'php,匿名函数,闭包'
keywords: 'php,匿名函数,闭包'
---

##定义(摘抄自PHP手册)
匿名函数(Anonymous functions)，也叫闭包函数(closures)，允许创建一个没有指定名称的函数。最经常用作回调函数(callback)参数的值。当然，也有其他应用的情况。

###匿名函数示例一

    <?php
        echo preg_replace_callback('~-([a-z])~', function ($match) {
            return strtoupper($match[1]);
        }, 'hello-world');

输出

>helloWorld

<!--more-->

注意:

>上面的正则表达式`~-([a-z])~`中的`~`表示正则表达式的边界，相当于平常写的正则表达式的`//`。因此，上面的正则表达式也可以写作`/-([a-z])/`。

闭包函数也可以作为变量来使用。PHP会把此种表达式转换成内置类Closure的对象实例。把一个closure对象赋值给一个变量的方式与普通变量赋值的语法是一样的。最后也要加上分号作为结束。

###匿名函数变量赋值示例

    <?php
        $greet = function($name) {
            printf("Hello %s\r\n", $name);
        };

        $greet('World');
        $greet('PHP');

闭包可以从父作用域中继承变量。任何此类变量都应该使用`use`语言结构传递进去。

###从父作用域继承变量例子

    <?php
        $message = 'hello';

        // 没有使用"use"
        $example = function () {
            var_dump($message);
        };
        echo $example();

        // 继承 $message
        $example = function () use ($message) {
            var_dump($message);
        };
        echo $example();

        // 继承变量的值是当函数定义时继承而不是调用时
        $message = 'world';
        echo $example();

        // 重置$message
        $message = 'hello';

        // 通过引用继承
        $example = function () use (&$message) {
            var_dump($message);
        };
        echo $example();

        // 值在父作用域的改变影响到了函数调用里面的值
        $message = 'world';
        echo $example();

        // 闭包也接收正常的参数
        $example = function ($arg) use ($message) {
            var_dump($arg . ' ' . $message);
        };
        $example("hello");

上面程序的输出是：

    Notice: Undefined variable: message in /example.php on line 6
    NULL

    string(5) "hello"

    string(5) "hello"

    string(5) "hello"

    string(5) "world"

    string(11) "hello world"

这些变量必须在函数或者类的头部声明。从父作用域中继承变量与使用全局变量是不同的。全局变量存在于一个全局的范围，无论当前在执行的是哪个函数。而闭包的父作用域是定义该闭包的函数(不一定是调用它的函数)。

##递归
如果需要递归地调用闭包的话，使用下面的代码：

    <?php
        $recursive = function () use (&$recursive) {
            //$recursive函数是有效的
        };

        //这样并不行
        $recusive = function() use ($recursive) {
            //$recursive并不能被识别
        };

##注意

1.当'引入'变量到闭包的作用域时，很容易忽略/忘记它们是真的被拷贝到闭包的作用域里而不是仅仅作为可以的值。

因此当你需要在闭包里改变变量的时候，你应该使用引入变量的方式传入。

2.当你调用一个保存在实例化的变量的闭包时是无效的，如下面的代码所示：

    <?php
        $obj = new StdClass();

        $obj->func = function() {
            echo "hello";
        }
        
        //$obj->func(); 并不能执行

        //应该这样调用：
        $func = $obj->func();
        $func();

        //或者
        call_user_func($obj->func);

        //但是，这样的方式也是可以的：
        $array['func'] = function() {
            echo 'hello';
        };

        $array['func']();

##跟Javascript的闭包的几点比较
上面提到，在PHP中通过值传递是这样的
    
    <?php
        $message = 'hello';
        $example = function () use ($message) {
            var_dump($message);
        };
        $message = 'world';
        $example();

上面输出的是`hello`。

在Javascript的闭包可以通过下面的例子实现相同的效果

    var message = 'hello';

    var func = (function(message) { return function{ alert(message);}})(message);
    message = 'world';
    func();//输出hello

PHP中在使用闭包时的引用传递如下：
    
    <?php
        $message = 'hello';
        $example = function () use (&$message) {
            var_dump($message);
        };
        $message = 'world';
        $example();

上面输出的是`world`。

在Javascript中可以这么实现达到相同的效果：

    var message = 'hello';
    var func = function() { alert(message); };
    message = 'world';
    func();//输出world

PHP的闭包与Javascript的闭包有很大的不同。刚开始看到上面的差别时并没有弄懂，后来通过请教同学之后才知道了为什么。上面两端Javascript的不同是因为在Javascript中并没有块作用域以及两个语言之间本身的解析机制的不同。具体的解释日后再写一篇作解释。