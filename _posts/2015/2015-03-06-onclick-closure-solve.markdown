---
layout: post
title:  "Javascript中使用onclick函数时的闭包问题解决"
date:   '2015-03-05 21:46:41'
author: Hector
categories: Javascript
---

在Javascript函数中，经常有遇到闭包的情况。

如下面的代码

    for (var i = 0; i < arr.length; i++) {
        arr[i].onclick = function() {
            console.log(i);
        };
    }

此时输出的i的值全都是arr.length的值，因为出现了闭包。

<!--more-->

解决方法：
## 一、将i保存在每个数组对象中
    
    for (var i = 0; i < arr.length; i++) {
        arr[i].i = i;
        arr[i].onclick = function() {
            console.log(this.i);
        }
    }
    
## 二、将i保存在匿名函数自身
    
    for (var i = 0; i < arr.length; i++) {
        (arr[i].onclick = function() {
            console.log(arguments.callee.i);
        }).i = i;
    }
    
## 三、添加一层闭包(作为形参)

    for (var i = 0; i < arr.length; i++) {
        (function(arg) {
            arr[i].onclick = function() {
                console.log(arg);
            }
        })(i);
    }

## 四、加以层闭包(作为变量)

    for (var i = 0; i < arr.length; i++) {
        (function(arg) {
            var temp = i;
            arr[i].onclick = function() {
                console.log(temp);
            }
        })();
    }
     
在这里记录下解决方案，以便以后查阅。如有错误之处或更多建议，请指出。