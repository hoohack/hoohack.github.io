---
layout: post
title:  "如何在openSUSE42.1下编译安装PHP7"
date:   '2015-12-24'
tags: blog
author: hoohack
categories: PHP
excerpt: '编译安装PHP,编译安装PHP7,PHP编译配置文件,configure: error: Cannot find pspell,openSUSE编译安装PHP,openSUSE编译安装PHP7,opensuse编译安装PHP'
keywords: '编译安装PHP,编译安装PHP7,PHP编译配置文件,configure: error: Cannot find pspell,openSUSE编译安装PHP,openSUSE编译安装PHP7,opensuse42.1编译安装PHP'
---

首先推荐一篇文章[PHP 7 Release Date Arrived: Will Developers Adopt PHP 7? - PHP Classes blog](http://www.phpclasses.org/blog/post/333-PHP-7-Release-Date-Arrived-Will-Developers-Adopt-PHP-7.html)。

里面说到是否会去使用PHP7，就个人而言，我是毫不犹豫地使用的，但是生产环境就不是我说了算，所以只能自己在自己的开发环境里更新PHP的版本。那么，你呢？

笔者使用的是Linux的openSUSE42.1发行版，Yast里面还没有PHP7的安装包，于是乎只能自己手动编译安装了。作为一个PHP开发者，我是非常希望能够学会编译安装PHP7的，之前试过几次，但是每次安装都要上网找各种资料，于是乎，这次安装成功后就想把自己的安装过程以及遇到的问题记录下来，方便以后查阅和分享给需要的人。

## 下载源码并解压
进入正题，要编译安装PHP7,首先当然要下载PHP7的源码。你可以到[github](https://github.com/php/php-src)上clone，也可以到[PHP官网](http://php.net/downloads.php)下载。下载后解压到`/usr/local/src`目录，并将目录重命名为php7。进入目录。



## 配置编译参数
### 生成配置文件
    
    ./buildconf

### 配置

    ./configure \
    --prefix=/usr/local/php7 \
    --exec-prefix=/usr/local/php7 \
    --bindir=/usr/local/php7/bin \
    --sbindir=/usr/local/php7/sbin \
    --includedir=/usr/local/php7/include \
    --libdir=/usr/local/php7/lib/php \
    --mandir=/usr/local/php7/php/man \
    --with-config-file-path=/usr/local/php7/etc \
    --with-mysql-sock=/var/run/mysql/mysql.sock \
    --with-mcrypt=/usr/include \
    --with-mhash \
    --with-openssl \
    --with-mysqli=shared,mysqlnd \
    --with-pdo-mysql=shared,mysqlnd \
    --with-gd \
    --with-iconv \
    --with-zlib \
    --enable-zip \
    --enable-inline-optimization \
    --disable-debug \
    --disable-rpath \
    --enable-shared \
    --enable-xml \
    --enable-bcmath \
    --enable-shmop \
    --enable-sysvsem \
    --enable-mbregex \
    --enable-mbstring \
    --enable-ftp \
    --enable-gd-native-ttf \
    --enable-pcntl \
    --enable-sockets \
    --with-xmlrpc \
    --enable-soap \
    --without-pear \
    --with-gettext \
    --enable-session \
    --with-curl \
    --with-jpeg-dir \
    --with-freetype-dir \
    --enable-opcache \
    --enable-fpm \
    --disable-cgi \
    --with-fpm-user=nginx \
    --with-fpm-group=nginx \
    --without-gdbm \
    --disable-fileinfo

> 参数说明
> prefix PHP7安装的根目录
> with-config-file-path PHP7的配置文件目录

执行完上面的配置命令后的结果如下图所示：

![安装PHPconfigure结果](http://7u2eqw.com1.z0.glb.clouddn.com/php7-configure-result.png)

执行上面命令的过程中会遇到一些依赖缺少的提示，下面列出我遇到的依赖问题：

错误：

>configure: error: xml2-config not found. Please check your libxml2 installation.

解决：

> zypper install libxml2-devel

错误：

> configure: WARNING: unrecognized options: --with-mysql

解决：

> 取消这个选项，这个选项是不存在的

错误：
> configure: error: jpeglib.h not found.

解决：

> zypper install libjpeg-devel

错误：

> configure: error: mcrypt.h not found. Please reinstall libmcrypt.

解决：

> zypper install libmcrypt-devel

错误：

> configure: error: Cannot find pspell

解决：

> 取消该选项

错误：

>checking for recode support... yes
>configure: error: Can not find recode.h anywhere under /usr /usr/local /usr /opt.

解决：

> zypper install librecode-devel

总的来说，在配置的时候遇到没有的就打开Yast搜一下，如果有的话就安装，然后重新编译看还需要那些，如果在Yast找不到，那就上网找一下Google。

## 编译和安装PHP7
    
    make && make install

> 其中，make之后可以选择make test。只是一个可选步骤，不执行不知道有什么问题，不过笔者暂时还没遇到。

## 查看安装成功后的PHP7目录
编译安装成功后，查看PHP7的安装目录`ls /usr/local/php7`：

![PHP7安装目录](http://7u2eqw.com1.z0.glb.clouddn.com/php-installed-dir.png)

## 设置PHP7的配置文件

    cp /usr/local/src/php7/php.ini-production /usr/local/php7/etc/php.ini
    cp /usr/local/src/php7/sapi/fpm/init.d.php-fpm /etc/init.d/php-fpm
    cp /usr/local/php7/etc/php-fpm.conf.default /usr/local/php7/etc/php-fpm.conf
    cp /usr/local/php7/etc/php-fpm.d/www.conf.default /usr/local/php7/etc/php-fpm.d/www.conf

## 添加环境变量
在/etc/profile 文件的最后一行加上

    export PATH=/usr/local/php7/bin:/usr/local/php7/sbin:$PATH

然后执行`source /etc/profile`

## 设置PHP日志目录和php-fpm进程文件（php-fpm.sock）目录
    
    mkdir -p /var/log/php-fpm/ && mkdir -p /var/run/php-fpm && cd /var/run/ && chown -R nginx:nginx php-fpm

## 将PHP设置为开机启动

    chmod +x /etc/init.d/php-fpm
    chkconfig php-fpm on

> 可以用chkconfig命令查看开机启动服务列表。

## 启动PHP服务

    service php-fpm start

> 通过`ps aux | grep 'php'`查看PHP是否启动成功

![PHP启动](http://7u2eqw.com1.z0.glb.clouddn.com/php-run.png)

至此，PHP7就安装成功了，你也开始使用PHP7吧！
