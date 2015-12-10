---
layout: post
title:  "【nginx配置】nginx做非80端口转发"
date:   '2015-12-10 18:00:37'
author: Hector
categories: Nginx
excerpt: 'Nginx,Nginx配置,Nginx非80端口转发,非80端口转发,端口转发'
keywords: 'Nginx,Nginx配置,Nginx非80端口转发,非80端口转发,端口转发'
---

## 一个场景
最近在使用PHP重写一个使用JAVA写的项目，因为需要查看之前的项目，所以要在本地搭建一个Tomcat来跑JAVA的项目。搭建成功后，因为Tomcat监听的端口是8080，因此，访问的URL前缀是`localhost:8080`，每次访问项目的时候都要先输入这一串内容，感觉比较繁杂，所以想着将其变成`localhost`来访问，但是这样的话就是访问80端口了，要达到目的，就得做端口转发。笔者见识比较少，暂时想到的是使用Nginx/Apache等程序做转发。如果有更好的方案，欢迎指教。

<!--more-->

## 增加Nginx虚拟主机

![nginx配置](http://7u2eqw.com1.z0.glb.clouddn.com/nginx配置.jpg)

要做Nginx的转发，当然就要对Nginx做配置。可以通过添加虚拟主机配置来增强Nginx的功能。首先看看Nginx的配置文件，笔者的Nginx文件是在`/etc/nginx/nginx.conf`。从上图可以看到Nginx在最后引入了`vhosts.d`目录下的配置文件。那么就要在`/etc/nginx/vhosts.d`目录下创建以.conf为后缀的文件（如果该目录不存在需要自己创建）。

## Nginx做非80端口转发
要做转发，可以使用Nginx的`proxy_pass`配置项。Nginx监听80端口，接收到请求之后就会转发到要转发的URL。具体的配置如下:

    server {
        server_name www.test.com
        listen 80;

        location / {
            proxy_pass http://127.0.0.1:8080;
        }
    }

是的，就是这么简单就可以了。这是配置端口转发的核心。

但是，当遇到需要获取真实IP的业务时，还需要添加关于真实IP的配置：

    server {
        server_name www.test.com
        listen 80;

        location / {
            proxy_pass http://127.0.0.1:8080;
            proxy_set_header Host $host:80;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }

`proxy_set_header`这句配置是改变http的请求头。而Host是请求的主机名，`X-Real-IP`是请求的真实IP，`X-Forwarded-For`表示请求是由谁发起的。

## 小结
这次的配置可能对大部分人来说都很简单，但是笔者刚接触Nginx配置这一块，因此记录下来，分享给有需要的人。如有建议和批评，欢迎指出。通过这次的学习发现，Nginx的配置是很值得学习的。