---
layout: post
title:  "PHP之道--函数式编程(译)"
date:   '2015-05-13 16:34:41'
author: Hector
categories: PHP
excerpt: 'php之道,函数式编程'
keywords: 'php之道,函数式编程'
---

原文出处：[http://www.phptherightway.com/pages/Functional-Programming.html](http://www.phptherightway.com/pages/Functional-Programming.html)

PHP支持一流的函数，意味着函数可以被赋值到一个变量。用户自定义以及内建函数都可以被变量引用以及动态调用。函数可以作为参数传递到其他函数中，函数也可以返回其他函数(这个特性被称为高阶函数)。

递归，这是一个允许函数调用它本身的特性，它在语言中被支持，但是大多数PHP代码都是用迭代。

匿名函数(以及闭包支持)自从PHP5.3以后出现(2009)。

<!--more-->

PHP 5.4增加了绑定闭包作用域到对象的特性，也提高回调的支持，如回调函数几乎在任何情况下都可以与匿名函数互换。

高阶函数最多的使用场景是实现策略模式。内建函数array_filter 需要一个数组参数(data)以及一个用于过滤每一个数组项的函数(一个策略或者一个回调)。

    <?php
    $input = array(1, 2, 3, 4, 5, 6);

    // 创建一个新的匿名函数然后赋值给一个变量
    $filter_even = function($item) {
        return ($item % 2) == 0;
    };

    // 内建函数 array_filter 接收数据和函数
    $output = array_filter($input, $filter_even);

    // 函数不一定要被赋值到变量，下面这一也是可以的：
    $output = array_filter($input, function($item) {
        return ($item % 2) == 0;
    });

    print_r($output);

闭包是一个可以访问从外部作用域引进来的非全局变量。理论上，闭包是一个带有参数的函数。那些参数在定义时被上下文封闭起来，对外部是不可见的。闭包可以用一个很干净利索的方式解决变量作用域的限制。

下面一个例子我们使用闭包来定义一个在过滤器外面返回一个过滤器到array_filter的函数。

    <?php
    /**
     - 创建一个匿名过滤函数，只接收大于$min 的数
     *
     - 在“大于n”的过滤器之外返回单个过滤器
     */
    function criteria_greater_than($min)
    {
        return function($item) use ($min) {
            return $item > $min;
        };
    }

    $input = array(1, 2, 3, 4, 5, 6);

    // 在input数组中使用已选的过滤函数来调用array_filter函数
    $output = array_filter($input, criteria_greater_than(3));

    print_r($output); // 大于3的元素

每一个在滤子族的过滤函数接收一个大于某个最小值的值。单个被criteria_greater_than函数返回的过滤器是一个拥有在作用域中被值封闭起来的$min参数的闭包(当criteria_greater_than被调用时作为参数传入)。

为了引入$min变量到创建的函数当中，提前绑定是默认被使用的。事实上，在引入的时候，延迟绑定应该使用引用。想象一个模板或验证库，此时闭包被定义于在作用域中捕捉变量然后当匿名函数执行的时候访问它们。

第一次做翻译，有些地方还是翻译得不太好，希望各位指正。