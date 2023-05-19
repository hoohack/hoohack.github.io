---
layout: post
title:  "在OpenSUSE下编译安装Nginx"
date: 2016-01-27
tags: tech
author: hoohack
categories: Nginx
excerpt: '编译安装Nginx,安装Nginx,编译安装Nginx OpenSUSE'
keywords: '编译安装Nginx,安装Nginx,编译安装Nginx OpenSUSE'
---

## 下载源码

在nginx官网上选择稳定的版本[Nginx](http://nginx.org/en/download.html)。解压到`/usr/local/src/`目录。

笔者使用的是nginx-1.9.9。

## 准备工作

> 进入/usr/local/src继续操作)

### 编译安装pcre库

下载:[ftp://ftp.csx.cam.ac.uk/pub/software/programming/pcre/](ftp://ftp.csx.cam.ac.uk/pub/software/programming/pcre/)

安装：



	.configure
	make && make install

高版本会出现`No rule to make target 'libpcre.la`错误，建议选择版本低一些，因为nginx暂不支持，可以使用8.37版本。

编译错误：`'aclocal-1.14' is missing on your system.`

解决：输入命令`touch configure.ac aclocal.m4 configure Makefile.am Makefile.in`，然后重新编译。

### 安装zlib库

下载:[http://zlib.net](http://zlib.net)

安装:

	.configure
	make && make install

### 安装ssl

[http://www.openssl.org/source/](http://www.openssl.org/source/)

解压即可

## 编译安装

### 常用编译选项说明

`--prefix=PATH`： 指定nginx的安装目录。默认`/usr/local/nginx`

`--conf-path=PATH` ： 设置nginx.conf配置文件的路径。nginx允许通过命令行中的`-c`选项使用不同的配置文件启动。默认为`prefix/conf/nginx.conf`

`--with-pcre` ： 设置PCRE库的源码路径

`--with-zlib=PATH` ： 指定 zlib的安装目录。

`--with-http_ssl_module` ： 使用https协议模块。默认情况下，该模块没有被构建。前提是openssl与openssl-devel已安装

`--with-openssl` ：openssl解压目录

`--pid-path`：nginx运行时的进程ID保存目录

### 编译方案

	./configure\
	--sbin-path=/usr/local/nginx/nginx\
	--conf-path=/usr/local/nginx/nginx.conf\
	--pid-path=/usr/local/nginx/nginx.pid\
	--with-http_ssl_module\
	--with-pcre=/usr/local/src/pcre-8.37\
	--with-zlib=/usr/local/src/zlib-1.2.8\
	--with-openssl=/usr/local/src/openssl-1.0.1c

### 编译安装

	make && make install

### 测试安装结果

通过命令`/usr/local/nginx/nginx`运行nginx

在命令行下输入 `netstat -ptnl | grep 'nginx'` 查看nginx是否启动成功

![nginx启动结果](http://7u2eqw.com1.z0.glb.clouddn.com/nginx-start-result.png)

打开浏览器，输入localhost，如果看到下面的Welcome nginx页面说明安装成功了

![Welcome nginx页面](http://7u2eqw.com1.z0.glb.clouddn.com/Nginx-welcome-page.png)

### 添加启动脚本
安装完成后，如果需要在命令行下启动和停止nginx，或者添加开机启动任务，需要添加脚本到`/etc/init.d/`目录。

脚本文件：

	#! /bin/sh

	# Description: Startup script for nginx on CentOS、SuSE、redhat. cp it in /etc/init.d and
	# chkconfig --add nginx &amp;amp;&amp;amp; chkconfig nginx on
	# then you can use server command control nginx
	#
	# chkconfig: 2345 08 99
	# description: Starts, stops nginx

	set -e

	PATH=$PATH:/usr/local/nginx/sbin/
	DESC="nginx daemon"
	NAME=nginx
	DAEMON=/usr/local/nginx/sbin/$NAME
	CONFIGFILE=/usr/local/nginx/conf/nginx.conf
	PIDFILE=/usr/local/nginx/logs/$NAME.pid
	SCRIPTNAME=/etc/init.d/$NAME

	# Gracefully exit if the package has been removed.
	test -x $DAEMON || exit 0

	d_start() {
	    $DAEMON -c $CONFIGFILE || echo -n " already running"
	}

	d_stop() {
	    kill -QUIT `cat $PIDFILE` || echo -n " not running"
	}

	d_reload() {
	    kill -HUP `cat $PIDFILE` || echo -n " can't reload"
	}

	case "$1" in
	    start)
	        echo -n "Starting $DESC: $NAME"
	        d_start
	        echo "."
	        ;;
	    stop)
	        echo -n "Stopping $DESC: $NAME"
	        d_stop
	        echo "."
	        ;;
	    reload)
	        echo -n "Reloading $DESC configuration..."
	        d_reload
	        echo "reloaded."
	        ;;
	    restart)
	        echo -n "Restarting $DESC: $NAME"
	        d_stop
	        sleep 1
	        d_start
	        echo "."
	        ;;
	    *)
	    echo "Usage: $SCRIPTNAME {start|stop|restart|force-reload}" >&2
	    exit 3
	    ;;
	esac

	exit 0

使用方法：

	vim /etc/init.d/nginx
	chmod +x /etc/init.d/nginx
	chkconfig nginx on
	chkconfig --level 2345 nginx on


启动方法：

	service nginx xxx
	/etc/init.d/nginx xxx

参考文章:[openSUSE Nginx 启动脚本](http://www.coffin5257.com/opensuse-nginx-startup-script/)
