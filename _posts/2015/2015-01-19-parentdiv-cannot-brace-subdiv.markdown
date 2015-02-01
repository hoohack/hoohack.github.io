---
layout: post
title:  "父DIV浮动后无法撑开子DIV的解决方案"
date:   '2015-01-19 14:46:41'
author: Hector
categories: CSS
tags: [css,浮动]
---

直奔主题。
有这样一段代码
    
    <div id="parent">
        <div id="sub">DIV2</div>
        DIV1
     </div>

很多时候我们期望实现下图的效果：

<!--more-->

![期望效果](http://7u2eqw.com1.z0.glb.clouddn.com/parentDIV-subDIV_actural.png)

于是添加如下样式:

    #parent {
      background-color: #0086B3;
      width: 100%;
      height: auto;
    }

    #sub {
      background-color: #009926;
      float: left;
      width: 80%;
      height: auto;
    }

但是却得到下图所示的效果：

![父DIV无法撑开子DIV示例](http://7u2eqw.com1.z0.glb.clouddn.com/parentDIV-subDIV.png)

如图所示，DIV1里面嵌有DIV2，DIV2被设置浮动了，而此时DIV1无法被完全撑开，即DIV2相当于浮动在页面上，与DIV1不再同一个层面上，导致DIV2无法把DIV1撑开。

## 原因
由于DIV2浮动，它不再属于标准流，DIV1自己组成了标准流，而浮动是漂浮在标准流之上的，因此DIV2就挡住了DIV1。

## 解决方案

### 第一种：在浮动结束的容器(此处为sub)后面加上这段代码

    <div style="clear: both"></div>
    
意思是清除浮动。这样后面的DIV就不会继承这个浮动。

### 第二种：在父DIV(此处为DIV1)加上的样式加上:

    overflow: auto;
    
## 总结
这2种方法都可以实现DIV2把DIV1撑开。不过在此建议使用第一种解决方案，要养成一个习惯，在浮动使用完后消除浮动，这样后面的DIV就不会继承这个浮动（就像在操作数据库的时候，在打开数据库，操作完后，要养成个习惯在后面把数据库关闭）。也就是说浮动这个属性会被继承，除非消除这个浮动，才不会让后面接着的DIV受到继承。其实不仅是DIV，其他的像P等其他的容器都会有继承的效应，大家要养成一个消除浮动的习惯。