---
layout: post
title:  "在php中使用array_values函数调整数组键值"
date:   '2015-08-03 18:28:37'
author: hoohack
categories: PHP
excerpt: 'PHP,array_values,调整数组键值'
keywords: 'PHP,array_values,php 调整数组键值'
---

来看看这段代码。

    <?php
        $arr = array('a', 'b', 'c', '', 'd', '', 'e');

        print_r($arr);

        $filter_arr = array_filter($arr);

        print_r($filter_arr);

上面这段程序的运行结果是这样的

<!--more-->

    $arr
    Array ( [0] => a [1] => b [2] => c [3] => [4] => d [5] => [6] => e )

    $filter_arr
    Array ( [0] => a [1] => b [2] => c [4] => d [6] => e )

当在纯数字键值的数组中进行了元素删除操作的同时，也将数组元素的键值删去了，而且在PHP中不会将数组键值重新调整。那么当需要在删除操作之后再次利用到数组的下标时就不能使用到正确的下标了。

比如说$arr是从一个字符串分割得到的数据数组，然后需要去除掉空值后继续使用，此时使用$arr[3]希望得到d。但是因为数组的下标已经被打乱了，因此只能得到空值。

这个问题的解决方案就是使用array_values函数。先看看此函数的定义。

##array_values
    返回数组中所有的值

    array array_values (array $input)

array_values() 返回 input 数组中所有的值并给其建立数字索引。但不保留键名。被返回的数组将使用数值键，并从0开始且以1递增。

这个函数正好解决了上面的问题。那么来验证一下这个函数的效果。

    <?php
        $arr = array('a', 'b', 'c', '', 'd', '', 'e');

        print_r($arr);

        $filter_arr = array_values(array_filter($arr));

        print_r($filter_arr);

上面代码运行的结果是：

    Array ( [0] => a [1] => b [2] => c [3] => d [4] => e )
