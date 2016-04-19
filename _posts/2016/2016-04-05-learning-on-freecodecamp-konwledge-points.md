---
layout: post
title: "FreeCodeCamp学习知识点汇总"
date: '2016-04-05 11:00:00'
author: Hector
categories: 读书笔记
excerpt: 'Javascript,css,learning,freecodecamp'
keywords: 'Javascript,css,learning,freecodecamp'
---

这段时间在FreeCodeCamp这个平台上学习前端知识，上面的练习题都很不错，推荐大家去学习。学习了一段时间，记录下了一些知识点，在这里总结分享。

## arguments数组
当需要使用arguments数组时，最好的方法就是转换成一个新数组。

    var args = Array.prototype.slice.call(arguments);

## 修改字符串中的字符

<!--more-->_

可以新生成字符串变量；或者也可以使用如下方法：

    String.prototype.replaceAt = function(index, character) {
         return this.substr(0, index) + character + this.substr(index + characyer.length);
    }

## javascript加法
遇到数字相加，应该用Number强制转换类型，不然会出现字符串连接的情况。

## No 'Access-Control-Allow-Origin' header is present on the requested resource
把ajax请求的dataType改为JSONP

## CSS画圈
使用一个长宽相同的div，然后border-radius画圆，设置background颜色可以画空心圆，然后绝对定位。

## CSS画搜索图标
一个圈加一条旋转的线。

## input背景透明
`background-color:transparent;`

## 删除空白字符
可以用空字符replace。

## 替换所有出现字符串的单个字符，
使用该字符new一个正则：new RegExp(char, 'g');

## 去除数组的重复元素，
调用filter函数，然后过滤条件是return arr.indexOf(item) === iex;
说明，如果元素第一次出现的位置跟当前位置不一样，说明有重复的元素，那么将其删除掉。

## Objects.keys
Objects.keys只收集自身属性名，不收集继承自原继承链上的。在对象中使用this创建keys。

## 垂直居中
line-height设置为该对象的值

## jQuery ready 方法
语法1：
    
    $(document).ready(_function_)

语法2：

    $().ready(_function_)

语法3：

    $(_function_)

## 阻止元素被选中

    -webkit-user-select: none;/-moz-user-select: none;

