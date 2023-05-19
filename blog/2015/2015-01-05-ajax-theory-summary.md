---
layout: post
title:  "AJAX原理总结"
date:   '2015-01-05'
tags: blog
author: hoohack
categories: Javascript
---

###AJAX全称
> Asynchronous JavaScript and XML(异步的JavaScript 和XML)

###同步和异步
异步传输是面向字符的传输，单位是字符

同步传输是面向比特，单位是帧，传输时要求接收方和发送方的时钟是保持一致的。

###通过XMLHTTPRequest理解AJAX
> AJAX原理简单地说就是通过XMLHTTPRequest来向服务器发送异步请求，从服务器获得数据，然后用JavaScript来操作DOM而刷新页面。



####XMLHTTPRequest对象属性
![XMLHTTPRequest对象属性](http://7u2eqw.com1.z0.glb.clouddn.com/XMLHTTPRequest对象属性.png)
[查看大图](https://www.hoohack.me/assets/images/2015_01_05.png)

AJAX就是把JavaScript技术与XMLHTTPRequest对象放在WEB表单和服务器间，当用户向服务器请求时，数据发送给JavaScript代码而不是直接发给服务器，JavaScript代码在幕后发送异步请求，然后服务器将数据返回给JavaScript代码。JavaScript代码接收到数据后，操作DOM来更新页面数据。

###AJAX同步和异步
异步：AJAX一直执行，不发生阻塞等待服务器的响应，因此在使用异步AJAX时，在函数中对变量赋值是没有效的。

同步：AJAX发生阻塞，等待服务器返回数据才能执行下一步。

###AJAX原理图
![AJAX原理图](http://7u2eqw.com1.z0.glb.clouddn.com/ajax.png)
