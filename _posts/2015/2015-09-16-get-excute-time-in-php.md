---
layout: post
title:  "在PHP中获取脚本执行时间"
date:   '2015-09-16 15:00:37'
author: Hector
categories: PHP
excerpt: '执行时间,获取脚本执行时间,PHP脚本执行时间'
keywords: '执行时间,获取脚本执行时间,PHP脚本执行时间'
---
首先介绍一个PHP的函数`microtime()`

##microtime函数

> mixed microtime([ bool $get_as_float = false ])

这个函数返回当前的UNIX时间戳和毫秒数。

如果`$get_as_float`被设置为TRUE，那么microtime()会返回float类型的值，否则返回string类型的值。

获取脚本执行时间思路：在脚本开始时使用microtime获取一次时间，在脚本结束时获取再获取一次时间。在获取完时间后需要对结果进行处理，因为该函数返回的字符串使用空格将时间戳和微妙数分割开，所以使用空格分隔字符串，然后将两部分加起来组成一个float类型的值。然后用结束时间减去开始时间就得到脚本执行的时间值。最终要使用什么格式输出看自己的需求选择。

    <?php
        function microtime_float()
        {
             list($u_sec, $sec) = explode(' ', microtime());
             return (floatval($u_sec) + floatval($sec));
        }

        $start_time = microtime_float();

        //do something
        usleep(100);

        $end_time = microtime_float();
        $total_time = $end_time - $start_time;

        $time_cost = sprintf("%.10f", $total_time);

        echo "program cost total " . $time_cost . "s\n";

