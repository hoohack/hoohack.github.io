---
layout: post
title: "[PHP源码阅读]array_slice和array_splice函数"
date: '2016-07-05'
author: hoohack
categories: PHP
excerpt: 'php,c,PHP源码分析,源码学习,PHP源码,array_slice源码,array_splice源码,php array_slice源码,php array_splice源码,php源码阅读,PHP源码阅读'
keywords: 'php,c,PHP源码分析,源码学习,PHP源码,array_slice源码,array_splice源码,php array_slice源码,php array_splice源码,php源码阅读,PHP源码阅读'
---


array_slice和array_splice函数是用在取出数组的一段切片，array_splice还有用新的切片替换原删除切片位置的功能。类似javascript中的Array.prototype.splice和Array.prototype.slice方法。

我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/hoohack/read-php-src)。可以通过[commit记录](https://github.com/hoohack/read-php-src/commits/master)查看已添加的注解。

# array_slice
    
    array array_slice ( array $array , int $offset [, int $length = NULL [, bool $preserve_keys = false ]] )

返回数组中指定下标offset和长度length的子数组切片。

<!--more-->

## 参数说明
设第一个参数数组的长度为num_in。

### offset
如果offset是正数且小于length，则返回数组会从offset开始；如果offset大于length，则不操作，直接返回。如果offset是负数，则offset = num_in+offset，如果num_in+offset == 0，则将offset设为0。

### length
如果length小于0，那么会将length转为num_in - offset + length；否则，如果offset+length > array_count，则length = num_in - offset。如果处理后length还是小于0，则直接返回。

### preserve_keys
默认是false，默认不保留数字键值原顺序，设为true的话会保留数组原来的数字键值顺序。

## 使用实例
    <?php
        $input = array("a", "b", "c", "d", "e");
        
        $output = array_slice($input, 2);      // returns "c", "d", and "e"
        $output = array_slice($input, -2, 1);  // returns "d"
        $output = array_slice($input, 0, 3);   // returns "a", "b", and "c"
        
        print_r(array_slice($input, 2, -1)); // array(0 => 'c', 1 => 'd');
        print_r(array_slice($input, 2, -1, true)); // array(2 => 'c', 1 => 'd');

## 运行步骤
    
    处理参数：offset、length
    
    移动指针到offset指向的位置
    
    从offset开始，拷贝length个元素到返回数组

 

运行流程图如下
![array_splice](http://7u2eqw.com1.z0.glb.clouddn.com/array_slice_and_array_splice.png)
 

 

# array_splice
    
    array array_splice ( array &$input , int $offset [, int $length = 0 [, mixed $replacement = array() ]] )

删除input中从offset开始length个元素，如果有replacement参数的话用replacement数组替换删除掉的元素。

## 参数说明
 array_splice函数中的offset和length参数跟array_slice函数中的用法一样。

### replacement
如果这个参数设置了，那么函数将使用replacement数组来替换。

如果offset和length指定了没有任何元素需要移除，那么replacement会被插入到offset的位置。

如果replacement只有一个元素，可以不用array()去包着它。

## 使用示例

    <?php
    $input = array("red", "green", "blue", "yellow");
    array_splice($input, 2);
    // $input变为 array("red", "green")
    
    $input = array("red", "green", "blue", "yellow");
    array_splice($input, 1, -1);
    // $input变为 array("red", "yellow")
    
    $input = array("red", "green", "blue", "yellow");
    array_splice($input, 1, count($input), "orange");
    // $input变为 array("red", "orange")
    
    $input = array("red", "green", "blue", "yellow");
    array_splice($input, -1, 1, array("black", "maroon"));
    // $input为 array("red", "green",
    //          "blue", "black", "maroon")
    
    $input = array("red", "green", "blue", "yellow");
    array_splice($input, 3, 0, "purple");
    // $input为 array("red", "green",
    //          "blue", "purple", "yellow");
 

# 源码解读
在array_splice中，有这么一段代码：
    
    if (return_value_used) { // 如果有用到函数返回值则创建返回数组，否则不创建返回数组
        int size = length;

        /* Clamp the offset.. */
        if (offset > num_in) {
            offset = num_in;
        } else if (offset < 0 && (offset = (num_in + offset)) < 0) {
            offset = 0;
        }

        /* ..and the length */
        if (length < 0) {
            size = num_in - offset + length;
        } else if (((unsigned long) offset + (unsigned long) length) > (unsigned) num_in)         {
            size = num_in - offset;
        }

        /* Initialize return value */
        array_init_size(return_value, size > 0 ? size : 0);
        rem_hash = &Z_ARRVAL_P(return_value);
    }

array_splice函数返回的是被删除的切片。这段代码的意思是，如果array_splice需要返回值，那么才创建返回数组，否则不创建，以免浪费空间。这也是一个编程小技巧，仅当需要的时候才返回。比如在函数中使用$result = array_splice(...)，那么return_value_used就是true。

# 总结
到此本文结束，在平时编程中，应当像这两个函数实现时的做法一样，将最特殊的情况先处理掉，然后再继续，以免做了多余的判断；有需要保存新变量的时候才申请新的空间，不然会造成浪费。

 

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^

 

最后再安利一下，我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/hoohack/read-php-src)。可以通过[commit记录](https://github.com/hoohack/read-php-src/commits/master)查看已添加的注解。

更多源码文章，欢迎访问个人主页继续查看：[hoohack](http://www.hoohack.me)
