---
layout: post
title:  "说说PHP中foreach引用的一个坑"
date:   '2015-04-25 10:47:41'
author: Hector
categories: PHP
excerpt: 'PHP,foreach,引用,释放引用'
keywords: 'PHP,foreach,引用,释放引用'
tags: [PHP,引用]
---

先来看看下面这段代码：
    
    <?php 
        $arr = array('apple','banana','cat','dog');
        foreach($arr as $key=>$val)
        {
            //some code
        }

        echo $val;  //输出dog
        echo $key;  //输出3

        //下面对val进行赋值
        $val = 'e';
        print_r($arr);  //输出Array ( [0] => apple [1] => banana [2] => cat [3] => dog )

说明：在上面的foreach循环中，当循环结束后，$key和$val变量都不会被自动释放掉。值会被保存下来。而且此时修改$val的值不会影响$arr。

>引用：如果想在遍历数组的过程中修改数组的元素，可以在foreach中对$val使用引用。此时被引用的元素$val指向当前数组元素的内存地址，即共享一段内存地址。因此修改$val的值会同时改变$arr[$key]的值。

再来看看下面一段在foreach中使用引用的代码，这是最近在项目中遇到的一种情况：

    <?php 
        $arr = array('apple','banana','cat','dog');
        //在foreach中使用引用
        foreach($arr as $key => &$val)
        {
            $val = 'new value';
        }

        echo $val;  //输出new value
        echo $key;  //输出3

        $val = 'egg';
        print_r($arr);  //输出Array ( [0] => new value [1] => new value [2] => new value [3] => egg )

说明：在foreach中使用&引用后，当foreach结束后，$key和$val变量也都不会被自动释放掉，但是此时$val和$arr[count($arr) - 1](此处是$arr[3])指向相同的内存地址。因此，此时修改$val的值也会改变了$arr[3]的值。

这种情况下很容易犯的错误就是像上面例子所示，在循环外面继续使用被foreach引用的变量，这样会使开发者得不到预期的数据。因此，为了避免这种情况的发生，应该在适当的位置释放变量的引用。以上面的代码为例：

    <?php 
        $arr = array('apple','banana','cat','dog');
        //在foreach中使用引用
        foreach($arr as $key => &$val)
        {
            $val = 'new value';
        }
        unset($val);

        echo $val;  //报错，Notice: Undefined variable: val
        echo $key;  //输出3

        $val = 'egg'; 
        print_r($arr);  //输出Array ( [0] => new value [1] => new value [2] => new value [3] => new value )
在foreach结束后unset $val，此时会释放对$val的引用。因此改变$val不会对$arr造成影响。

这是最近在项目中遇到的坑和解决方案的总结，如果错误或更好地建议，欢迎指出。