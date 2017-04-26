---
layout: post
title: "［PDO绑定参数］使用PHP的PDO扩展进行批量更新操作"
date: '2016-04-25 11:30:00'
author: hoohack
categories: PHP
excerpt: 'PDO批量更新,PDO批量操作,PDO IN 语句,PDO IN statement,绑定参数,PDO绑定参数,PHP bindParam,bindParam'
keywords: 'PDO批量更新,PDO批量操作,PDO IN 语句,PDO IN statement,绑定参数,PDO绑定参数,PHP bindParam,bindParam'
---

最近有一个批量更新数据库表中某几个字段的需求，在做这个需求的时候，使用了PDO做参数绑定，其中遇到了一个坑。

## 方案选择
笔者已知的做批量更新有以下几种方案：

1、逐条更新
> 这种是最简单的方案，但无疑也是效率最低的方案。

2、CASE WHEN

类似如下的语句

    UPDATE tbl_test SET val = CASE id WHEN 1 THEN 2 WHEN 2 THEN 3 END WHERE id IN(1, 2);
PDO绑定参数

为了防止SQL注入，使用了PDO扩展绑定参数。上面的数字在一般情况下是变量，那么就需要做参数绑定。刚开始是想着在IN的时候将id组成的字符串作为变量绑定过去，第一次实现的代码如下：

<!--more-->

    <?php
        $data = array(array('id' => 1, 'val' => 2), array('id' => 2, 'val' => 3));
        $ids = implode(',', array_map(function($v) {return $v['id'];}, $data)); //获取ID数组
        $update_sql = 'UPDATE tbl_test SET val = CASE id';
        $params = array();
        $params[":ids"] = $ids;
        foreach($data as $key => $item) {
                $update_sql .= "WHEN :id_" . $key . "THEN :val_" . $key . " ";
                $params[":id_" . $key] = $item['id'];
                $params[":val_" . $key] = $item['val'];
        }
        $update_sql .= "END WHERE id IN (:_ids)";
        TEST::execute($update_sql, $params);//此处会调用bindParam绑定参数

后来发现这样是行不通的，而且比较诡异的是这样只能更新第一条记录。查阅资料后，发现这样的绑定方式是不行的，IN语句的参数应该一个一个地绑定。看看文档中对bindParam函数的描述：

![PDO描述](http://7u2eqw.com1.z0.glb.clouddn.com/PDO%E6%8F%8F%E8%BF%B0)

修改后的写法：

    <?php
         $data = array(array('id' => 1, 'val' => 2), array('id' => 2, 'val' => 3));
         $update_sql = 'UPDATE tbl_test SET val = CASE id';
         $params = array();
         $params[":ids"] = $ids;
         $in_arr = array();

         foreach($data as $key => $item) {
                 $update_sql .= "WHEN :id_" . $key . "THEN :val_" . $key . " ";
                 $params[":id_" . $key] = $item['id'];
                 $params[":val_" . $key] = $item['val'];
                 $params[":ids_" . $key] = $item['id'];
                 array_push($in_arr, ":id_" . $key);
         }
         $update_sql .= "END WHERE id IN (" . implode(',' $in_arr) . ")";
         TEST::execute($update_sql, $params);//此处会调用bindParam绑定参数
         
## 总结
这是最近遇到的一个小问题，其实更多的是说明在MySQL的IN语句里面做参数绑定时应该一个一个的绑定。

参考链接：
[mysql语句：批量更新多条记录的不同值](http://www.ghugo.com/update-multiple-rows-with-different-values-and-a-single-sql-query/)
[Can I bind an array to an IN() condition?](http://stackoverflow.com/questions/920353/can-i-bind-an-array-to-an-in-conditionhttp://stackoverflow.com/questions/920353/can-i-bind-an-array-to-an-in-condition)

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐，写文章不容易。
