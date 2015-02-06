---
layout: post
title:  "PHP过滤HTML数据"
date:   '2015-02-05 18:46:41'
author: Hector
categories: PHP
tags: [PHP,Filter]
---

## 分享两个过滤HTML标签的方法。

### 一、使用正则表达式过滤html标签

    $html_data = "<a href="#">www.aintnot.com</a>";
    preg_replace("/(</?)(w+)([^>]*>)/e", "'\1'.strtoupper('\2').'\3'", $html_data);
    
### 二、PHP内置函数strip_tags

#### 函数说明

<!--more-->

> string strip_tags ( string $str [, string $allowable_tags ] )

#### 使用示例代码

    $str = "<a href='#'>www.aintnot.com</a><img src=''><p>hello</p>";
    
    $newStr = strip_tags($str);                               //过滤所有html标签
    
    $strNoImg = strip_tags($str,"<a>");                       //仅过滤(某种标签，这里是a)标签
    
    $multiStr = strip_tags($str,"<a><p>");                    //过滤多种标签
   
#### 过滤`&nbsp;`
使用上面的函数时无法过滤`&nbsp;`等转义字符（即HTML中的空格）。因为strip_tags的话只能过滤html的标签，而\&nbsp;不属于html标签。如果需要过滤这个字符时，应该使用正则替换
    
    preg_replace('/&nbsp;/', '', $str);