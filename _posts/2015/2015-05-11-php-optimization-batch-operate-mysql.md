---
layout: post
title:  "PHP优化之批量操作MySQL"
date:   '2015-05-11 16:34:41'
author: Hector
categories: php
excerpt: 'php优化,优化,批量操作'
keywords: 'php优化,优化,批量操作'
tags: [PHP,PHP优化]
---

设计一个数据表如下:
        
    create table optimization(
        id INT NOT NULL AUTO_INCREMENT,
        value VARCHAR(10) NOT NULL,
        PRIMARY KEY(id)
    );

现在有一个业务需求需要批量插入数据。

先来看看下面这一段代码：

    <?php
        $dsn = 'mysql:dbname=test;host=127.0.0.1';
        $user = 'root';
        $password = 'root';

        try {
            $dbh = new PDO($dsn, $user, $password);
        } catch(PDOException $e) {
            echo 'Connection failed: ' , $e->getMessage();
        }

        $begin = microtime(true) * 1000;

        $count = 100;
        $stmt = $dbh->prepare('INSERT INTO `optimization` (id, value) VALUES(:id, :value)');
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':value', $value);
        for ($i = 0; $i < $count; $i++)
        {
            $id = '';
            $value = $i;
            $stmt->execute();
        }

        $end = microtime(true) * 1000;
        echo 'excuted : ' , ($end - $begin) , ' ms';

经过测试，上面代码运行结果如下：

1、excuted : 7601.4348144531 ms

2、excuted : 7476.4270019531 ms

3、excuted : 7674.4387207031 ms

平均：7584.100179036433 ms

再来看看第二段代码：

    <?php
        $dsn = 'mysql:dbname=test;host=127.0.0.1';
        $user = 'root';
        $password = 'root';

        try {
            $dbh = new PDO($dsn, $user, $password);
        } catch(PDOException $e) {
            echo 'Connection failed: ' , $e->getMessage();
        }

        $begin = microtime(true) * 1000;
        $dbh->beginTransaction();
        try {
            $count = 100;
            $sql = 'INSERT INTO `optimization` (id, value) VALUES ';
            $sql_arr = array();
            $sql_str = '';
            for ($i = 0; $i < $count; $i++)
            {
                $sql_arr[] = ("('', $i)");
            }
            $sql_str = implode(',', $sql_arr);
            $sql .= $sql_str;
            $stmt = $dbh->prepare($sql);
            $stmt->execute();
            $dbh->commit();
        } catch(Exception $e) {
            $dbh->rollBack();
            echo $e->getMessage() . '<br>';
        }

        $end = microtime(true) * 1000;
        echo 'excuted : ' , ($end - $begin) , ' ms';

上面这段代码的运行结果如下：

1、excuted : 99.005859375 ms

2、excuted : 103.00610351562 ms

3、excuted : 68.00390625 ms

平均：90.00528971354 ms

##分析
可以看出，在第二段代码中，使用了批量插入，此时的效率比第一段提高了84%。原因如下：

> * 使用第一段代码的时候，因为每一次循环里都执行了一个mysql语句，此时php需要与mysql获得连接，然后再执行mysql语句，然后再断开。这就是第一段代码最主要的时间开销--PHP与MySQL连接的网络传输IO
> * 第一段代码SQL语句解析的次数更多

因此，在第二段代码中，通过合并SQL语句来实现减少SQL语句解析的次数以及PHP与MySQL连接的次数来达到减少网络传输IO的开销。

注意：
1、SQL语句是有长度限制的，因此，在进行SQL语句合并时务必不能超过SQL长度限制，通过设置max_allowed_packet可以修改，默认是1M，测试时修改为8M。

##总结
>在进行对数据库的批量操作（如：插入、更新、修改）时，应当尽可能将SQL语句合并后再执行而不是在循环中依次执行。

记录下最近在项目中犯下的一个比较大的错误，以后不能再犯了。以前一直都没有注意到，直到现在真正参与到企业项目中，自己的代码被老大指出错误后才发现自己的错误。学习了。

