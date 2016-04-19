---
layout: post
title: "【性能为王】从PHP源码剖析array_keys和array_unique"
date: '2016-02-25 16:00:00'
author: Hector
categories: PHP
excerpt: 'php, PHP源码, php内部函数实现, array_flip源码, array_unique源码, array_keys源码, array源码, PHP函数性能分析'
keywords: 'php, PHP源码, php内部函数实现, array_flip源码, array_unique源码, array_keys源码, array源码, PHP函数性能分析'
---

之前在[[译]更快的方式实现PHP数组去重](http://www.hoohack.me/2016/01/11/faster-way-to-phps-array-unique-function/)这篇文章里讨论了使用array_flip后再调用array_keys函数替换直接调用array_unique函数实现数组去重性能较好。由于原文没有给出源码分析和测试的结果，导致给读者造成迷惑，在此说声抱歉。为了解开读者的疑惑，笔者承诺了会补上源码的分析，于是花了一些时间去研究PHP的源码，现在此补上详细的说明。

<!--more-->

## 性能分析
从运行性能上分析，看看下面的测试代码：

    $test=array();
    for($run=0; $run<10000; $run++)
    $test[]=rand(0,100);
    
    $time=microtime(true);
    
    $out = array_unique($test);
    
    $time=microtime(true)-$time;
    echo 'Array Unique: '.$time."\n";
    
    $time=microtime(true);
    
    $out=array_keys(array_flip($test));
    
    $time=microtime(true)-$time;
    echo 'Keys Flip: '.$time."\n";
    
    $time=microtime(true);
    
    $out=array_flip(array_flip($test));
    
    $time=microtime(true)-$time;
    echo 'Flip Flip: '.$time."\n";


运行结果如下：

![php array_unique vs array_keys](http://7u2eqw.com1.z0.glb.clouddn.com/php_array_unique_vs_keys.png)

从上图可以看到，使用array_unique函数需要0.069s;使用array_flip后再使用array_keys函数需要0.00152s;使用两次array_flip函数需要0.00146s。

测试结果表明，使用array_flip后再调用array_keys函数比array_unique函数快。那么，具体原因是什么呢？让我们看看在PHP底层，这两个函数是怎么实现的。

## 源码分析

    /* \{\{\{ proto array array_keys(array input [, mixed search_value[, bool strict]]) Return just the keys from the input array, optionally only for the specified search_value */
    PHP_FUNCTION(array_keys)
    {
        //变量定义
        zval *input,                /* Input array */
             *search_value = NULL,    /* Value to search for */
             **entry,                /* An entry in the input array */
               res,                    /* Result of comparison */
              *new_val;                /* New value */
        int    add_key;                /* Flag to indicate whether a key should be added */
        char  *string_key;            /* String key */
        uint   string_key_len;
        ulong  num_key;                /* Numeric key */
        zend_bool strict = 0;        /* do strict comparison */
        HashPosition pos;
        int (*is_equal_func)(zval *, zval *, zval * TSRMLS_DC) = is_equal_function;
    
        //程序解析参数
        if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "a|zb", &input, &search_value, &strict) == FAILURE) {
            return;
        }
    
        // 如果strict是true，则设置is_equal_func为is_identical_function，即全等比较
        if (strict) {
            is_equal_func = is_identical_function;
        }
    
        /* 根据search_vale初始化返回的数组大小 */
        if (search_value != NULL) {
            array_init(return_value);
        } else {
            array_init_size(return_value, zend_hash_num_elements(Z_ARRVAL_P(input)));
        }
        add_key = 1;
    
        /* 遍历输入的数组参数，然后添加键值到返回的数组 */
        zend_hash_internal_pointer_reset_ex(Z_ARRVAL_P(input), &pos);//重置指针
        //循环遍历数组
        while (zend_hash_get_current_data_ex(Z_ARRVAL_P(input), (void **)&entry, &pos) == SUCCESS) {
            // 如果search_value不为空
            if (search_value != NULL) {
                // 判断search_value与当前的值是否相同，并将比较结果保存到add_key变量
                is_equal_func(&res, search_value, *entry TSRMLS_CC);
                add_key = zval_is_true(&res);
            }
    
            if (add_key) {
                // 创建一个zval结构体
                MAKE_STD_ZVAL(new_val);
    
                // 根据键值是字符串还是整型数字将值插入到return_value中
                switch (zend_hash_get_current_key_ex(Z_ARRVAL_P(input), &string_key, &string_key_len, &num_key, 1, &pos)) {
                    case HASH_KEY_IS_STRING:
                        ZVAL_STRINGL(new_val, string_key, string_key_len - 1, 0);
                        // 此函数负责将值插入到return_value中，如果键值已存在，则使用新值更新对应的值，否则直接插入
                        zend_hash_next_index_insert(Z_ARRVAL_P(return_value), &new_val, sizeof(zval *), NULL);
                        break;
    
                    case HASH_KEY_IS_LONG:
                        Z_TYPE_P(new_val) = IS_LONG;
                        Z_LVAL_P(new_val) = num_key;
                        zend_hash_next_index_insert(Z_ARRVAL_P(return_value), &new_val, sizeof(zval *), NULL);
                        break;
                }
            }
    
            // 移动到下一个
            zend_hash_move_forward_ex(Z_ARRVAL_P(input), &pos);
        }
    }
    /* \}\}\} */
    
以上是array_keys函数底层的源码。为方便理解，笔者添加了一些中文注释。如果需要查看原始代码，可以点击查看。这个函数的功能就是新建一个临时数组，然后将键值对重新复制到新的数组，如果复制过程中有重复的键值出现，那么就用新的值替换。这个函数的主要步骤是地57和63行调用的zend_hash_next_index_insert函数。该函数将元素插入到数组中，如果出现重复的值，则使用新的值更新原键值指向的值，否则直接插入，时间复杂度是O(n)。


    /* \{\{\{ proto array array_flip(array input)
       Return array with key <-> value flipped */
    PHP_FUNCTION(array_flip)
    {
        // 定义变量
        zval *array, **entry, *data;
        char *string_key;
        uint str_key_len;
        ulong num_key;
        HashPosition pos;
    
        // 解析数组参数
        if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "a", &array) == FAILURE) {
            return;
        }
    
        // 初始化返回数组
        array_init_size(return_value, zend_hash_num_elements(Z_ARRVAL_P(array)));
    
        // 重置指针
        zend_hash_internal_pointer_reset_ex(Z_ARRVAL_P(array), &pos);
        // 遍历每个元素，并执行键<->值交换操作
        while (zend_hash_get_current_data_ex(Z_ARRVAL_P(array), (void **)&entry, &pos) == SUCCESS) {
            // 初始化一个结构体
            MAKE_STD_ZVAL(data);
            // 将原数组的值赋值为新数组的键
            switch (zend_hash_get_current_key_ex(Z_ARRVAL_P(array), &string_key, &str_key_len, &num_key, 1, &pos)) {
                case HASH_KEY_IS_STRING:
                    ZVAL_STRINGL(data, string_key, str_key_len - 1, 0);
                    break;
                case HASH_KEY_IS_LONG:
                    Z_TYPE_P(data) = IS_LONG;
                    Z_LVAL_P(data) = num_key;
                    break;
            }
    
            // 将原数组的键赋值为新数组的值，如果有重复的，则使用新值覆盖旧值
            if (Z_TYPE_PP(entry) == IS_LONG) {
                zend_hash_index_update(Z_ARRVAL_P(return_value), Z_LVAL_PP(entry), &data, sizeof(data), NULL);
            } else if (Z_TYPE_PP(entry) == IS_STRING) {
                zend_symtable_update(Z_ARRVAL_P(return_value), Z_STRVAL_PP(entry), Z_STRLEN_PP(entry) + 1, &data, sizeof(data), NULL);
            } else {
                zval_ptr_dtor(&data); /* will free also zval structure */
                php_error_docref(NULL TSRMLS_CC, E_WARNING, "Can only flip STRING and INTEGER values!");
            }
    
            // 下一个
            zend_hash_move_forward_ex(Z_ARRVAL_P(array), &pos);
        }
    }
    /* \}\}\} */
    
上面就是是array_flip函数的源码。[点击链接](http://lxr.php.net/xref/PHP_5_4/ext/standard/array.c#2691)查看原始代码。这个函数主要的做的事情就是创建一个新的数组，遍历原数组。在26行开始将原数组的值赋值为新数组的键，然后在37行开始将原数组的键赋值为新数组的值，如果有重复的，则使用新值覆盖旧值。整个函数的时间复杂度也是O(n)。因此，使用了array_flip之后再使用array_keys的时间复杂度是O(n)。

接下来，我们看看array_unique函数的源码。[点击链接](http://lxr.php.net/xref/PHP_5_4/ext/standard/array.c#2777)查看原始代码。


    /* \{\{\{ proto array array_unique(array input [, int sort_flags])
       Removes duplicate values from array */
    PHP_FUNCTION(array_unique)
    {
        // 定义变量
        zval *array, *tmp;
        Bucket *p;
        struct bucketindex {
            Bucket *b;
            unsigned int i;
        };
        struct bucketindex *arTmp, *cmpdata, *lastkept;
        unsigned int i;
        long sort_type = PHP_SORT_STRING;
    
        // 解析参数
        if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "a|l", &array, &sort_type) == FAILURE) {
            return;
        }
    
        // 设置比较函数
        php_set_compare_func(sort_type TSRMLS_CC);
    
        // 初始化返回数组
        array_init_size(return_value, zend_hash_num_elements(Z_ARRVAL_P(array)));
        // 将值拷贝到新数组
        zend_hash_copy(Z_ARRVAL_P(return_value), Z_ARRVAL_P(array), (copy_ctor_func_t) zval_add_ref, (void *)&tmp, sizeof(zval*));
    
        if (Z_ARRVAL_P(array)->nNumOfElements <= 1) {    /* 什么都不做 */
            return;
        }
    
        /* 根据target_hash buckets的指针创建数组并排序 */
        arTmp = (struct bucketindex *) pemalloc((Z_ARRVAL_P(array)->nNumOfElements + 1) * sizeof(struct bucketindex), Z_ARRVAL_P(array)->persistent);
        if (!arTmp) {
            zval_dtor(return_value);
            RETURN_FALSE;
        }
        for (i = 0, p = Z_ARRVAL_P(array)->pListHead; p; i++, p = p->pListNext) {
            arTmp[i].b = p;
            arTmp[i].i = i;
        }
        arTmp[i].b = NULL;
        // 排序
        zend_qsort((void *) arTmp, i, sizeof(struct bucketindex), php_array_data_compare TSRMLS_CC);
    
        /* 遍历排序好的数组，然后删除重复的元素 */
        lastkept = arTmp;
        for (cmpdata = arTmp + 1; cmpdata->b; cmpdata++) {
            if (php_array_data_compare(lastkept, cmpdata TSRMLS_CC)) {
                lastkept = cmpdata;
            } else {
                if (lastkept->i > cmpdata->i) {
                    p = lastkept->b;
                    lastkept = cmpdata;
                } else {
                    p = cmpdata->b;
                }
                if (p->nKeyLength == 0) {
                    zend_hash_index_del(Z_ARRVAL_P(return_value), p->h);
                } else {
                    if (Z_ARRVAL_P(return_value) == &EG(symbol_table)) {
                        zend_delete_global_variable(p->arKey, p->nKeyLength - 1 TSRMLS_CC);
                    } else {
                        zend_hash_quick_del(Z_ARRVAL_P(return_value), p->arKey, p->nKeyLength, p->h);
                    }
                }
            }
        }
        pefree(arTmp, Z_ARRVAL_P(array)->persistent);
    }
    /* \}\}\} */
    
可以看到，这个函数初始化一个新的数组，然后将值拷贝到新数组，然后在45行调用排序函数对数组进行排序，排序的算法是zend引擎的块树排序算法。接着遍历排序好的数组，删除重复的元素。整个函数开销最大的地方就在调用排序函数上，而快排的时间复杂度是O(n*logn)，因此，该函数的时间复杂度是O(n*logn)。

## 结论
因为array_unique底层调用了快排算法，加大了函数运行的时间开销，导致整个函数的运行较慢。这就是为什么array_keys比array_unique函数更快的原因。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，望点下推荐，写文章不容易。