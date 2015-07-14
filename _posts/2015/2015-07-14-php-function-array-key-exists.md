---
layout: post
title:  "PHP函数--array_key_exists"
date:   '2015-07-14 10:08:37'
author: Hector
categories: php
excerpt: 'php,array_key_exists'
keywords: 'php,array_key_exists'
tags: [php]
---

好记性不如烂笔头，虽然手册上都有函数的说明，但是自己记录一遍的话能记得更加牢固。

##array_key_exists--检查给定的键名或索引是否存在于数组中。

###说明

>bool array_key_exists (mixed $key, array $search)

array_key_exists()在给定的key存在于数组中时返回TRUE。key可以是任何能作为数组索引的值。array_key_exists()也可以用于对象。

<!--more-->

###参数

>key 要检查的键值。

>search 一个数组，包含待检查的键。

###返回值
成功时返回TRUE，或者在失败时返回FALSE。

###使用例子

    <?php
        $search_array = array('first' => 1, 'second' => 4);

        if (array_key_exists('key', $search_array))
        {
            echo "The 'first' element in the array";
        }

###array_key_exists()与isset()的区别
isset()对于数组中为NULL的值不会返回TRUE，而array_key_exists()会。

    <?php
        $search_array = array('first' => null, 'second' => 4);

        var_dump(isset($search_array['first']));    //false

        var_dump(array_key_exists('first', $search_array));

这是在工作中新学到的函数，在此总结。如有好的建议，望指出。