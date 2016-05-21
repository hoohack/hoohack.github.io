---
layout: post
title: "［PHP源码阅读］explode和implode函数"
date: '2016-05-20'
author: Hector
categories: PHP
excerpt: 'php,c,源码分析,源码学习,PHP源码,explode源码,implode源码,php explode源码,php源码阅读,PHP源码阅读'
keywords: 'php,c,源码分析,源码学习,PHP源码,explode源码,implode源码,php explode源码,php源码阅读,PHP源码阅读'
---

explode和implode函数主要用作字符串和数组间转换的操作，比如获取一段参数后根据某个字符分割字符串，或者将一个数组的结果使用一个字符合并成一个字符串输出。在PHP中经常会用到这两个函数，因此有必要了解一下其原理。

## explode

    array explode ( string $delimiter, string $string, [ , $limit ] )
    
函数返回由字符串组成的数组，每个元素都是string的一个子串，被字符串$delimiter作为边界点分割出来。

### 参数说明
**limit**

如果设置了limit，且为正数，则返回的数组最多包含limit个元素，最后的那个元素将包含string的剩余部分。

如果limit是负数，则返回除了最后的-$limit个元素外的所有元素。

<!--more-->

如果limit是0，则会被当做1。

**delimiter**

如果delimiter为空，则函数返回FALSE。如果delimiter不在string中，且limit为负数，则返回空数组。

### 运行示例

    $str = 'hello,world,heiheihei,php';

先来看看不设置limit的情况

    $arr = explode(',', $str);
    print_r($arr);

![运行结果1](http://7u2eqw.com1.z0.glb.clouddn.com/6796-30c49b2b3d81bfb051e254017e4d76c4.jpg)

limit为正数时，limit设为1，最多返回1个元素。

    $arr = explode(',', $str, 1);
    print_r($arr);

![运行结果2](http://7u2eqw.com1.z0.glb.clouddn.com/4358-6ad1b98442b3ef5ea3d67b674b125713.jpg)

limit为负数，limit为-1，返回最后的1个元素外的所有元素。

    $arr = explode(',', $str, -1);
    print_r($arr);

![运行结果3](http://7u2eqw.com1.z0.glb.clouddn.com/4967-2e536e38a07189ef6dfc98509247c2c7.jpg)
    
limit为0，当作1处理。

    $arr = explode(',', $str, 0);
    print_r($arr);

![运行结果4](http://7u2eqw.com1.z0.glb.clouddn.com/4358-6ad1b98442b3ef5ea3d67b674b125713.jpg)

### explode执行步骤

> 1、接收参数，处理参数为空的情况
> 
> 2、创建函数中使用的局部变量
> 
> 3、根据limit的值调用不同的函数分隔字符串

[explode][1]函数的核心实现是[php_explode][2]函数，下面是该函数的执行流程图：

![explode流程](http://7u2eqw.com1.z0.glb.clouddn.com/explode.png)

php_explode函数核心代码：

    if (p2 == NULL) {
            // 找不到分隔符，直接返回整个字符串
        add_next_index_stringl(return_value, p1, Z_STRLEN_P(str), 1);
    } else {
        do {
            // 将p1添加到return_value数组中
            add_next_index_stringl(return_value, p1, p2 - p1, 1);
            p1 = p2 + Z_STRLEN_P(delim);
        } while ((p2 = php_memnstr(p1, Z_STRVAL_P(delim), Z_STRLEN_P(delim), endp)) != NULL &&
                 --limit > 1);
    
        // 将最后一个值添加到return_value
        if (p1 <= endp)
            add_next_index_stringl(return_value, p1, endp-p1, 1);
    }

### 源码解读
**sizeof("") == 0**。sizeof有两种用法，**sizeof(typename)**和**sizeof(expression)**，当参数为typename是，即类型名称，sizeof返回类型对应对象的大小；当参数为表达式时，sizeof计算表达式的返回类型对应对象的大小。此处，""是表达式，sizeof计算编译时编译器分配给""的空间，此时要算上\0的长度，因此是1，而strlen函数不会计算`\0`。

如果不设置limit，limit的默认值是**LONG_MAX**。在php.h文件中，LONG_MAX定义为2147483647L。

在实现里面，如果limit大于1，则调用**php_explode**函数；如果limit小于0，则调用**php_explode_negative_limit**函数；如果limit等于0，则被当做1处理，此时调用**add_index_stringl**函数将str添加到数组return_value中。

在查找分隔符delimiter时，调用了**php_memnstr**函数
 php_memnstr(Z_STRVAL_P(str), Z_STRVAL_P(delim), Z_STRLEN_P(delim), endp); 
而php_memnstr是**zend_memnstr**的宏定义，zend_memnstr实现里面，因此实际上是调用了C里面的memchr来查找字符delimiter。

找到分隔符的位置之后，就调用**add_next_index_stringl**函数将分隔得到的字符串插入到返回数组里。

## implode

    string implode ( string $glue, array $pieces )
    string implode ( array $pieces )

将一个一维数组的值转换为字符串

### 参数说明
implode函数可以接收两种参数顺序。另外，如果第一个参数为数组而第二个参数为空，则第二个参数为默认值''。此函数可以看作是explode的逆向过程。

当然，使用文档规定的顺序可避免混淆。

### 运行示例

    $arr = array('hello', 'world');

 

按照文档顺序参数

    $str = implode('-‘, $arr);// 输出"hello-world"

 

第一个参数为数组

    $str = implode($arr); // 输出"helloworld"
    $str = implode($arr, '-'); // 输出"hello-world"

 

### implode执行步骤

> 1、接收参数并赋值
> 2、如果第二个参数为空，则判断第一个参数的类型是否为数组，如果不是，则报错。否则，则使用""对glue赋值，使用其作为连接符。
> 3、如果第二个参数不为空，那么，如果第一个参数是数组类型，则将第二个参数转换成字符串类型；否则，如果第二个参数是数组类型，则将第一个参数转换成字符串类型。
> 4、调用php_implode函数做字符串的连接。

在[implode][3]函数设置完参数之后，底层就调用[php_implode][4]函数进行字符串连接，php_implode函数的执行流程图如下：

![implode流程](http://7u2eqw.com1.z0.glb.clouddn.com/implode.png)

php_implode函数核心代码：

    // 遍历数组的每一个元素，判断其类型，然后调用smart_str_appendl函数将值追加到字符串中
        while (zend_hash_get_current_data_ex(Z_ARRVAL_P(arr), (void **) &tmp, &pos) == SUCCESS) {
            switch ((*tmp)->type) {
                case IS_STRING:
                    smart_str_appendl(&implstr, Z_STRVAL_PP(tmp), Z_STRLEN_PP(tmp));
                    break;
    
                case IS_LONG: {
                    char stmp[MAX_LENGTH_OF_LONG + 1];
                    str_len = slprintf(stmp, sizeof(stmp), "%ld", Z_LVAL_PP(tmp));
                    smart_str_appendl(&implstr, stmp, str_len);
                }
                    break;
    
                case IS_BOOL:
                    if (Z_LVAL_PP(tmp) == 1) {
                        smart_str_appendl(&implstr, "1", sizeof("1")-1);
                    }
                    break;
    
                case IS_NULL:
                    break;
    
                case IS_DOUBLE: {
                    char *stmp;
                    str_len = spprintf(&stmp, 0, "%.*G", (int) EG(precision), Z_DVAL_PP(tmp));
                    smart_str_appendl(&implstr, stmp, str_len);
                    efree(stmp);
                }
                    break;
    
                case IS_OBJECT: {
                    int copy;
                    zval expr;
                    zend_make_printable_zval(*tmp, &expr, &copy);
                    smart_str_appendl(&implstr, Z_STRVAL(expr), Z_STRLEN(expr));
                    if (copy) {
                        zval_dtor(&expr);
                    }
                }
                    break;
    
                default:
                    tmp_val = **tmp;
                    zval_copy_ctor(&tmp_val);
                    convert_to_string(&tmp_val);
                    smart_str_appendl(&implstr, Z_STRVAL(tmp_val), Z_STRLEN(tmp_val));
                    zval_dtor(&tmp_val);
                    break;
    
            }
    
            // 添加glue字符
            if (++i != numelems) {
                smart_str_appendl(&implstr, Z_STRVAL_P(delim), Z_STRLEN_P(delim));
            }
            zend_hash_move_forward_ex(Z_ARRVAL_P(arr), &pos);
        }
        // 在尾部添加结束字符0
        smart_str_0(&implstr);

### 源码解读
php_implode会逐个获取数组里面的内容，然后判断每个元素的类型，再做必要的数据类型转换之后，调用smart_str_appendl函数将值追加到返回的字符串后面。最后，还要在字符串后面加上结束符，这是个必须的操作，以后编程时也应注意。

[smart_str_appendl][5]是函数[smart_str_appendl_ex][6]的宏定义，该函数调用了**memcpy**做字符串的复制。

## 小结
暂且写这么多，还有更多的优化和PHP源码中常用的函数，将会在以后的源码阅读中慢慢讲述。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^

 

最后，我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解][7]。


  [1]: https://github.com/hoohack/read-php-src/blob/master/ext/standard/string.c#L1094
  [2]: https://github.com/hoohack/read-php-src/blob/master/ext/standard/string.c#L1015
  [3]: https://github.com/hoohack/read-php-src/blob/master/ext/standard/string.c#L1235
  [4]: https://github.com/hoohack/read-php-src/blob/master/ext/standard/string.c#L1143
  [5]: https://github.com/hoohack/read-php-src/blob/master/ext/standard/php_smart_str.h#L85
  [6]: https://github.com/hoohack/read-php-src/blob/master/ext/standard/php_smart_str.h#L112
  [7]: https://github.com/hoohack/read-php-src