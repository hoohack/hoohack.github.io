---
layout: post
title:  "PHP是怎么运行的"
date:   '2015-09-02 17:00:37'
author: Hector
categories: PHP
excerpt: 'PHP执行原理,PHP如何运行,PHP内核'
keywords: 'PHP执行原理,PHP如何运行,PHP内核'
---

这篇文章，研究一下PHP代码是如何解释和执行以及PHP脚本运行的生命周期。

##概述
PHP服务的启动。严格来说，PHP的相关进程是不需要手动启动的，它是随着Apache的启动而运行的。当然，如果有需要重启PHP服务的情况下也是可以手动重启PHP服务的。比如说在有开启opcode的正式环境更新了代码之后，需要重启PHP以重新编译PHP代码。

从宏观上来看，PHP内核的实现就是接收输入的数据，内部做相应的处理然后输出结果。对于PHP内核来说，我们编写的PHP代码就是内核接收的输入数据，PHP内核接收代码数据后，对我们编写的的代码进行代码解析和运算执行，最后返回相应的运算结果。

<!--more-->

然而，不同于平时的C语言代码，要执行PHP代码，首先需要将PHP代码“翻译”成机器语言来执行相应的功能。而要执行“翻译”这个步骤，就需要PHP内核进行：词法分析、语法分析等步骤。最后交给PHP内核的Zend Engine进行顺次的执行。

###词法分析
     将PHP代码分隔成一个个的“单元”（TOKEN）

###语法分析
     将“单元”转换为Zend Engine可执行的操作

###Zend Engine执行
     对语法分析得到的操作进行顺次的执行

一切PHP程序（CGI/CLI）的开始都是从SAPI（Server Application Programming Interface）接口开始。SAPI指的是PHP具体应用的编程接口。例如Apache的mod_php。

PHP开始执行以后会经过两个主要的阶段：处理请求之前的开始阶段和请求之后的结束阶段。

##开始阶段
PHP的整一个开始阶段会经历模块初始化和模块激活两个阶段。

###MINIT
    即模块初始化阶段，发生在Apache/Nginx启动以后的整个生命周期或者命令行程序整个执行过程中，此阶段只进行一次

###RINIT
    模块激活，发生在请求阶段。做一些初始化工作：如注册常量、定义模块使用的类等等

模块在实现时可以通过如下宏来实现这些回调函数：
    
    PHP_MINIT_FUNCTION(myphpextension)
    {
         //注册常量或者类等初始化操作
         return SUCCESS;
    }

    PHP_RINIT_FUNCTION(myphpextension)
    {
         //例如记录请求开始时间
         //随后在请求结束的时候记录结束时间。这样我们就能够记录处理请求所花费时间了
         return SUCCESS;
    }

PHP脚本请求处理完就进入了结束阶段，一般脚本执行到末尾或者调用exit或die函数，PHP就进入结束阶段。

##结束阶段
PHP的结束阶段分为停用模块和关闭模块两个环节。

###RSHUTDOWN
    停用模块（对应RINIT）

###MSHUTDOWN
    关闭模块（对应MINIT）

CLI/CGI模式的PHP属于单进程的SAPI模式。意思就是说，PHP脚本在执行一次之后就关闭掉，所有的变量和函数都不能继续使用。即在CGI模式下，同一个php文件的变量在其他php文件中不能使用。

下面用一个例子看看单线程PHP的SAPI生命周期。

##单线程SAPI生命周期
如：`php -f test.php`

    调用各个扩展的MINIT 模块初始化
        请求test.php
            调用各个扩展的RINIT 模块激活
                执行test.php
            调用各个扩展的RSHUTDOWN 停用模块
        执行完test.php后清理变量和内存
    调用各个扩展的MSHUTDOWN 关闭模块
    停止PHP执行

以上是一个简单的执行流程，下面做一些补充。

PHP在调用每个模块的模块初始化前，会有一个初始化的过程，包括：
    
###初始化若干全局变量
    大多数情况下是将其设置为NULL。

###初始化若干常量
    这里的常量是PHP自身的一些常量。

###初始化Zend引擎和核心组件
    这里的初始化操作包括内存管理初始化、全局使用的函数指针初始化，对PHP源文件进行词法分析、语法分析、中间代码执行的函数指针的赋值，初始化若干HashTable（比如函数表，常量表等等），为ini文件解析做准备，为PHP源文件解析做准备，注册内置函数、标准常量、GLOBALS全局变量等

###解析php.ini
    读取php.ini文件，设置配置参数，加载zend扩展并注册PHP扩展函数。

###全局操作函数的初始化
初始化在用户空间所使用频率很高的一些全局变量，如：$\_GET、$\_POST、$\_FILES 等。

###初始化静态构建的模块和共享模块(MINIT)
初始化默认加载的模块。
         模块初始化执行操作：
               将模块注册到已注册模块列表
               将每个模块中包含的函数注册到函数表

###禁用函数和类
会调用zend_disable_function函数将PHP的配置文件中的disable_functions变量代表的函数从CG(function_table)函数表中删除。

###激活Zend引擎
使用init_compiler函数来初始化编译器。

###激活SAPI
使用sapi_activate函数来初始化SG(sapi_headers)和SG(request_info)，并且针对HTTP请求的方法设置一些内容。

###环境初始化
初始化在用户控件需要用到的一些环境变量。包括服务器环境、请求数据环境等。

###模块请求初始化
PHP调用zend_activate_modules函数遍历注册在module_registry变量中的所有模块，调用其RINIT方法方法实现模块的请求初始化操作。

在处理了文件相关的内容后，PHP会调用php_request_startup做请求初始化操作：

    激活Zend引擎
    激活SAPI
    环境初始化
    模块请求初始化

##代码的运行
以上所有准备工作完成后，就开始执行PHP程序。PHP通过zend_compile_file做词法分析、语法分析和中间代码生成操作，返回此文件的所有中间代码。如果解析的文件有生成有效的中间代码，则调用zend_excute执行中间代码。。如果在执行过程中出现异常并且用户有定义对这些异常的处理，则调用这些异常处理函数。在所有的操作都处理完后，PHP通过EG(return_value_ptr_ptr)返回结果。

##DEACTIVATION(关闭请求)
PHP关闭请求的过程是一个若干个关闭操作的集合，这个集合存在于php_request_shutdown函数中。这个包括：

> * 调用所有通过register_shutdown_function()注册的函数。这些在关闭时调用的函数是在用户空间添加进来的。
> * 执行所有可用的__destruct函数。这里的析构函数包括在对象池（EG(objects_store）中的所有对象的析构函数以及EG(symbol_table)中各个元素的析构方法。 
> * 将所有的输出刷出去。 
> * 发送HTTP应答头。
> * 销毁全局变量表（PG(http_globals)）的变量。 
> * 通过zend_deactivate函数，关闭词法分析器、语法分析器和中间代码执行器。 
> * 调用每个扩展的post-RSHUTDOWN函数。只是基本每个扩展的post_deactivate_func函数指针都是NULL。 
关闭SAPI，通过sapi_deactivate销毁SG(sapi_headers)、SG(request_info)等的内容。 
> * 关闭流的包装器、关闭流的过滤器。 
> * 关闭内存管理。 
> * 重新设置最大执行时间 

##结束
PHP结束一个进程是，会调用sapi_flush函数将最后的内容刷新出去。然后调用zend_shutdown函数关闭Zend引擎。

参考：[http://www.php-internals.com/book/](http://www.php-internals.com/book/)