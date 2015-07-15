---
layout: post
title:  "PDO中使用了ATTR_AUTOCOMMIT的一个坑"
date:   '2015-06-25 16:37:41'
author: Hector
categories: php
excerpt: 'php,pdo,ATTR_AUTOCOMMIT'
keywords: 'php,pdo,ATTR_AUTOCOMMIT'
---

很久没有写博客了，最近工作比较多，没有做到一星期至少一文章。在这里记录下开发过程中在PDO里遇到的一个坑。

有一次，在执行数据库的INSERT操作时，返回的插入结果是新增的插入行的ID，但是在数据库里面没有看到插入的记录。查找了数据库的Log发现也没有执行sql的记录。折腾了恒久，然后在配置文件将所有配置去掉之后发现执行成功了。后来逐项配置取消，最后发现是设置了`PDO::ATTR_AUTOCOMMIT => 0`这个选项。于是便上网查找相关原因如下。

<!--more-->

在配置PDO时，设置了一项`PDO::ATTR_AUTOCOMMIT => 0`。阅读PHP手册发现，如果这项设为false，那么PDO将试图禁用自动提交以便数据库连接开始一个事务。然而，通过阅读MYSQL文档发现这么一段话：

>After disabling autocommit mode by setting the autocommit variable to zero, changes to transaction-safe tables (such as those for InnoDB or NDBCLUSTER) are not made permanent immediately. You must use COMMIT to store your changes to disk or ROLLBACK to ignore the changes.

意思是当你设置了autocommit为0时，就会将事务安全的表(如InnoDB或NDBCLUSTER)将会变成非马上提交的。你必须使用COMMIT来保存你的改变到硬盘中或者ROLLBACK来回滚事务。

而UPDATE/INSERT操作会在下面两中情况下被锁住：

> * 在一个事务中

> * 不在事务中而且set autocommit = 0被启用了

所以我使用了ATTR_AUTOCOMMIT来允许PDO对象启用一个事务，我没有在程序里面使用事务语句，但PDO默认认为我使用了事务。这意味着，不管你没有使用事务的查询语句中是否使用了自动提交，PDO都会默认的开启事务，以后所有的SQL都将做为事务处理，直到你用commit确认或rollback结束。因为没有提交事务，所以PDO就没有将需要执行的SQL语句提交到MySQL中，但还是会返回成功插入后的ID，因此数据库里面没有记录。

网上对这个做法的观点不一，但我认为各有各的说法，在实现过程中，只在需要使用事务的时候才使用这个选项，而不是在全局配置中设置就好了。