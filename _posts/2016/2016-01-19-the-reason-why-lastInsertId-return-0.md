---
layout: post
title:  "【PDO扩展】lastInsertId函数返回0的原因"
date:   '2016-01-19 17:00:00'
author: hoohack
categories: PHP
excerpt: 'lastInsertId函数返回0的原因,PHP,PDO,lastInsertId retur 0,lastinsertid return 0,lastInsertId,lastInsertId always return 0,为什么lastInsertId返回0'
keywords: 'lastInsertId函数返回0的原因,PHP,PDO,lastInsertId retur 0,lastinsertid return 0,lastInsertId,lastInsertId always return 0,为什么lastInsertId返回0'
---

## 问题

在使用PHP的PDO扩展插入数据的时候，有时候需要获取到最后插入记录的ID作为返回信息。要怎么才能实现这个需求呢？

## lastInsertId函数

> 使用PDO的lastInsertId函数。

但是，最近在使用的过程中发现有时候lastInsertId函数返回的是0。为什么会这样呢？

先来看看lastInsertId函数在[PHP手册](http://php.net/manual/zh/pdo.lastinsertid.php)上的说明。

<!--more-->

> 返回最后插入行的ID或序列值。

再来看看下面的几个例子。

## 测试例子

### 主键是ID字段，使用自增约束。

![测试数据库表建表语句1](http://7u2eqw.com1.z0.glb.clouddn.com/%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE%E5%BA%93%E8%A1%A8%E5%BB%BA%E8%A1%A8%E8%AF%AD%E5%8F%A51.png)
    
    <?php
        $dsn = 'mysql:dbname=test;host=127.0.0.1';
        $user = 'root';
        $password = 'root';

        try{
                $dbh = new PDO($dsn, $user, $password);
        }catch(PDOException $e){
                echo "Connection failed: " . $e->getMessage();
        }

        for( $i = 0; $i < 10; $i++){
                $sql = 'INSERT INTO `tbl_test` (id, name) VALUE (:id, :name)';
                $data = array(
                        ':id' => '',
                        ':name' => "user_$i"
                );
                $sth = $dbh->prepare($sql);
                $sth->execute($data);
        }

        $sql = 'INSERT INTO `tbl_test` (id, name) VALUE (:id, :name)';
        $new_data = array(
                ':id' => '',
                ':name' => 'user_new'
        );
        $sth = $dbh->prepare($sql);
        $sth->execute($new_data);
        $last_id = $dbh->lastInsertId();
        echo 'last id: ' . $last_id;

结果

> last id: 11

### 主键是ID字段，不使用自增约束。

![测试数据库表建表语句2](http://7u2eqw.com1.z0.glb.clouddn.com/%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE%E5%BA%93%E8%A1%A8%E5%BB%BA%E8%A1%A8%E8%AF%AD%E5%8F%A52.png)

    <?php
        $dsn = 'mysql:dbname=test;host=127.0.0.1';
        $user = 'root';
        $password = 'root';

        try{
                $dbh = new PDO($dsn, $user, $password);
        }catch(PDOException $e){
                echo "Connection failed: " . $e->getMessage();
        }

        for( $i = 0; $i < 10; $i++){
                $sql = 'INSERT INTO `tbl_test` (id, name) VALUE (:id, :name)';
                $data = array(
                        ':id' => $i,
                        ':name' => "user_$i"
                );
                $sth = $dbh->prepare($sql);
                $sth->execute($data);
        }

        $sql = 'INSERT INTO `tbl_test` (id, name) VALUE (:id, :name)';
        $new_data = array(
                ':id' => '',
                ':name' => 'user_new'
        );
        $sth = $dbh->prepare($sql);
        $sth->execute($new_data);
        $last_id = $dbh->lastInsertId();
        echo 'last id: ' . $last_id;

结果

> last id: 0

### 主键不是ID字段，主键使用自增约束。

![测试数据库表建表语句3](http://7u2eqw.com1.z0.glb.clouddn.com/%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE%E5%BA%93%E8%A1%A8%E5%BB%BA%E8%A1%A8%E8%AF%AD%E5%8F%A53.png)

    <?php
        $dsn = 'mysql:dbname=test;host=127.0.0.1';
        $user = 'root';
        $password = 'root';

        try{
                $dbh = new PDO($dsn, $user, $password);
        }catch(PDOException $e){
                echo "Connection failed: " . $e->getMessage();
        }

        for( $i = 0; $i < 10; $i++){
                $sql = 'INSERT INTO `tbl_test` (tbl_id, name) VALUE (:tbl_id, :name)';
                $data = array(
                        ':tbl_id' => $i,
                        ':name' => "user_$i"
                );
                $sth = $dbh->prepare($sql);
                $sth->execute($data);
        }

        $sql = 'INSERT INTO `tbl_test` (tbl_id, name) VALUE (:tbl_id, :name)';
        $new_data = array(
                ':tbl_id' => '',
                ':name' => 'user_new'
        );
        $sth = $dbh->prepare($sql);
        $sth->execute($new_data);
        $last_id = $dbh->lastInsertId();
        echo 'last id: ' . $last_id;

结果

> last id: 11

### 主键不是ID字段，不使用自增约束。

![测试数据库表建表语句4](http://7u2eqw.com1.z0.glb.clouddn.com/%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE%E5%BA%93%E8%A1%A8%E5%BB%BA%E8%A1%A8%E8%AF%AD%E5%8F%A54.png)

    <?php
        $dsn = 'mysql:dbname=test;host=127.0.0.1';
        $user = 'root';
        $password = 'root';

        try{
                $dbh = new PDO($dsn, $user, $password);
        }catch(PDOException $e){
                echo "Connection failed: " . $e->getMessage();
        }

        for( $i = 0; $i < 10; $i++){
                $sql = 'INSERT INTO `tbl_test` (tbl_id, name) VALUE (:tbl_id, :name)';
                $data = array(
                        ':tbl_id' => uniqid(),
                        ':name' => "user_$i"
                );
                $sth = $dbh->prepare($sql);
                $sth->execute($data);
        }

        $sql = 'INSERT INTO `tbl_test` (tbl_id, name) VALUE (:tbl_id, :name)';
        $new_data = array(
                ':tbl_id' => uniqid(),
                ':name' => 'user_new'
        );
        $sth = $dbh->prepare($sql);
        $sth->execute($new_data);
        $last_id = $dbh->lastInsertId();
        echo 'last id: ' . $last_id;

结果

> last id: 0

## 查看PHP源码
可以看到，有些例子返回0，有些例子返回最新的ID。那么lastInsertId什么情况下会返回0呢？在网上搜了很多资料，并没有发现想要的答案，翻开PHP源码，发现函数`last_insert_id`的实现源码是这样的：

![函数last_insert_id源码](http://7u2eqw.com1.z0.glb.clouddn.com/%E5%87%BD%E6%95%B0last_insert_id%E6%BA%90%E7%A0%81.jpg)

可以看到，函数返回的id的值是调用mysql api中的`mysql_insert_id`函数返回的值。

## 查看mysql手册
翻开mysql手册，在[这里](http://dev.mysql.com/doc/refman/5.6/en/getting-unique-id.html)找到这一段：

> mysql_insert_id() returns the value stored into an AUTO_INCREMENT column, whether that value is automatically generated by storing NULL or 0 or was specified as an explicit value. LAST_INSERT_ID() returns only automatically generated AUTO_INCREMENT values. If you store an explicit value other than NULL or 0, it does not affect the value returned by LAST_INSERT_ID().

## 结论
从手册的描述可以知道，`mysql_insert_id`函数返回的是储存在有`AUTO_INCREMENT`约束的字段的值，如果表中的字段不使用`AUTO_INCREMENT`约束或者使用自己生成的唯一值插入，那么该函数不会返回你所存储的值，而是返回NULL或0。因此，在没有使用AUTO_INCREMENT约束的表中，或者ID是自己生成的唯一ID，lastInsertId函数返回的都是0。

## 解决方案
那么，有没有另一种方法可以帮助我们判断程序执行插入是否成功呢？答案是有的。在PDO执行了excecute之后，调用PDO实例的rowCount函数可以得到执行之后的影响行数，如果结果非0，那么说明数据库插入操作执行成功了。下面这个解决方案的一小段demo：

    $sql = 'INSERT INTO `tbl_test` (tbl_id, name) VALUE (:tbl_id, :name)';
    $new_data = array(
            ':tbl_id' => uniqid(),
            ':name' => 'user_another'
    );
    $sth = $dbh->prepare($sql);
    $sth->execute($new_data);
    $row_count = $sth->rowCount();
    if( $row_count ){
        echo 'execute success';
    } else{
        echo 'execute failed';
    }

本文探讨一个问题出现的原因和一个解决方案，由于个人水平有限，如有更好的方法或者其他建议和批评，欢迎指出。

注：本文使用的是PHP5.4.15，MySQL5.5.41。

