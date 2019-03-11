---
layout: post
title: "[PHP源码阅读]count函数"
date: '2016-05-31'
author: hoohack
categories: PHP
excerpt: 'php,c,PHP源码分析,源码学习,PHP源码,count源码,php count源码,php源码阅读,PHP源码阅读'
keywords: 'php,c,PHP源码分析,源码学习,PHP源码,count源码,php count源码,php源码阅读,PHP源码阅读'
---

在PHP编程中，在遍历数组的时候经常需要先计算数组的长度作为循环结束的判断条件，而在PHP里面对数组的操作是很频繁的，因此count也算是一个常用函数，下面研究一下count函数的具体实现。

我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。

## count

    int count ( mixed $array_or_countable [, int $mode = COUNT_NORMAL ] )

count函数计算数组或者对象里面的所有元素个数。

对于对象来说，如果你安装了SPL扩展，可以通过实现Countable接口来调用count函数。Countable接口有且仅有一个方法Countable::count()，该方法的返回count()函数的返回值。

<!--more-->

## 参数说明

**mode**

如果参数mode设为COUNT_RECURSIVE(或1)，count()会递归地计算该数组。在计算多维数组的时候特别有用。

如果第一个参数不是数组或者实现Countable接口的对象，count函数将返回1。

注意：count函数可以检测递归避免无限循环，但会在遇到无限递归或得到比期望值大的时候返回E_WARNING提示。

## 运行示例

### 普通应用

    $arr1 = array(1, 2, 3, 4, 5);
    $val1 = count($arr1); // 5

### 多维数组

    $arr2 = array('apple', 'banana', array('cat', 'camel'), 'dog');
    $val2_1 = count($arr2); // 4
    $val2_2 = count($arr2, 1); // 6

### 数字和字符串

    $str = "hello world";
    $int_val = 1;
    $val3 = count($str); // 1
    $val4 = count($int_val); // 1

### 普通对象

    class User {
        private $name;
        private $address;
    }
    
    $user = new User();
    $val5 = count($user); // 1
    $val6 = count((array) $user); // 2

### array-like对象

    class User extends ArrayObject {
        private $name;
    
        public function __construct() {
            $this->name = 'hhq';
        }
    
        public function getName() {
            return $this->name;
        }
    
        public function count() {
            return 2;
        }
    
    }
    
    $user2 = new User();
    $val7 = count($user2); // 2

### 实现Countable接口对象

    class User implements Countable {
        public function count() {
            return 3;
        }
    }
    
    $user3 = new User();
    $val8 = count($user3); // 3 

### 运行步骤

> 进入switch语句检测参数类型
> 
> 　　如果是NULL，直接返回0
> 
> 　　如果是数组，调用php_count_recursive函数机选数组元素个数
> 
> 　　如果是对象，先检查是否为数组对象（array-like object），如果是，则计算数组对象的数量
> 
> 　　否则，如果对象实现了Countable接口，则调用Countable的count方法
> 
> 　　最后，其他类型比如整型数组或字符串，都返回1。

## 源码解读

如果是普通数组，count函数会调用php_count_recursive函数实现其功能的运行步骤如下：

如果当前hash Bucket被递归访问的次数大于1，说明重复递归，染回E_WARNING错误

否则计算当前数组层数的数组元素个数

如果有递归参数选项，则继续递归访问

如果参数是对象类型，实现时会先判断handler是否被定义。而handler是PHP内核中对象的结构体，其中包含有**count_elements**字段，实际上是一个函数。如果某个对象表现得想数组一样，即通常说的**array-like object**，那么就会执行count_elements函数。具体实现是类继承PHP的ArrayObject，并在类里面实现count函数，具体调用的就是count函数，如果类没有实现count函数，则count返回0，否则返回对象的count函数的返回值。

如果是其他的数据类型
1、字符串

2、数字

3、对象分支中两个if判断都为false的情况，即没有继承ArrayObject且没有实现Countable接口。

这些类型通通返回1。

需要注意的是，如果需要计算的是对象的属性数量，可以先将对象转换成数组，然后调用count函数。如：
$count_value = count((array) $user);

## 小结

阅读count函数的源码过程中，在其中一步卡住了，就是if (Z_OBJ_HT_P(array)->count_elements)这一步，因为始终无法写出进入这个分支的demo，在网上搜索了很多资料也未果，因此请教了TIPI的reeze，最终得到了想要的答案。不懂就要问，哈哈。

 

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^

 

最后再安利一下，我在github有对PHP源码更详细的注解。感兴趣的可以围观一下，给个star。[PHP5.4源码注解](https://github.com/read-php-src/read-php-src)。可以通过[commit记录](https://github.com/read-php-src/read-php-src/commits/master)查看已添加的注解。

更多源码文章，欢迎访问个人主页继续查看：[hoohack](https://www.hoohack.me)
