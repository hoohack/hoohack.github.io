---
layout: post
title:  "PHP-explode以及implode函数"
date:   '2015-07-09'
tags: tech
author: hoohack
categories: PHP
excerpt: 'php,implode,explode'
keywords: 'php,implode,explode'
---

##implode--将一个一维数组的值转化为字符串。

###函数说明

`string implode ( string $glue , array $pieces )`

`string implode ( array $pieces )`

###参数
>glue 连接符，默认为空的字符串

>pices 你想要转换的数组



###返回值
>返回一个字符串，其内容由glue分割开的数组。

###使用例子

    <?php
        $arr = array('apple', 'banana', 'cat');
        $result = implode(',', $arr);

        echo $result;   //apple,banana,cat

###扩展使用
>如果调用implode函数时传入了string而不是array，函数会返回NULL

    <?php
        var_dump(implode(':', 'xxxx')); //NULL

>如果你想合并一个包含booleans值的数组，你会得到一个奇怪的结果

    <?php
        var_dump(implode('', array(true, true, false, false, true)));   //"111"

##explode--使用一个字符串分隔另一个字符串

###函数说明

`array explode ( string $delimiter , string $string [, int $limit ] )`

此函数返回由字符串组成的数组，每个元素都是string的子串，它们被字符串delimiter作为边界点分隔出来。

###参数

>delimiter 边界上的分隔字符

>string 输入的字符串

>limit

>如果设置了limit参数并且是正数，则返回的数组包含最多limit个元素，而最后的那个元素将包含string的剩余部分。
>如果limit参数是负数，则返回除了最后的-limit个元素外的所有元素。
>如果limit是0，则会被当做1。

###返回值
>此函数返回由字符串组成的数组，每个元素都是string的一个子串，它们被字符串delimiter作为边界点分隔出来。

>如果delimiter为空字符串`("")`，explode()将返回FALSE。如果delimiter所包含的值在string中找不到，并且使用了负数的limit，那么会返回空的array，否则返回包含string单个元素的数组。

###使用例子

    一
    <?php
        $people = "teacher student";
        $arr = explode(' ', $people);

        echo $arr[0];   //teacher
        echo $arr[1];   //student

    二
    //如果字符串中不包含用于分隔的字符，那么函数将直接返回只包含一个原字符串的数组
    <?php
        $input = 'hello';
        $input2 = 'hello,world';
        print_r(explode($input));  //array([0] => "hello")
        print_r(explode($input2));  //array([0] => "hello", [1] => "world")

    三
    //limit参数例子
    <?php
        $str = 'one|two|three';

        //正数(小于结果总数)
        //输出 array([0] => "one", [1] => "two")
        print_r(explode('|', $str, 2));

        //正数(大于结果总数)
        //输出 array([0] => "one", [1] => "two", [2] => "three")
        print_r(explode('|', $str, 4));

        //负数
        //输出 array([0] => "one", [1] => "two")
        print_r(explode('|', $str, -1));

###扩展使用
>如果一个字符串有多个分隔符，而且此字符串需要被分隔，那么可以先替换所有的分隔符为其中一个，然后再进行分隔。

    <?php
        function multiExplode($delimiters, $string)
        {
            $ready = str_replace($delimiters, $delimiters[0], $string);
            $launch = explode($delimiters[0], $ready);
            return $launch;
        }

        $text = "here is a sample: this text, and this will be exploded. this also | this one too :)";
        $exploded = multiexplode(array(",",".","|",":"),$text);

>如果分隔的字符串是空的，将会得到一个包含一个空元素的数组。解决这个问题，只需要使用没有回调函数参数的array_filter函数。但是，没有回调函数的array_filter会移除等于`FALSE`的元素。那么，如果字符串包含元素0的话，也会被移除了。因此，如果真的需要移除空元素，应该在`array_filter`里添加`strlen`作为回调函数。

    <?php
        $str = "";
        $result = explode(',', $str);
        print_r($result);   //array([0] => )

        print_r(array_filter(explode(',', $str)));  //array()

        print_r(array_filter(explode(':', "1:2::3:0:4"), 'strlen'));

>移除分隔后每个元素两边的空白。

    <?php
        $str="one  ,two  ,       three  ,  four    ";
        array_map('trim', explode(',', $str));
