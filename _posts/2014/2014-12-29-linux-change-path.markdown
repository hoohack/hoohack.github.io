---
layout: post
title:  "Linux修改环境变量"
date:   '2014-12-29 04:46:41'
author: Hector
categories: Linux
---

> 在Linux操作系统中，有时候跟着教程安装了一些软件，安装成功后，很高兴的准备运行该软件相应命令，但是偶尔会遇到"Command not found..."的提示。原因是因为你安装的软件需要设置环境变量才能运行。

在Linux操作系统下修改环境变量有以下三种方法(以设置jekyll的环境变量为例)

**1、直接赋值**

在命令行中输入

    PATH=$PATH:/usr/lib64/ruby/gems/2.1.0/gems/jekyll-2.5.3/bin
    
<!--more-->    
使用这种方法，只对当前会话有效，也就是说每当登出或注销系统后，PATH设置就会失效。

**2、修改/ect/profile文件**

在文件末尾添加

    export PATH=$PATH:/usr/lib64/ruby/gems/2.1.0/gems/jekyll-2.5.3/bin //注意："="号的两边不能有任何空格
这种方法最好，除非你手动强制修改PATH的值，否则将不会被改变。

**3、修改.bachrc/.bash_profile文件**

在文件末尾添加

    export PATH=$PATH:/usr/lib64/ruby/gems/2.1.0/gems/jekyll-2.5.3/bin
    
这种方法是针对当前用户起作用的，当你注销系统后也会失效

>注：对于2,3方法，想让PATH生效，必须重新登陆才能实现，以下方法可以简化工作：
如果修改了/etc/profile，那么编辑结束后执行
```source profile```
>或执行点命令``./profile``
>PATH的值就会立即生效了。
这个方法的原理就是再执行一次/etc/profile shell脚本，注意如果用sh /etc/profile是不行
的，因为sh是在子shell进程中执行的，即使PATH改变了也不会反应到当前环境中，但是source是
在当前 shell进程中执行的，所以我们能看到PATH的改变。