---
layout: post
title:  "AJAX跨域请求----JSONP"
date:   '2015-01-07 14:15:41'
author: Hector
categories: AJAX
tags: [jsonp原理]
---

##JSONP是什么
[JSONP](http://zh.wikipedia.org/wiki/JSONP)（JSON with Padding）是资料格式 JSON 的一种“使用模式”，可以让网页从别的网域要资料。可以理解成填充了内容的json格式数据。

##跨域是什么
简单理解，当a.com/get.html文件需要获取b.com/data.html文件中的数据，而这里a.com和b.com并不是同一台服务器，这就是跨域。
引用一个表格，看看引起跨域的条件:
<!--more-->

![跨域条件表格](http://7u2eqw.com1.z0.glb.clouddn.com/cross-domain.png)

##JSONP是怎么产生的
> 因为AJAX无法实现跨域请求，凡事WEB页面中调用JavaScript文件不受是否跨域影响。于是判断，是否能通过纯WEB端跨域访问数据，只有一种可能，即在远程服务器上
设法把数据装入JavaScript格式的文件里，供客户端调用和进一步处理。因为JSON格式可以很方便地在客户端和服务器使用，所以有以下方案：
    WEB客户端通过与调用脚本一模一样的方式，来调用跨域服务器上动态生成的JavaScript格式文件，显而易见，服务器之所以要动态生成JSON文件，目的就
    在于把客户端需要的数据装入进入。客户端接收到数据后就按照自己的需求进行处理和展现。久而久之，为了便于客户端使用数据，逐渐地形成一个非正式
    传输协议，成为JSONP。

##基本原理
简单地说就是动态添加一个\<script\>标签，而script标签的src属性是没有跨域的限制的。

##要点
允许用户传递一个callback参数给服务端，服务端返回数据时会将这个callback参数作为函数名来包裹JSON数据，这样客户端就可以随意定制自己的函数来自动处理返回数据了。

##缺点
只支持GET请求

##执行过程
在客户端注册一个callback函数，然后把callback的名字传给服务器。客户端接收到服务器返回的callback函数后，以JavaScript语法的形式生成给一个function，function名字就是服务器返回的参数的值。
最后将JSON数据直接以入参的方式，放置到function中，这样就生成了一堆JavaScript代码，返回给客户端。

##示例
说了那么多，还是看看代码实现。
    现在http://www.a.com/index.html想获取http://www.b.com的航班信息数据，JavaScript代码如下
    
    //得到航班信息查询结果后的回调函数
    var flightHandler = function(data){
        alert('你查询的' + data.code + '航班结果是：票价 ' + data.price + ' 元，' + '余票 ' + data.tickets + ' 张。');
    };
    
    // 提供jsonp服务的url地址（不管是什么类型的地址，最终生成的返回值都是一段javascript代码）
    var url = "http://localhost/jsonp.php?code=CA1998&callback=flightHandler";
    
    // 创建script标签，设置其属性
    var script = document.createElement('script');
    script.setAttribute('src', url);
    
    // 把script标签加入head，此时调用开始
    document.getElementsByTagName('head')[0].appendChild(script);
    
服务端(PHP)代码
    
    <?php
    	//php服务端
    	if (isset($_GET['callback']) && !empty($_GET['callback'])) {
    		echo $_GET['callback'] . '({"code":"CA1998","price":1780,"tickets":5})';
    	}
