---
layout: post
title:  "【nwjs开发】使用nw.js开发桌面应用程序"
date:   '2015-12-23 19:00:37'
author: Hector
categories: javascript,nw.js
excerpt: 'node-webkit,javascript,nw.js,开发桌面程序,nwjs开发,nwjs'
keywords: 'node-webkit,javascript,nw.js,开发桌面程序,nwjs开发,nwjs'
---

## 需求
最近将自己的工作环境切换成Linux(OpenSUSE)+Windows虚拟机。然而，在开发过程中经常需要切换hosts来切换开发环境，之前在Windows下使用的是SwitchHosts，然而，它的Linux版本并不是很好地兼容（我试过一次安装失败后就没有再尝试）。于是乎就想自己模仿它开发一个来玩玩。

## 为什么选择nw.js
开发这个的目标是使其能在Linux和Windows下都能兼容地运行。于是当时想到了python，然而无奈发现文档比较晦涩难懂，于是向朋友请教之下得知了node-webkit（现在已更名为nw.js）这个玩意。而且发现它的逻辑使用node-js写的，刚好可以接触一下这个很火的玩意，于是果断选择了使用nw.js来做这次的开发框架。

在这里说一句，很庆幸在成长路上遇到各种良师益友为我指点迷津，跟他们一起解决问题、讨论技术以及请教他们，这样的过程很开心。有一群基友真的好重要。-.-

## nw.js简介
简单的来说，nw.js是基于Chromium和node-js的app运行环境。你可以编写HTML页面作为“前端”，然后编写JavaScript作为“后台”来运行。你也可以在DOM里面直接调用node-js的模块，也可以调用本地资源。开发它就相当于开发一个WEB应用，只不过你可以去掉URL框，这样看起来就跟桌面应用一样了。听起来好酷吧？而且最重要的是，因为使用了Chromium和Node.js的跨平台性，因此nw.js也是跨平台的。

## 开发环境搭建
nw.js开发环境的搭建可以参考[nw.js在github上的项目](https://github.com/nwjs/nw.js/)。这里就不重述了。

## 开发遇到问题总结

## 打包nw.js程序
开发完毕后，就需要将应用打包。

### Linux

在Linux下，推荐使用一下的脚本。

    #!/bin/bash
    # 应用名称
    name="SwitchHosts"
    # 项目所在目录
    dir="/home/hector/SideProject/SwitchHosts"

    # nw.js的源码路径
    linux_nw_tarfile="/home/hector/Downloads/nwjs-v0.12.3-linux-x64.tar.gz"

    # 创建app.nw文件
    cd $dir
    zip -r app.nw ./*
    #zip -r ${PWD##*/}.nw *
    nw_file=${dir}/app.nw

    echo "creating linux execute file..."
    tar -xvf $linux_nw_tarfile -C ./
    tardir=${linux_nw_tarfile%.tar*} && tardir=${tardir##*/} # rename tardir
    mv  $tardir ${name}_linux && cd ${name}_linux
    cat nw $nw_file > ${name} && chmod +x ${name}
    rm -rf nw nwsnapshot credits.html
    cd ..
    echo "create linux app success!"
    # remove app.nw 
    rm -f SwitchHosts.nw

然后就可以运行了。

### Windows

在Windows下，参考了这篇文章。[用node-webkit把web应用打包成桌面应用](http://www.cnblogs.com/2050/p/3543011.html)

步骤如下：
> 将项目文件夹下面的所有文件压缩为app.zip文件
> 将app.zip文件更名为app.nw
> 下载Windows版本的nw.js，并解压
> 将刚刚打包生成的app.nw文件放入到上一个步骤解压的目录
> 打开windows的cmd，进入上一个步骤的目录，运行 copy /b nw.ext+app.nw app.exe
> 下载安装[Enigma Virtual Box](http://enigmaprotector.com/en/aboutvb.html)
> 在Enter Input File Name输入app.exe的路径,在Enter Output File Name那里填入要打包出来的可执行文件
> 把运行app.exe所需的其他文件(ffmpegsumo.dll、icudt.dll、libEGL.dll、libGLESv2.dll、nw.pak)拖入的Files里面
> 点击右下角的Process按钮，大功告成

你也可以参考[用node-webkit(NW.js)创建桌面程序](http://www.cnblogs.com/soaringEveryday/p/4950088.html)制作成安装程序。

## 下载使用
本次开发的SwitchHosts软件可提供下载，各位如果感兴趣的话可以下载使用，并将更多建议和错误报告给鄙人。谢谢。

[下载链接](http://pan.baidu.com/s/1sj9q8H3)

## 总结
