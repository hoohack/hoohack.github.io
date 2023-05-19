---
layout: post
title: "【译】理解数组在PHP内部的实现（给PHP开发者的PHP源码-第四部分）"
date: 2016-02-15
tags: tech
author: hoohack
categories: PHP
excerpt: 'PHP,PHP源码,PHP源码结构,PHP源码分析,PHP数组'
keywords: 'PHP,PHP源码,PHP源码结构,PHP源码分析,PHP数组'
---

原文：[https://nikic.github.io/2012/03/28/Understanding-PHPs-internal-array-implementation.html](https://nikic.github.io/2012/03/28/Understanding-PHPs-internal-array-implementation.html)

欢迎来到"给PHP开发者的PHP源码"系列的第四部分，这一部分我们会谈论PHP数组在内部是如何表示和在代码库里使用的。

为了防止你错过了之前的文章，以下是链接：

第一部分：[给PHP开发者的PHP源码-源码结构](https://www.hoohack.me/2016/02/04/phps-source-code-for-php-developers-ch)

第二部分：[理解PHP内部函数的定义](https://www.hoohack.me/2016/02/10/understanding-phps-internal-function-definitions-ch)

第三部分：[PHP的变量实现](https://www.hoohack.me/2016/02/12/phps-source-code-for-php-developers-part3-variables-ch)



## 所有的东西都是哈希表
基本上，PHP里面的所有东西都是哈希表。不仅仅是在下面的PHP数组实现中，它们还用来存储对象属性，方法，函数，变量还有几乎所有东西。

因为哈希表对PHP来说太基础了，因此非常值得深入研究它是如何工作的。

## 那么，什么是哈希表？
记住，在C里面，数组是内存块，你可以通过下标访问这些内存块。因此，在C里面的数组只能使用整数且有序的键值（那就是说，你不能在键值0之后使用1332423442的键值）。C里面没有关联数组这种东西。

哈希表是这样的东西：它们使用哈希函数转换字符串键值为正常的整型键值。哈希后的结果可以被作为正常的C数组的键值（又名为内存块）。现在的问题是，哈希函数会有冲突，那就是说，多个字符串键值可能会生成一样的哈希值。例如，在PHP，超过64个元素的数组里，字符串"foo"和"oof"拥有一样的哈希值。

这个问题可以通过存储可能冲突的值到链表中，而不是直接将值存储到生成的下标里。

## HashTable和Bucket
那么，现在哈希表的基本概念已经清晰了，让我们看看在PHP内部中实现的哈希表结构：

    typedef struct _hashtable {
        uint nTableSize;
        uint nTableMask;
        uint nNumOfElements;
        ulong nNextFreeElement;
        Bucket *pInternalPointer;
        Bucket *pListHead;
        Bucket *pListTail;
        Bucket **arBuckets;
        dtor_func_t pDestructor;
        zend_bool persistent;
        unsigned char nApplyCount;
        zend_bool bApplyProtection;
         #if ZEND_DEBUG
            int inconsistent;
         #endif
    } HashTable;

## 快速过一下：

`nNumOfElements`标识现在存储在数组里面的值的数量。这也是函数`count($array)`返回的值。
   
`nTableSize`表示哈希表的容量。它通常是下一个大于等于`nNumOfElements`的2的幂值。比如，如果数组存储了32元素，那么哈希表也是32大小的容量。但如果再多一个元素添加进来，也就是说，数组现在有33个元素，那么哈希表的容量就被调整为64。
    这是为了保持哈希表在空间和时间上始终有效。很明显，如果哈希表太小，那么将会有很多的冲突，而且性能也会降低。另一方面，如果哈希表太大，那么浪费内存。2的幂值是一个很好的折中方案。

`nTableMask`是哈希表的容量减一。这个mask用来根据当前的表大小调整生成的哈希值。例如，"foo"真正的哈希值（使用DJBX33A哈希函数）是193491849。如果我们现在有64容量的哈希表，我们明显不能使用它作为数组的下标。取而代之的是通过应用哈希表的mask，然后只取哈希表的低位。
    
    hash           |        193491849 |     0b1011100010000111001110001001
    & mask         | &             63 | &   0b0000000000000000000000111111
    ---------------------------------------------------------
    = index        | = 9              | =   0b0000000000000000000000001001

`nNextFreeElement`是下一个可以使用的数字键值，当你使用$array[] = xyz是被使用到。

`pInternalPointer` 存储数组当前的位置。这个值在foreach遍历时可使用reset()，current()，key()，next()，prev()和end()函数访问。

`pListHead`和`pListTail`标识了数组的第一个和最后一个元素的位置。记住：PHP的数组是有序集合。比如，['foo' => 'bar', 'bar' => 'foo']和['bar' => 'foo', 'foo' => 'bar']这两个数组包含了相同的元素，但却有不同的顺序。

`arBuckets`是我们经常谈论的“哈希表（internal C array）”。它用Bucket **来定义，因此它可以被看作数组的bucket指针（我们会马上谈论Bucket是什么）。

`pDestructor`是值的析构器。如果一个值从HT中移除，那么这个函数会被调用。常见的析构函数是zval_ptr_dtor。zval_ptr_dtor会减少zval的引用数量，而且，如果它遇到o，它会销毁和释放它。

最后的四个变量对我们来说不是那么重要。所以简单地说persistent标识哈希表可以在多个请求里存活，nApplyCount和bApplyProtection防止多次递归，inconsistent用来捕获在调试模式里哈希表的非法使用。

让我们继续第二个重要的结构：Bucket：

    typedef struct bucket {
        ulong h;
        uint nKeyLength;
        void *pData;
        void *pDataPtr;
        struct bucket *pListNext;
        struct bucket *pListLast;
        struct bucket *pNext;
        struct bucket *pLast;
        const char *arKey;
    } Bucket;

`h`是一个哈希值（没有应用mask值映射之前的值）。

`arKey`用来保存字符串键值。`nKeyLength`是对应的长度。如果是数字键值，那么这两个变量都不会被使用。

`pData`及`pDataPtr`被用来存储真正的值。对PHP数组来说，它的值是一个zval结构体（但它也在其他地方使用到）。不要纠结为什么有两个属性。它们两者的区别是谁负责释放值。

`pListNext`和`pListLast`标识数组元素的下一个元素和上一个元素。如果PHP想顺序遍历数组它会从pListHead这个bucket开始（在HashTable结构里面），然后使用pListNext bucket作为遍历指针。在逆序也是一样，从pListTail指针开始，然后使用pListLast指针作为变量指针。（你可以在用户代码里调用end()然后调用prev()函数达到这个效果。）

`pNext`和`pLast`生成我上面提到的“可能冲突的值链表”。arBucket数组存储第一个可能值的bucket。如果该bucket没有正确的键值，PHP会查找pNext指向的bucket。它会一直指向后面的bucket直到找到正确的bucket。pLast在逆序中也是一样的原理。

你可以看到，PHP的哈希表实现相当复杂。这是它使用超灵活的数组类型要付出的代价。

## 哈希表是怎么被使用的？
Zend Engine定义了大量的API函数供哈希表使用。低级的哈希表函数预览可以在`zend_hash.h`文件里面找到。另外Zend Engine在`zend_API.h`文件定义了稍微高级一些的API。

我们没有足够的时间去讲所有的函数，但是我们至少可以查看一些实例函数，看看它是如何工作的。我们将使用`array_fill_keys`作为实例函数。

使用第二部分提到的技巧你可以很容易地找到函数在`ext/standard/array.c`文件里面定义了。现在，让我们来快速查看这个函数。

跟大部分函数一样，函数的顶部有一堆变量的定义，然后调用`zend_parse_parameters`函数：
    
    zval *keys, *val, **entry;
    HashPosition pos;

    if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "az", &keys, &val) == FAILURE) {
        return;
    }

很明显，`az`参数说明第一个参数类型是数组（即变量`keys`），第二个参数是任意的zval（即变量`val`）。

解析完参数后，返回数组就被初始化了：

    /* Initialize return array */
    array_init_size(return_value, zend_hash_num_elements(Z_ARRVAL_P(keys)));

这一行包含了array API里面存在的三步重要的部分：

1、Z_ARRVAL_P宏从zval里面提取值到哈希表。

2、zend_hash_num_elements提取哈希表元素的个数（nNumOfElements属性）。

3、array_init_size使用size变量初始化数组。

因此，这一行使用与键值数组一样大小来初始化数组到`return_value`变量里。

这里的size只是一种优化方案。函数也可以只调用`array_init(return_value)`，这样随着越来越多的元素添加到数组里，PHP就会多次重置数组的大小。通过指定特定的大小，PHP会在一开始就分配正确的内存空间。

数组被初始化并返回后，函数用跟下面大致相同的代码结构，使用while循环变量keys数组：
    
    zend_hash_internal_pointer_reset_ex(Z_ARRVAL_P(keys), &pos);
    while (zend_hash_get_current_data_ex(Z_ARRVAL_P(keys), (void **)&entry, &pos) == SUCCESS) {
        // some code

        zend_hash_move_forward_ex(Z_ARRVAL_P(keys), &pos);
    }

这可以很容易地翻译成PHP代码：
    
    reset($keys);
    while (null !== $entry = current($keys)) {
        // some code

        next($keys);
    }

跟下面的一样：
    
    foreach ($keys as $entry) {
        // some code
    }

唯一不同的是，C的遍历并没有使用内部的数组指针，而使用它自己的pos变量来存储当前的位置。

在循环里面的代码分为两个分支：一个是给数字键值，另一个是其他键值。数字键值的分支只有下面的两行代码：
    
    zval_add_ref(&val);
    zend_hash_index_update(Z_ARRVAL_P(return_value), Z_LVAL_PP(entry), &val, sizeof(zval *), NULL);

这看起来太直接了：首先值的引用增加了（添加值到哈希表意味着增加另一个指向它的引用），然后值被插入到哈希表中。`zend_hash_index_update`宏的参数分别是，需要更新的哈希表`Z_ARRVAL_P(return_value)`，整型下标`Z_LVAL_PP(entry)`，值`&val`，值的大小`sizeof(zval *)`以及目标指针(这个我们不关注，因此是`NULL`）。

非数字下标的分支就稍微复杂一点：
    
    zval key, *key_ptr = *entry;

    if (Z_TYPE_PP(entry) != IS_STRING) {
        key = **entry;
        zval_copy_ctor(&key);
        convert_to_string(&key);
        key_ptr = &key;
    }

    zval_add_ref(&val);
    zend_symtable_update(Z_ARRVAL_P(return_value), Z_STRVAL_P(key_ptr), Z_STRLEN_P(key_ptr) + 1, &val, sizeof(zval *),             NULL);

    if (key_ptr != *entry) {
        zval_dtor(&key);
    }

首先，使用`convert_to_string`将键值转换为字符串（除非它已经是字符串了）。在这之前，`entry`被复制到新的`key`变量。`key = **entry`这一行实现。另外，`zval_copy_ctor`函数会被调用，不然复杂的结构（比如字符串或数组）不会被正确地复制。

上面的复制操作非常有必要，因为要保证类型转换不会改变原来的数组。如果没有copy操作，强制转换不仅仅修改局部的变量，而且也修改了在键值数组中的值（显然，这对用户来说非常意外）。

显然，循环结束之后，复制操作需要再次被移除，`zval_dtor(&key)`做的就是这个工作。`zval_ptr_dtor`和`zval_dtor`的不同是`zval_ptr_dtor`只会在`refcount`变量为0时销毁zval变量，而`zval_dtor`会马上销毁它，而不是依赖`refcount`的值。这就为什么你看到`zval_pte_dtor`使用"normal"变量而`zval_dtor`使用临时变量，这些临时变量不会在其他地方使用。而且，`zval_ptr_dtor`会在销毁之后释放zval的内容而`zval_dtor`不会。因为我们没有`malloc()`任何东西，因此我们也不需要`free()`，因此在这方面，`zval_dtor`做了正确的选择。

现在来看看剩下的两行（重要的两行^^）：
    
    zval_add_ref(&val);
    zend_symtable_update(Z_ARRVAL_P(return_value), Z_STRVAL_P(key_ptr), Z_STRLEN_P(key_ptr) + 1, &val, sizeof(zval *), NULL);

这跟数字键值分支完成后的操作非常相似。不同的是，现在调用的是`zend_symtable_update`而不是`zend_hash_index_update`，而传递的是键值字符串和它的长度。

## 符号表
"正常的"插入字符串键值到哈希表的函数是`zend_hash_update`，但这里却使用了`zend_symtable_update`。它们有什么不同呢？

符号表简单地说就是哈希表的特殊的类型，这种类型使用在数组里。它跟原始的哈希表不同的是他如何处理数字型的键值：在符号表里，"123"和123被看作是相同的。因此，如果你在$array["123"]存储一个值，你可以在后面使用$array[123]获取它。

底层可以使用两种方式实现：要么使用"123"来保存123和"123"，要么使用123来保存这两种键值。显然PHP选择了后者（因为整型比字符串类型更快和占用更少的空间）。

如果你不小心使用"123"而不是强制转换为123后插入数据，你会发现符号表一些有趣的事情。一个利用数组到对象的强制转换如下：
    
    $obj = new stdClass;
    $obj->{123} = "foo";
    $arr = (array) $obj;
    var_dump($arr[123]); // Undefined offset: 123
    var_dump($arr["123"]); // Undefined offset: 123

对象属性总是使用字符串键值来保存，尽管它们是数字。因此`$obj->{123} = 'foo'`这行代码实际上保存'foo'变量到"123"下标里。当使用数组强制转换的时候，这个值不会给改变。但当`$arr[123]`和`$arr["123"]`都想访问123下标的值（不是已有的"123"下标）时，都抛出了错误。因此，恭喜，你创建了一个隐藏的数组元素。

下一部分
下一部分会再次在ircmaxell的博客发表。下一篇会介绍对象和类在内部是如何工作的。
