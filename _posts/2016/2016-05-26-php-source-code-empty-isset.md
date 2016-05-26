---
layout: post
title: "[PHP源码阅读]empty和isset函数"
date: '2016-05-26'
author: Hector
categories: PHP
excerpt: 'php,c,PHP源码分析,源码学习,PHP源码,empty源码,isset源码,php empty源码,php isset源码,php源码阅读,PHP源码阅读'
keywords: 'php,c,PHP源码分析,源码学习,PHP源码,empty源码,isset源码,php empty源码,php isset源码,php源码阅读,PHP源码阅读'
---

近日被问到PHP中empty和isset函数时怎么判断变量的，刚开始我是一脸懵逼的，因为我自己也只是一知半解，为了弄懂其真正的原理，赶紧翻开源码研究研究。经过分析可发现两个函数调用的都是同一个函数，因此本文将对两个函数一起分析。

我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/hoohack/read-php-src)。可以通过[commit记录](https://github.com/hoohack/read-php-src/commits/master)查看已添加的注解。

## 函数使用格式

### empty

    bool empty ( mixed $var )


判断变量是否为空。
<!--more-->


### isset

    bool isset ( mixed $var [ , mixed $... ] )

判断变量是否被设置且不为NULL。

## 参数说明

对于empty，在PHP5.5版本以前，empty只支持变量参数，其他类型的参数会导致解析错误，比如函数调用的结果不能作为参数。

对于isset，如果变量被如unset的函数设为NULL，则函数会返回false。如果多个参数被传递到isset函数，那么只有所有参数都被设置isset函数才会返回true。从左到右计算，一旦遇到没被设置的变量就停止。

 

运行示例

    $result = empty(0); // true
    $result = empty(null); // true
    $result = empty(false); // true
    $result = empty(array()); // true
    $result = empty('0'); // true
    $result = empty(1); // false
    $result = empty(callback function); // 报错
    
    $a = null;
    $result = isset($a); // false;
    
    $a = 1;
    $result = isset($a); // true;
    
    $a = 1;$b = 2;$c = 3;
    $result = isset($a, $b, $c); // true
    
    $a = 1;$b = null;$c = 3;
    $result = isset($a, $b, $c); // false

 

找到函数的定义位置

实际上，empty不是一个函数，而是一个语言结构。语言结构是在PHP程序运行前编译好的，因此不能像之前那样简单地搜索**PHP_FUNCTION empty**或**ZEND_FUNCTION empty**查看其源码。要想看empty等语言结构的源码，先要理解PHP代码执行的机制。

PHP执行代码会经过4个步骤，其流程图如下所示：

![PHP执行步骤](http://7u2eqw.com1.z0.glb.clouddn.com/PHP%E6%89%A7%E8%A1%8C%E6%AD%A5%E9%AA%A4.png)




在第一个阶段，即Scanning阶段，程序会扫描**zend_language_scanner.l**文件将代码文件转换成语言片段。对于isset和empty函数来说，在**zend_language_scanner.l**文件中搜索empty和isset可以得到函数在此文件中的宏定义如下：

    <ST_IN_SCRIPTING>"isset" {
    return T_ISSET;
    }
    
    
    <ST_IN_SCRIPTING>"empty" {
    return T_EMPTY;
    }

接下来就到了Parsing阶段，这个阶段，程序将T_ISSET和T_EMPTY等Tokens转换成有意义的表达式，此时会做语法分析，Tokens的yacc保存在zend_language_parser.y文件中，可以找到T_ISSET和T_EMPTY的定义：

    internal_functions_in_yacc:
    T_ISSET '(' isset_variables ')' { $$ = $3; }
    | T_EMPTY '(' variable ')' { zend_do_isset_or_isempty(ZEND_ISEMPTY, &$$, &$3 TSRMLS_CC); }
    | T_INCLUDE expr { zend_do_include_or_eval(ZEND_INCLUDE, &$$, &$2 TSRMLS_CC); }
    | T_INCLUDE_ONCE expr { zend_do_include_or_eval(ZEND_INCLUDE_ONCE, &$$, &$2 TSRMLS_CC); }
    | T_EVAL '(' expr ')' { zend_do_include_or_eval(ZEND_EVAL, &$$, &$3 TSRMLS_CC); }
    | T_REQUIRE expr { zend_do_include_or_eval(ZEND_REQUIRE, &$$, &$2 TSRMLS_CC); }
    | T_REQUIRE_ONCE expr { zend_do_include_or_eval(ZEND_REQUIRE_ONCE, &$$, &$2 TSRMLS_CC); }
    ;

isset和empty函数最终都执行了**zend_do_isset_or_isempty**函数，在源码目录中查找

    grep -rn "zend_do_isset_or_isempty"

可以发现，此函数在zend_compile.c文件中定义。

 

函数执行步骤

> 1、解析参数
> 
> 2、检查是否为可写变量
> 
> 3、如果是变量的op_type是IS_CV（编译时期的变量），则设置其opcode为ZEND_ISSET_ISEMPTY_VAR；否则从active_op_array中获取下一个op值，根据其op值设置last_op的opcode。
> 
> 4、设置了opcode之后，之后会交给zend_excute执行。


## 源码解读

IS_CV是编译器使用的一种cache机制，这种变量保存着它被引用的变量的地址，当一个变量第一次被引用的时候，就会被CV起来，以后这个变量的引用就不需要再去查找active符号表了。

对于empty函数，到了opcode的步骤后，参阅opcode处理函数，可以知道，isset和empty在excute的时候执行的是**ZEND_ISSET_ISEMPTY_VAR**等一系列函数，以**ZEND_ISSET_ISEMPTY_VAR_SPEC_CV_VAR_HANDLER**为例，找到这个函数的定义在**zend_vm_execute.h**。查看函数可以知道，empty函数的最终执行函数是**i_zend_is_true()**，而i_zend_is_true函数定义在**zend_execute.h**。i_zend_is_true函数的核心代码如下：

    

    switch (Z_TYPE_P(op)) {
        case IS_NULL:
            result = 0;
            break;
        case IS_LONG:
        case IS_BOOL:
        case IS_RESOURCE:
            // empty参数为整数时非0的话就为false
            result = (Z_LVAL_P(op)?1:0);
            break;
        case IS_DOUBLE:
            result = (Z_DVAL_P(op) ? 1 : 0);
            break;
        case IS_STRING:
            if (Z_STRLEN_P(op) == 0
                || (Z_STRLEN_P(op)==1 && Z_STRVAL_P(op)[0]=='0')) {
                // empty("0") == true
                result = 0;
            } else {
                result = 1;
            }
            break;
        case IS_ARRAY:
            // empty(array) 是根据数组的数量来判断
            result = (zend_hash_num_elements(Z_ARRVAL_P(op))?1:0);
            break;
        case IS_OBJECT:
            if(IS_ZEND_STD_OBJECT(*op)) {
                TSRMLS_FETCH();
    
                if (Z_OBJ_HT_P(op)->cast_object) {
                    zval tmp;
                    if (Z_OBJ_HT_P(op)->cast_object(op, &tmp, IS_BOOL TSRMLS_CC) == SUCCESS) {
                        result = Z_LVAL(tmp);
                        break;
                    }
                } else if (Z_OBJ_HT_P(op)->get) {
                    zval *tmp = Z_OBJ_HT_P(op)->get(op TSRMLS_CC);
                    if(Z_TYPE_P(tmp) != IS_OBJECT) {
                        /* for safety - avoid loop */
                        convert_to_boolean(tmp);
                        result = Z_LVAL_P(tmp);
                        zval_ptr_dtor(&tmp);
                        break;
                    }
                }
            }
            result = 1;
            break;
        default:
            result = 0;
            break;
    }

这段代码比较直观，函数没有对检测值做任何的转换，通过这段代码来进一步分析示例中的empty函数做分析：
empty(null)，到IS_NULL分支，result=0，i_zend_is_true() == 0，!i_zend_is_true() == 1，因此返回true。

empty(false)，到IS_BOOL分支，result = ZLVAL_P(false) = 0，i_zend_is_true() == 0，!i_zend_is_true() == 1，因此返回true。

empty(array())，到IS_ARRAY分支，result = zend_hash_num_elements(Z_ARRVAL_P(op)) ? 1 : 0)，zend_hash_num_elements返回数组元素的数量，array为空，因此result为0，i_zend_is_true() == 0，!i_zend_is_true() == 1，因此返回true。

empty('0')，到IS_STRING分支，因为Z_STRLENP(op) == 1 且 Z_STRVAL_P(op)[0] == '0'，因此result为0，i_zend_is_true() == 0，!i_zend_is_true() == 1，因此返回true。

empty(1)，到IS_LONG分支，result = Z_LVAL_P(op) = 1，i_zend_is_true == 1，!i_zend_is_true() == 0，因此返回false。

 

对于isset函数，最终实现判断的代码是：

    if (isset && Z_TYPE_PP(value) != IS_NULL) {
        ZVAL_BOOL(&EX_T(opline->result.var).tmp_var, 1);
    } else {
        ZVAL_BOOL(&EX_T(opline->result.var).tmp_var, 0);
    }

只要value被设置了且不为NULL，isset函数就返回true。

 

## 小结

这次阅读这两个函数的源码，学习到了：

1、PHP代码在编译期间的执行步骤

2、如何查找PHP语言结构的源码位置

3、如何查找opcode处理函数的具体函数

学无止境，每个人都有自己的短板，只有通过不断学习才能将自己的短板补上。

 

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^

 

我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/hoohack/read-php-src)。可以通过[commit记录](https://github.com/hoohack/read-php-src/commits/master)查看已添加的注解。


参考文章

opcode处理函数查找：[http://www.laruence.com/2008/06/18/221.html](http://www.laruence.com/2008/06/18/221.html)

PHPopcode深入理解及PHP代码执行步骤：[http://www.php-internals.com/book/?p=chapt02/02-03-03-from-opcode-to-handler](http://www.php-internals.com/book/?p=chapt02/02-03-03-from-opcode-to-handler)

更多源码文章，欢迎访问个人主页继续查看：[hoohack](http://www.hoohack.me)