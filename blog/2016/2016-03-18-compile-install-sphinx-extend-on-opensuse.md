---
layout: post
title: "在OpenSUSE上编译安装sphinx扩展"
date: 2016-03-18
tags: tech
author: hoohack
categories: PHP
excerpt: 'PHP,PHP扩展,sphinx php安装,sphinx,SphinxClient,sphinx扩展,Opensuse安装sphinx扩展，Unable to load dynamic library'
keywords: 'PHP,PHP扩展,sphinx php安装,sphinx,SphinxClient,sphinx扩展,Opensuse安装sphinx扩展，Unable to load dynamic library'
---

## 准备工作
要在PHP中安装sphinx扩展，你必须先安装好sphinx，笔者使用的是中文分词，因此我安装的是coreseek。

如何安装coreseek请看：[http://www.coreseek.cn/products-install/install_on_bsd_linux/](http://www.coreseek.cn/products-install/install_on_bsd_linux/)

## 安装过程
安装过程：

1、安装libsphinclient



2、安装PHP sphinx扩展模块

3、PHP配置

4、测试

### 安装libsphinxclient
进入coreseek的代码目录

    cd /usr/local/src/coreseek-4.1-beta/csft-4.1/api/libsphinxclient
    ./configure  --prefix=/usr/local/sphinx
    make && make install

### 安装PHP sphinx扩展模块
下载地址：[https://pecl.php.net/package/sphinx](https://pecl.php.net/package/sphinx)。下载你想要的版本。

    tar -zxvf sphinx-1.3.3.tgz
    cd sphinx-1.3.3
    /usr/local/php/bin/phpize
    ./configure --with-php-config=/usr/local/php/bin/php-config --with-sphinx=/usr/local/sphinx/
    make && make install

### PHP配置
修改php.ini文件，将`extension=sphinx.so`添加到扩展选项部分。

### 测试安装结果
重启php，输入`php -m | grep 'sphinx'`查看是否安装成功。

![sphinx-result](http://7u2eqw.com1.z0.glb.clouddn.com/sphinx-result.png)

## 错误解决
在安装的过程中，遇到一个比较二的错误。加了`extension=sphinx.so`，运行`php -m`的时候一直报错。错误信息如下:

> PHP Warning:  PHP Startup: Unable to load dynamic library '/usr/local/php/lib/php/extensions/no-debug-non-zts-20100525/sphinx.so' - libsphinxclient-0.0.1.so: cannot open shared object file: No such file or directory in Unknown on line 0

上面的错误是软件无法加载依赖库，但是之前安装的`libsphinxclient`依赖库是存在的。于是我就找了旁边的同事帮我看，然后其实同事也不懂，但是呢，他跟我一起思考，他叫我一起看看日志文件，一起想出哪一步出错了。我们发现，安装前几步没有问题，一直到要安装的软件找不到某个依赖库才出错，那需要的库安装在哪呢，在那个地方吗？因此找一下，发现，在呀，然后我看到错误显示的路径时，突然恍然大悟，这个软件从哪里搜索这个库呢？会不会是另一个目录呢？然后看一下配置文件，发现真的是搜索的地方错误了啊，因为电脑是64位的，因此之前安装依赖的时候安装到了64位的库了，而安装的扩展是从32的库目录寻找依赖库的。问题终于解决。

## 总结
在opensuse下，很多时候安装和搜索依赖库的目录是不一致的，应当仔细检查。在解决问题的时候，如果花了很多时间都解决不了，这个时候，找一个人，把你遇到的问题清楚地描述一遍，然后一起解决，也许他不懂，但是他思考的方向也许是你忽略掉的，然而他会引导你往一个新的方向思考，然后你就会发现你忽略了一些东西，这个时候，问题就解决了，别人可能没有做任何事情，只是跟你聊聊天，问题就解决了。所以往往会遇到谢谢别人别人都不知道你感谢他什么。

**原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。**

**如果你觉得本文对你有帮助或者觉得不错，望点下推荐，写文章不容易。**
