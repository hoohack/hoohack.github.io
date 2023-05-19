---
layout: post
title:  "MySQL LEFT JOIN, RIGHT JOIN INNER JOIN区别分析"
date:   '2015-07-21'
tags: tech
author: hoohack
categories: MySQL
excerpt: 'mysql,join,left join,right join,inner join'
keywords: 'mysql,join,left join,right join,inner join'
---

在参与中大型的项目开发中，所用的数据表比较多，如果需要在两张有联系的表中查找数据，那么就需要用到`JOIN`关键字。一般来说都会直接使用JOIN，但是有时候看到同事或其他开发者会使用LEFT JOIN，刚开始不以为然，没有深入思考，然而，经过了一段时间，发现越来越多的代码都是如此，于是乎就觉得必须好好学习一下，以下是学习得到的总结。

##JOIN的定义

> * 内联结：将两个表中存在联结关系的字段符合联结关系的那些记录形成记录集的联结。
> * 外联结：左外联结和右外联结
    左外联结A、B表的意思就是以表A为基础，将表A中的全部记录和B中符合条件的记录联结起来。最后的结果中，A的记录将全部显示出来，而B则只会显示符合搜索条件的记录。B中记录不足的地方均为NULL。
    右外联结可以看做是左外联结的相反。是以B表为基础。右外联结A、B跟左外联结B、A的结果是一样的。



##JOIN的用法
假设有两个表A和B，它们的表结构和字段为：

表A

    aID aMonth
    1   01
    2   02
    3   03
    4   04
    5   05

表B

    bID bName
    1   Jan
    2   Feb
    3   Mar
    4   April
    6   June

###LEFT JOIN
    
    SELECT *
    FROM A LEFT JOIN B
    ON A.aID = B.bID

结果如下

    aID aMonth bID  bName
    1   01      1   Jan
    2   02      2   Feb
    3   03      3   Mar
    4   04      4   April
    5   05      NULL NULL

结果说明

> 因为A中05记录的aID没有在B中找到有对应的bID，因此为NULL。

###RIGHT JOIN

    SELECT *
    FROM A RIGHT JOIN B
    ON A.aID = B.bID

结果如下：

    aID aMonth bID  bName
    1   01      1   Jan
    2   02      2   Feb
    3   03      3   Mar
    4   04      4   April
    NULL NULL   6   June

###INNER JOIN

    SELECT *
    FROM A INNER JOIN B
    ON A.aID = B.bID

结果如下：

    aID aMonth bID  bName
    1   01      1   Jan
    2   02      2   Feb
    3   03      3   Mar
    4   04      4   April

###隐式的内联结

    SELECT *
    FROM A,B
    WHERE A.aID = B.bID

结果说明，`INNER JOIN`只显示A.aID=B.bID的结果。说明INNER JOIN只显示符合条件的记录。

注：
NATURAL JOIN等价于INNER JOIN

    
