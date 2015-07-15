---
layout: post
title:  "无限多级分类实现(PHP)"
date:   '2015-01-17 09:46:41'
author: Hector
categories: PHP
---

## 前言
项目中遇到需要实现多级分类的功能，刚开始想通过静态数据的方法，但是后来发现分类需要添加编辑功能，而且当分类很多的时候管理起来也不方便，于是乎就想到了使用数据库的方法。

----

## 数据库设计
tbl_category

<!--more-->

    id          int     not null    auto_increment
    
    cat_id      int     not null
    
    cat_name    varchar not null
    
    parent_id   int     not null

### 说明
> * 如果parent_id为0说明该分类是顶级父节点
> * 如果parent_id不为0说明为孩子节点
> * 如果cat_id不属于parent_id，说明为叶子节点

## 查询算法
    
    首先获取顶级父节点

    根据顶级父节点获取子节点

    遍历所有子节点，如果当前节点有孩子节点

        先把当前孩子节点找出来
    
        再把当前孩子节点的孩子节点找出来
    
        不断重复此步骤，递归实现
    
    否则不做处理

## 代码示例

    $rootArr = getRootCategory();
    
    getChildren($rootArr);
    
    function getChildren(& $rootArr) {
        foreach ($rootArr as &$row) {
            if (haveChildren($row['cat_id'])) {
                $row['children'] = getChildren($row['cat_id']);
                getChildren($row['children']);
            }
        }
    }
    