---
layout: post
title:  "PHP函数--array_map"
date:   '2015-07-16 15:08:37'
author: hoohack
categories: PHP
excerpt: 'php,array_map'
keywords: 'php,array_map'
---

最近开发过程中经常使用到这个函数，这个函数用在不遍历数组而通过回调函数处理数组的每一项很有用。记录一下这个函数的使用以及自己最近常用的功能。

> array_map-将回调函数作用到给定数组的单元上。

##说明

    array_map (callable $callback, array $arr1 [, array $...])

array_map() 返回一个数组，该数组包含了arr1中的所有单元经过callback作用后的单元。callback接受的参数数目应该和传递给array_map()函数的数组数目一样。

<!--more-->

##参数
> * callback 对每个数组的每个元素作用的回调函数

> * arr1 将被回调函数（callback）执行的数组

> * ...(array) 将被回调函数（callback）执行的数组列表

##返回值
返回一个数组，该数组的每个元素都是数组（arr1）里面的每个元素经过回调函数（callback）处理了的。

##使用范例

    1、例子
    <?php
        function cube($n)
        {
            return $n * $n;
        }

        $a = array(1, 2, 3);
        $b = array_map("cube", $a);

        print_r($b); //Array([0] => 1, [1] => 4, [2] => 9)

    二、匿名函数
    <?php
        $func = function ($value) {
            return $value * 2;
        };
        print_r(array_map($func, range(1, 3))); //Array([0] => 2, [1] => 4, [2] => 4)

        //print_r(array_map(function ($value) { return $value * 2; }, range(1, 3))); //Array([0] => 2, [1] => 4, [2] => 4)

    三、使用更多的数组
    <?php
        function show_Spanish($n, $m)
        {
            return("The number $n is called $m in Spanish");
        }

        function map_Spanish($n, $m)
        {
            return(array($n => $m));
        }

        $a = array(1, 2, 3, 4, 5);
        $b = array("uno", "dos", "tres", "cuatro", "cinco");

        $c = array_map("show_Spanish", $a, $b);
        print_r($c);

        $d = array_map("map_Spanish", $a , $b);
        print_r($d);

输出结果:$c

    Array
    (
        [0] => The number 1 is called uno in Spanish
        [1] => The number 2 is called dos in Spanish
        [2] => The number 3 is called tres in Spanish
        [3] => The number 4 is called cuatro in Spanish
        [4] => The number 5 is called cinco in Spanish
    )

$d
    
    Array
    (
        [0] => Array
            (
                [1] => uno
            )
        [1] => Array
            (
                [2] => dos
            )
        [2] => Array
            (
                [3] => tres
            )
        [3] => Array
            (
                [4] => cuatro
            )
        [4] => Array
            (
                [5] => cinco
            )
    )

通常使用了两个或更多数组时，它们的长度应该相同，因为回调函数是平行作用于相应的单元上的。如果数组的长度不同，则最短的一个将被用空的单元扩充。

>本函数一个有趣的用法是构造一个数组的数组，这可以很容易的通过用 NULL 作为回调函数名来实现。

    建立一个数组的数组
    <?php
        $a = array(1, 2, 3);
        $b = array("one", "two", "three");
        $c = array("uno", "dos", "tres");

        $d = array_map(null, $a, $b, $c);
        print_r($d);

    输出
    Array
    (
    [0] => Array
        (
            [0] => 1
            [1] => one
            [2] => uno
        )
    [1] => Array
        (
            [0] => 2
            [1] => two
            [2] => dos
        )
    [2] => Array
        (
            [0] => 3
            [1] => three
            [2] => tres
        )
    )

最近最常用到的是获取一个数组的某一个键值对应的值组成的数组。比如从数据库中获取某个数据表的id，经常会返回以下数组
    
    $arr = array(
        0 => array(
            'id' => 111
        ),
        1 => array(
            'id' => 222
        ),
        2 => array(
            'id' => 333
        )
    );

有时候需要获取数组`$arr`所有单元的`id`组成的数组，以便进行进一步的操作（比如获得这些id数组组成的字符串然后去其他数据表获取更多的数据）。以前的做法会使用一个foreach，然后返回每一项，学习到了array_map函数之后，则可以使用下面的代码。

    <?php
        $id_arr = array_map(function($v) {return $v['id'];}, $arr);
        print_r($id_arr); //Array(0 => '111', 1 => '222', '2' => 333)
