---
layout: post
title:  "PHP中call_user_func和call_user_func_array函数使用与比较"
date:   '2015-05-18 18:47:41'
author: Hector
categories: PHP
excerpt: 'php,call_user_func,call_user_func_array,回调'
keywords: 'php,call_user_func,call_user_func_array,回调'
---

以前一直都有看到过和用过这两个回调函数，但是只是知道简单地使用，并没有深入了解两个函数的具体用法和不同之处，今天刚好有机会再次接触到这两个函数，就来做个总结，好记性不如烂笔头。

##call_user_func

###函数定义

    mixed call_user_func ( callable $callback [, mixed $parameter [, mixed $... ]] )

把第一个参数作为回调函数调用，并且将其余的参数作为回调函数的参数。

###参数说明

<!--more-->

callback

>将被调用的回调函数(callable)。

parameter

>0个或更多的参数，都将被传入回调函数。

###返回值
返回回调函数的返回值，如果错误则返回FALSE。

###注意
>传入call_user_func函数的参数不能为引用传递。

###例子1(call_user_func)

    function sayName($name)
    {
        echo "My name is $name";
    }

    call_user_func('sayName', 'Tom');
    call_user_func('sayName', 'Jack');

以上例子输出

> My name is Tom

> My name is Jack

###例子2(用call_user_func()来调用一个类里面的方法)

    class Test {
        static function sayHello($name)
        {
            echo "Hello,my name is $name";
        }
    }

    $class_name = 'Test';
    call_user_func(array($class_name, 'sayHello'), 'Tom');
    call_user_func($class_name. '::sayHello', 'Tom');

    $obj = new Test();
    call_user_func(array($obj, 'sayHello'), 'Tom');

以上例子输出

>Hello,my name is Tom

>Hello,my name is Tom

##call_user_func_array

##函数定义

    mixed call_user_func_array ( callable $callback , array $param_arr )

把第一个参数作为回调函数(callback)调用，把参数数组作(param_arr)为回调函数的的参数传入。

###参数
callback

>被调用的回调函数。

param_arr

>要被传入回调函数的数组，这个数组得是索引数组。

###返回值
返回回调函数的结果。如果出错的话就返回FALSE。

###例子1

    function foobar($arg1, $arg2)
    {
        echo __FUNCTION__ . " got $arg1 and $arg2\n";
    }

    class Foo {
        function bar($arg1, $arg2)
        {
            echo __METHOD__ . " got $arg1 and $arg2\n";
        }
    }

    // 调用foobar函数并传入两个参数
    call_user_func_array("foobar", array("one", "two"));

    // 调用$foo->bar()方法并传入两个参数
    $foo = new foo;
    call_user_func_array(array($foo, "bar"), array("three", "four"));

###例子2(传递引用参数)

    <?php
        error_reporting(E_ALL);
        function increment(&$var)
        {
            $var++;
        }

        $a = 0;
        call_user_func('increment', $a);
        echo $a."\n";//0

        call_user_func_array('increment', array(&$a));
        echo $a."\n";//1
    ?>

以上例子输出

>foobar got one and two

>foo::bar got three and four

##注意
>在函数中注册有多个回调内容时(如使用 call_user_func() 与 call_user_func_array())，如在前一个回调中有未捕获的异常，其后的将不再被调用。

##区别
> * call_user_func不支持引用参数，call_user_func_array支持引用参数
> * 传入参数的方式不同