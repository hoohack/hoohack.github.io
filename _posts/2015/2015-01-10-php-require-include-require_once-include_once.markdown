---
layout: post
title:  "PHP中require、include、require_once和include_once的区别"
date:   '2015-01-10 10:20:41'
author: Hector
categories: PHP
---

之前在做项目和面试的时候都遇到这个问题，也有上网查阅了一些资料，现在自己总结一下以便加深对这个问题的理解程度。

##include
include 语句包含并运行指定文件。

被包含文件先按参数给出的路径寻找，如果没有给出目录（只有文件名）时则按照 include_path 指定的目录寻找。如果在 include_path 下没找到该文
件则 include 最后才在调用脚本文件所在的目录和当前工作目录下寻找。如果最后仍未找到文件则 include 结构会发出一条警告。

<!--more-->

如果定义了路径——不管是绝对路径（在 Windows 下以盘符或者 \ 开头，在 Unix/Linux 下以 / 开头）还是当前目录的相对路径（以 . 或者 .. 开头
）——include_path 都会被完全忽略。例如一个文件以 ../ 开头，则解析器会在当前目录的父目录下寻找该文件。

如果 include 出现于调用文件中的一个函数里，则被调用的文件中所包含的所有代码将表现得如同它们是在该函数内部定义的一样。所以它将遵循该函数
的变量范围。此规则的一个例外是魔术常量，它们是在发生包含之前就已被解析器处理的。

在失败时 include 返回 FALSE 并且发出警告。成功的包含则返回 1，除非在包含文件中另外给出了返回值。

##require
require 和 include 几乎完全一样，除了处理失败的方式不同之外。require 在出错时产生 E_COMPILE_ERROR 级别的错误。换句话说将导致脚本中止
而 include 只产生警告（E_WARNING），脚本会继续运行。

##include_once
include_once 语句在脚本执行期间包含并运行指定文件。此行为和 include 语句类似，唯一区别是如果该文件中已经被包含过，则不会再次包含。如同
此语句名字暗示的那样，只会包含一次。

include_once 可以用于在脚本执行期间同一个文件有可能被包含超过一次的情况下，想确保它只被包含一次以避免函数重定义，变量重新赋值等问题。

##require_once
require_once 语句和 require 语句完全相同，唯一区别是 PHP 会检查该文件是否已经被包含过，如果是则不会再次包含。

##include与require使用方法
require 的使用方法如 `require("./inc.php");`通常放在 PHP 程式的最前面，PHP 程式在执行前，就会先读入 require 所指定引入的档案，使它变成 PHP 程式网页的一部份。
include 使用方法如 `include("./inc/.php");`一般是放在流程控制的处理区段中。PHP 程式网页在读到 include 的档案时，才将它读进来。这种方式，可以把程式执行时的流程简单化。

##include与require区别
除了处理失败的方式不同之外，两者还有以下区别
> * include 只要在被执行时才会读入要包含的文件;而 require 是不管如何都会引入文件(即使在条件为FALSE的时候)。
> * include 执行文件时每次都要进行读取和评估;而 require 执行文件只处理一次(实际上，文件内容替换了require语句)，这就意味着如果有包含这些指令之一的代码和可能执行多次的代码，则使用require()效率比较高。

##require(include)与require_once(include_once)区别
require_once的作用是会检查之前是否加载过该文件,如果没有加载则加载，如果加载过就不再加载，比如某文件定义了一个类型，如果两次加载该文件会出现错误。

那么，使用require还是require_once呢？这是个老问题了。

require和require_once都是PHP函数，开发人员可以使用它们在某个特定的脚本中导入外部PHP文件以供使用。你可以根据应用程序的复杂度调用一次或
若干次require_once/require。使用require（而不是require_once）可以提高应用程序的性能。

由于在导入PHP脚本时将进行大量的操作状态(stat)调用，因此require要快于require_once。如果你请求的文件位于目录/var/shared/htdocs/myapp/
models/MyModels/ClassA.php下，则操作系统会在到达ClassA.php之前的某个目录中运行一次stat调用。在这个例子中，共进行了6次stat调用。当然，
require也会发起stat调用，但是次数较少。越少的函数调用，代码的运行速度越快。

但是，一般情况下，也不太需要去考虑究竟require还是require_once，除非这已经严重影响到你程序的性能了。