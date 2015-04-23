---
layout: post
title:  "一步步学习Dwoo模板引擎--前端使用"
date:   '2015-04-23 11:20:41'
author: Hector
categories: PHP
excerpt: 'PHP,Dwoo,模板引擎'
keywords: 'PHP，Dwoo，模板引擎'
tags: [PHP,Dwoo,模板引擎]
---

介绍完如何安装之后，现在来介绍一下前端开发者如何使用Dwoo模板引擎套模板。

##简介
一个模板，简单地说就是一个文本文件。可以生成任意多种文本格式(HTML、XML、TPL等等)。Dwoo没有确定的文件后缀，.html或者.tpl都可以。

一个模板包含在模板运行的时候被替换为确定的值的变量和表达式以及控制模板逻辑的标签。

下面是介绍了一些基础的简易模板。细节的东西稍后附上：

<!--more-->

    <!DOCTYPE html>
    <html>
        <head>
            <title>My Webpage</title>
        </head>
        <body>
            <ul id="navigation">
            {foreach $navigation item}
                <li><a href="{$item.href}">{$item.caption}</a></li>
            {/foreach}
            </ul>

            <h1>My Webpage</h1>
            {$a_variable}
        </body>
    </html>

在Dwoo里，只用一种定界符用来定位变量、表达式以及标签。

##变量
应用程序传送变量到模板，你可以在模板中使用它。变量也许拥有一些你可以访问的属性或者元素。一个变量是怎样的很大程度依赖于应用程序的提供。

你可以使用下标点(.)来访问PHP变量的属性(PHP对象的方法或者属性、数组的项)，或者被称为下标的标签的"[]"。

    {$foo}
    {$foo.bar}
    {$foor['bar']}

##全局变量
下面的变量在模板中是一直有效的。
    
    {$.version} : Dwoo的版本
    {$.ad} : dwoo网站的链接
    {$.now} : 执行页面的请求时间
    {$.charset} : 使用的编码(默认是UTF-8)

你也可以使用下面的访问方式访问PHP中的全局变量。

    {$.get.m}
    {$dwoo.get.m}
    {$dwoo.post.x}
    {$dwoo.session.x}

##函数
函数可以被调用来生成内容。函数通过函数名和括号以及可选参数来调用。

例如date_format函数：

    {date_format "now" "Y-m-j"}

##命名参数
使用命名参数让你的模板有更明确的意义。

    {date_format value="now" format"Y-m-j"}
命名参数也允许你跳过一些你不想改变其默认值的参数。
    
    {date_format format="m/d/y" timestamp=$.now modify="+150 day"}

##注释
如果想在模板中注释一行代码，可以使用这样的语句:`{*...*}`。

这些注释是Dwoo处理的，而且不像HTML注释一样，它不会被输出到浏览器上。

这对于调试或增加一些信息给其他前端使用者或者你自己。

    {* This is a Dwoo comment *}

    {*
     - This is a multi line
     - Dwoo comment!
     *}

    {*
      This is also a comment
    *}

##引入其他模板
include函数对于引入模板和返回另一个模板的渲染内容到当前模板中十分有用。

    {include('header.html')}
有时候也许你需要在不通过Dwoo类的get或output函数来传递数据到页面中就传递参数到其他页面中。下面这个通过作为参数加到函数后面的例子可以实现：
    
    {include(file='site_header.tpl' title='About Us')}

##模板继承
Dwoo最强大的部分就是模板继承。模板继承允许你建立一个基于包含了你网站的所有常用元素和定义一些子模板可以重写的模块的模板骨架。

听起来很复杂但实际上是很简单的。通过使用一个例子学习就能很容易地明白。

定义一个基础模板:base.html。包含了简单的用于显示两列页面的HTML骨架文本。

    <!DOCTYPE html>
    <html>
      <head>
        <title>{block "title"}My site name{/block}</title>
        {* css includes, etc. *}
      </head>
      <body>
        <h1>{block "page-title"}Default page title{/block}</h1>
        <div id="content">
          {block "content"}
            Welcome to my amazing homepage
          {/block}
        </div>
      </body>
    </html>
在这个例子里，模块标签定义了四个子模板可以填充的模块。所有的模块标签用来告诉模板引擎子模板可以覆盖模板的这些部分。

一个字模板可以使这样的：

    {extends "base.html"}

    {block "title"}
    Gallery
    {/block}
可以使用parent方法来渲染父模块的内容。下面这样会返回父模块的结果：
    
    {extends "base.html"}

    {block "title"}Home - {$dwoo.parent}{/block}

##HTML过滤
如果你需要显示HTML的代码，你可以使用escape函数：
    
    {"some <strong>html</strong> tags"|escape}
将输出：
    
    some &lt;strong&gt;html&lt;/strong&gt; tags
