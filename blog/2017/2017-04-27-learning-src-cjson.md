---
layout: post
title: "[源码学习]cjson库学习"
date: 2017-04-27
tags: blog
author: hoohack
categories: 源码学习
excerpt: 'cjson,json,source code,源码学习,c'
keywords: 'cjson,json,source code,源码学习,c'
---


## cJSON库是什么？
cJSON是一个轻量级的json解析库。使用起来非常简单，整个库非常地简洁，核心功能的实现都在cJSON.c文件，非常适合阅读源代码来学习C语言。最近读完这个库的源码，分享自己收获的一些心得。

## 什么是json，照搬json官网的说法：
> JSON(JavaScript Object Notation) 是一种轻量级的数据交换格式。 易于人阅读和编写。同时也易于机器解析和生成。 它基于JavaScript Programming Language, Standard ECMA-262 3rd Edition - December 1999的一个子集。 JSON采用完全独立于语言的文本格式，但是也使用了类似于C语言家族的习惯（包括C, C++, C#, Java, JavaScript, Perl, Python等）。 这些特性使JSON成为理想的数据交换语言。



## cJSON库里面有什么？
cjson库github地址：[https://github.com/DaveGamble/cJSON](https://github.com/DaveGamble/cJSON)
整个库包含cJSON.h和cJSON.c两个文件，头文件定义了一系列的API。这个库最基本也最重要的功能就是解析一个json字符串，使用的API是cJSON_Parse。cJSON_Parse函数调用了cJSON_ParseWithOpts函数，该函数实现了具体的逻辑。


两个函数的原型如下：
    
    CJSON_PUBLIC(cJSON *) cJSON_Parse(const char *value);
    CJSON_PUBLIC(cJSON *) cJSON_ParseWithOpts(const char *value, const char **return_parse_end, cJSON_bool require_null_terminated);

函数接收一段字符串，然后进行解析后返回。解析完返回的是一个cjson结构，cJSON结构的定义如下：

    typedef struct cJSON
    {
        struct cJSON *next; // 向后指针
        struct cJSON *prev; // 向前指针

        struct cJSON *child; // 指向子元素，比如子数组或者子对象

        int type; // 元素的类型

        char *valuestring; // 元素的字符串值，如果type == cJSON_String 或者 type == cJSO_Raw
    
        int valueint; // 已废弃，现在使用cJSON_SetNumberValue设置整型值
    
        double valuedouble; // 元素的整型值，如果type == cJSON_Number

        char *string; // 表示元素键值的值，如果它有子元素的话
    } cJSON;

## 如何解析一个json字符串？
json的官网在这里，[http://www.json.org](http://www.json.org)
网站首页描述了json是什么以及它的格式规范，有了规范之后，可以知道json是如何构成的，因此就有了如何解析json数据的方向。

json使用两种结构构建，对象或者数组。

对象使用`{`作开头，`}`作结尾，里边的每一个元素都是键值对的无序集合，键名和值使用`:`分隔，使用`,`分隔每一个元素；数组使用[作开头，]作结尾，里面的元素都是有序的值组成的集合，且使用`,`做分隔符。

每一个值可以是字符串，整型，也可以是true，false，null等常量，还可以是对象或数组，因为json结构是可嵌套的。

因此，我们可以得知：

1、可以根据json的首字母判断整个json的类型，如果json以`'{'`开头时，就是对象，以`'['`开头时，就是数组，否则就是字符串或者其他常量。

2、如果是对象，那么它的一定有键名，先解析它的键名，然后解析它的值，解析值的过程与第一步一样，递归解析

3、如果是数组，则逐个解析数组内的元素，直到遇到`]`为止，解析数组里面的元素的过程也是与第一步一致，递归解析。

这就是根据json官网的定义得出解析json字符串的思路，接下来看看cJSON库是如何实现的。cJSON_Parse的实现流程图如下：

![](https://www.hoohack.me/assets/images/2017/04/cjson-process.png)


cJSON_ParseWithOpts函数里面调用了parse_value，是整个函数的核心实现。
parse_value函数的流程图如下所示：
![](https://www.hoohack.me/assets/images/2017/04/cjson-parse-value.png)


可以看到，parse_value是对json值的开头进行判断，然后进入相应的分支进行解析，下面对每一个分支进行分析。解析出来的值是保存在cJSON的结构体中，以下命名为item。

### 常量
如果json值是以'null','true','false',则分别将item的type设置为cJSON_NULL、cJSON_TRUE、cJSON_FALSE。然后继续解析剩下的json值。

### string
如果遇到"开头，则说明json值是字符串，就解析它的值，此时只需要拿到两个"之间的值即可。保存字符串也是一个结构体，需要申请内存，计算长度的过程中，当遇到转义字符时，需要记录，因为转义符不保存。

### number
当遇到数字开头时，将其后面的数字字符记录起来，然后转成整型数字，然后做值的范围检查。

### array
解析数组时，为数组的元素创建一个新的json结构体new_item，然后继续解析数组里面的值，用','判断下一个元素的位置，得到的值保存到结构体中，并将多个元素用链表连接起来。一直解析，直到遇到']'符号。

### object
解析对象的过程与数组的类似，为对象的元素创建一个新的json结构体new_item，然后继续解析对象里面的值，对象是有键值对组成的，因此先得到键的值，然后用':'判断值的位置，进而继续解析得到值，多个键值对之间用','分隔开，最后用链表连接起来。一直解析，直到遇到'}'符号。

## 其他
在解析所有值之前，会调用skip_whitespace函数过滤字符串两边的所有空白字符。此处是ASCII码小于等于32的字符，如：\t、\n。函数如下：
    
    static const unsigned char *skip_whitespace(const unsigned char *in)
    {
        while (in && *in && (*in <= 32))
        {
            in++;
        }

        return in;
    }

## 总结
通过阅读这个小小的json解析库，知道了大部分的json库是如何实现的，自己对json的认识也有了一个更深刻的印象。
学习到了一种解析某种格式的字符串的思路，要先知道该字符串格式的规范，直到它是如何组成的，有哪些规则和注意的地方，从它的组成规范中逐步分解和解析。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点个赞吧，谢谢^_^



