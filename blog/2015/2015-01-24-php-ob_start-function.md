---
layout: post
title:  "谈谈PHP中ob_start()函数的用法"
date:   '2015-01-24'
tags: tech
author: hoohack
categories: PHP
---

## ob_start
> 打开输出控制缓存

## 官网文档说明

    bool ob_start ([ callback $output_callback [, int $chunk_size [, bool $erase ]]] )
    
此函数将打开输出缓冲。当输出缓冲激活后，脚本将不会输出内容（除http标头外），相反需要输出的内容被存储在内部缓冲区中。（因此可选择回调函数用于处理输出结果信息）



该函数可以让你自由地控制脚本中数据的输出。比如可以用在输出静态化页面上。而且，当你想在数据已经输出后，再输出文件头的情况。输出控制函数不对使用 header() 或 setcookie(), 发送的文件头信息产生影响,只对那些类似于 echo() 和 PHP 代码的数据块有作用。原因是当打开了缓冲区，echo后面的字符不会输出到浏览器，而是保留在服务器，直到你使用flush或者ob_end_flush才会输出，所以并不会有任何文件头输出的错误。

## 相关函数

ob_end_flush — 冲刷出（送出）输出缓冲区内容并关闭缓冲

ob_clean — 清空（擦掉）输出缓冲区

ob_end_clean — 清空（擦除）缓冲区并关闭输出缓冲

ob_flush — 冲刷出（送出）输出缓冲区中的内容

ob_get_contents — 返回输出缓冲区的内容

## 使用示例:

    //缓冲区F
    1.ob_start();             //缓冲区A
    2.echo 'level 1<br />';
    3.ob_start();             //缓冲区B
    4.echo 'level 2<br />';
    5.ob_start();             //缓冲区C
    6.echo 'level 3<br />';
    7.ob_end_clean();
    8.ob_end_flush();
    9.ob_end_clean();
    10.$str = ob_get_contents();
    11.echo $str;
    
运行结果：`没有输出任何东西`

## 运行过程
可以把整个缓冲区看作一个栈，有新的缓冲区被创建，则新的缓冲区成为栈顶缓冲区。有新内容输出则输出内容会被输出到栈顶的缓冲区。

本程序缓冲区层次：
    
    C->B->A->F
    
初始F:null

运行`1.ob_start();`后，新建缓冲区A，此时整个缓冲区情况

> A:null->F:null

运行`2.echo 'level 1<br />';`后

内容输出到缓冲区A，此时整个缓冲区情况

> A:'level 1<br /\>' -> F:null

运行`3.ob_start();`后，新建缓冲区B，此时整个缓冲区情况

> B:null -> A:'level 1<br /\>' -> F:null

运行`4.echo 'level 1<br /\>';`后

内容输出到缓冲区B，此时整个缓冲区情况

> B:'level 2<br /\>' -> A: 'level 1<br /\>' -> F:null

以此类推建立缓冲区C，运行到`6.echo 'level 3<br />';`后，此时整个缓冲区情况

> C:'level 3<br /\>' -> B:'level 2<br /\>' -> A: 'level 1<br /\>' -> F:null

接着运行`7.ob_end_clean();`，缓冲区C被清空且关闭，此时缓冲区情况

> B:'level 2<br /\>' -> A: 'level 1<br /\>' -> F:null

接着运行`8.ob_end_flush();`，缓冲区B的内容输出到上一级的缓冲区且缓冲区B被关闭。此时缓冲区情况

> A: 'level 2<br /\> level 1<br /\>' -> F:null

接着运行`9.ob_end_clean();`，缓冲区A被情况且关闭。A的内容还没有真正输出到缓冲区F中就被关闭了，最后只剩F:null，因此程序就没有任何输出了。

## 注意事项
当在输出图片前使用了ob_start()函数，由于有缓冲的缘故所以图片无法正常显示，应该先清除缓冲区再输出图片。
    
