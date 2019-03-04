---
layout: post
title: "［Redis源码阅读］sds字符串实现"
date: '2017-11-13 07:00:00'
author: hoohack
categories: PHP
excerpt: 'redis,c,源码分析,源码学习,redis源码,sds源码,sds源码阅读,sds源码阅读,redis 4.0源码'
keywords: 'redis,c,源码分析,源码学习,redis源码,sds源码,sds源码阅读,sds源码阅读,redis 4.0源码'
---

## 初衷

从开始工作就开始使用Redis，也有一段时间了，但都只是停留在使用阶段，没有往更深的角度探索，每次想读源码都止步在阅读书籍上，因为看完书很快又忘了，这次逼自己先读代码。因为个人觉得写作需要阅读文字来增强灵感，那么写代码的，就阅读更多代码来增强灵感吧。

redis的实现原理，在《Redis设计与实现》一书中讲得很详细了，但是想通过结合代码的形式再深入探索，加深自己的理解，现在将自己探索的心得写在这儿。

<!--more-->

## sds结构体的定义

    #define SDS_TYPE_5  0
    #define SDS_TYPE_8  1
    #define SDS_TYPE_16 2
    #define SDS_TYPE_32 3
    #define SDS_TYPE_64 4
    #define SDS_TYPE_MASK 7
    
    // sds结构体，使用不同的结构体来保存不同长度大小的字符串
    typedef char *sds;
    
    struct __attribute__ ((__packed__)) sdshdr5 {
        unsigned char flags; /* flags共8位，低三位保存类型标志，高5位保存字符串长度，小于32(2^5-1) */
        char buf[]; // 保存具体的字符串
    };
    struct __attribute__ ((__packed__)) sdshdr8 {
        uint8_t len; /* 字符串长度，buf已用的长度 */
        uint8_t alloc; /* 为buf分配的总长度，alloc-len就是sds结构体剩余的空间 */
        unsigned char flags; /* 低三位保存类型标志 */
        char buf[];
    };
    struct __attribute__ ((__packed__)) sdshdr16 {
        uint16_t len; /* used */
        uint16_t alloc; /* excluding the header and null terminator */
        unsigned char flags; /* 3 lsb of type, 5 unused bits */
        char buf[];
    };
    struct __attribute__ ((__packed__)) sdshdr32 {
        uint32_t len; /* used */
        uint32_t alloc; /* excluding the header and null terminator */
        unsigned char flags; /* 3 lsb of type, 5 unused bits */
        char buf[];
    };
    struct __attribute__ ((__packed__)) sdshdr64 {
        uint64_t len; /* used */
        uint64_t alloc; /* excluding the header and null terminator */
        unsigned char flags; /* 3 lsb of type, 5 unused bits */
        char buf[];
    };
    
sds结构体从4.0开始就使用了5种header定义，节省内存的使用，但是不会用到sdshdr5，我认为是因为sdshdr5能保存的大小较少，2^5=32，因此就不使用它。

其他的结构体保存了len、alloc、flags以及buf四个属性。各自的含义见代码的注释。

## sds结构体的获取
上面可以看到有5种结构体的定义，在使用的时候是通过一个宏来获取的：

    #define SDS_HDR(T,s) ((struct sdshdr##T *)((s)-(sizeof(struct sdshdr##T))))
    
**"##"**被称为连接符，它是一种预处理运算符， 用来把两个语言符号(Token)组合成单个语言符号。比如`SDS_HDR(8, s)`，根据宏定义展开是：

    ((struct sdshdr8 *)((s)-(sizeof(struct sdshdr8))))
    
而具体使用哪一个结构体，sds底层是通过flags属性与`SDS_TYPE_MASK`做与运算得出具体的类型（具体的实现可见下面的sdslen函数），然后再根据类型去获取具体的结构体。
    
## sds特性的实现
在Redis设计与实现一书中讲到，相比C字符串而言，sds的特性如下：

> * 常数复杂度获取字符串长度
> * 杜绝缓冲区溢出
> * 减少内存重新分配次数
> * 二进制安全

那么，它是怎么做到的呢？看代码。

### 常数复杂度获取字符串长度
因为sds将长度属性保存在结构体中，所以只需要读取这个属性就能获取到sds的长度，具体调用的函数时sdslen，实现如下：

    static inline size_t sdslen(const sds s) {
        unsigned char flags = s[-1];
        switch(flags&SDS_TYPE_MASK) {
            case SDS_TYPE_5:
                return SDS_TYPE_5_LEN(flags);
            case SDS_TYPE_8:
                return SDS_HDR(8,s)->len;
            case SDS_TYPE_16:
                return SDS_HDR(16,s)->len;
            case SDS_TYPE_32:
                return SDS_HDR(32,s)->len;
            case SDS_TYPE_64:
                return SDS_HDR(64,s)->len;
        }
        return 0;
    }

可以看到，函数是根据类型调用SDS_HDR宏来获取具体的sds结构，然后直接返回结构体的len属性。

### 杜绝缓冲区溢出
对于C字符串的操作函数来说，如果在修改字符串的时候忘了为字符串分配足够的空间，就有可能出现缓冲区溢出的情况。而sds中的API就不会出现这种情况，因为它在修改sds之前，都会判断它是否有足够的空间完成接下来的操作。

拿书中举例的`sdscat`函数来看，如果`strcat`想在原来的"Redis"字符串的基础上进行字符串拼接的操作，但是没有检查空间是否满足，就有可能会修改了"Redis"字符串之后使用到的内存，可能是其他结构使用了，也有可能是一段没有被使用的空间，因此有可能会出现缓冲区溢出。但是`sdscat`就不会，如下面代码所示：
    
    sds sdscatlen(sds s, const void *t, size_t len) {
        size_t curlen = sdslen(s);
    
        s = sdsMakeRoomFor(s,len);
        if (s == NULL) return NULL;
        memcpy(s+curlen, t, len);
        sdssetlen(s, curlen+len);
        s[curlen+len] = '\0';
        return s;
    }
    
    sds sdscat(sds s, const char *t) {
        return sdscatlen(s, t, strlen(t));
    }

从代码中可以看到，在执行`memcpy`将字符串写入sds之前会调用`sdsMakeRoomFor`函数去检查sds字符串s是否有足够的空间，如果没有足够空间，就为其分配足够的空间，从而杜绝了缓冲区溢出。`sdsMakeRoomFor`函数的实现如下：

    sds sdsMakeRoomFor(sds s, size_t addlen) {
        void *sh, *newsh;
        size_t avail = sdsavail(s);
        size_t len, newlen;
        char type, oldtype = s[-1] & SDS_TYPE_MASK;
        int hdrlen;
    
        /* 只有有足够空间就马上返回，否则就继续执行分配空间的操作 */
        if (avail >= addlen) return s;
    
        len = sdslen(s);
        sh = (char*)s-sdsHdrSize(oldtype);
        newlen = (len+addlen);
        // SDS_MAX_PREALLOC == 1MB，如果修改后的长度小于1M，则分配的空间是原来的2倍，否则增加1MB的空间
        if (newlen < SDS_MAX_PREALLOC)
            newlen *= 2;
        else
            newlen += SDS_MAX_PREALLOC;
    
        type = sdsReqType(newlen);
    
        if (type == SDS_TYPE_5) type = SDS_TYPE_8;
    
        hdrlen = sdsHdrSize(type);
        if (oldtype==type) {
            newsh = s_realloc(sh, hdrlen+newlen+1);
            if (newsh == NULL) return NULL;
            s = (char*)newsh+hdrlen;
        } else {
            /* 新增空间后超过当前类型的长度，使用malloc，并把原字符串拷贝过去 */
            newsh = s_malloc(hdrlen+newlen+1);
            if (newsh == NULL) return NULL;
            memcpy((char*)newsh+hdrlen, s, len+1);
            s_free(sh);
            s = (char*)newsh+hdrlen;
            s[-1] = type; // 给类型标志位赋值
            sdssetlen(s, len);
        }
        sdssetalloc(s, newlen);
        return s;
    }
    
### 减少内存分配操作
sds字符串的很多操作都涉及到修改字符串内容，比如`sdscat`拼接字符串、`sdscpy`拷贝字符串等等。这时候就需要内存的分配与释放，如果每次操作都分配刚刚好的大小，那么对程序的性能必定有影响，因为内存分配涉及到系统调用以及一些复杂的算法。

sds使用了空间预分配以及惰性空间释放的策略来减少内存分配操作。

#### 空间预分配
前面提到，每次涉及到字符串的修改时，都会调用`sdsMakeRoomFor`检查sds字符串，如果大小不够再进行大小的重新分配。`sdsMakeRoomFor`函数有下面这几行判断：
    
    // SDS_MAX_PREALLOC == 1MB，如果修改后的长度小于1M，则分配的空间是原来的2倍，否则增加1MB的空间
    if (newlen < SDS_MAX_PREALLOC)
        newlen *= 2;
    else
        newlen += SDS_MAX_PREALLOC;
        
函数判断字符串修改后的大小，如果修改后的长度小于1M，则分配给sds的空间是原来的2倍，否则增加1MB的空间。

#### 惰性空间释放
如果操作后减少了字符串的大小，比如下面的`sdstrim`函数，只是在最后修改len属性，不会马上释放多余的空间，而是继续保留多余的空间，这样在下次需要增加sds字符串的大小时，就不需要再为其分配空间了。当然，如果之后检查到sds的大小实在太大，也会调用`sdsRemoveFreeSpac`e函数释放多余的空间。

    sds sdstrim(sds s, const char *cset) {
        char *start, *end, *sp, *ep;
        size_t len;
    
        sp = start = s;
        ep = end = s+sdslen(s)-1;
        /* 从头部和尾部逐个字符遍历往中间靠拢，如果字符在cest中，则继续前进 */
        while(sp <= end && strchr(cset, *sp)) sp++;
        while(ep > sp && strchr(cset, *ep)) ep--;
        len = (sp > ep) ? 0 : ((ep-sp)+1); // 全部被去除了，长度就是0
        if (s != sp) memmove(s, sp, len); // 拷贝内容
        s[len] = '\0';
        sdssetlen(s,len);
        return s;
    }

### 二进制安全
二进制安全指的是只关心二进制化的字符串，不关心具体格式。只会严格的按照二进制的数据存取，不会妄图以某种特殊格式解析数据。比如遇到'\0'字符不会停止解析。

对于C字符串来说，`strlen`是判断遇到'\0'之前的字符数量。如果需要保存二进制的数据，就不能通过传统的C字符串来保存，因为获取不到它真实的长度。而sds字符串是通过len属性保存字符串的大小，所以它是二进制安全的。

## 其他小函数实现
在阅读源码的过程中，也发现了两个个人比较感兴趣趣的函数：

> * sdsll2str（将long long类型的整型数字转成字符串）
> * sdstrim （去除头部和尾部的指定字符）

我这两个函数拉出来做了测试，在项目的`redis-4.0/tests`目录下。`sdstrim`函数的实现源码上面有列出，看看`sdsll2str`的实现：

    int sdsll2str(char *s, long long value) {
        char *p, aux;
        unsigned long long v;
        size_t l;
    
        /* 通过取余数得到原字符串的逆转形式 */
        v = (value < 0) ? -value : value;
        p = s;
        do {
            *p++ = '0'+(v%10);
            v /= 10;
        } while(v);
        if (value < 0) *p++ = '-';
    
        /* Compute length and add null term. */
        l = p-s;
        *p = '\0';
    
        /* 反转字符串 */
        p--;
        while(s < p) {
            aux = *s;
            *s = *p;
            *p = aux;
            s++;
            p--;
        }
        return l;
    }

函数是通过不断取余数，得到原字符串的逆转形式，接着，通过从尾部开始将字符逐个放到字符串s中，看起来像是一个反转操作，从而实现了将整型转为字符串的操作。

觉得感兴趣是因为`sdsll2str`这个函数在之前学习C语言的时候经常能看到作为问题出现，能看到如此简洁的实现，表示眼前一亮。而在PHP开发时经常使用trim函数，所以想看看它们的区别。

## 总结
通过详细地阅读sds的源码，不仅学习到sds的实现细节，还学习到了一些常用字符串操作函数的实现。如果只是仅仅看看数据结构的定义也可以初步了解，但是要深入了解的话还是需要详细的阅读具体函数的实现代码。还是那句，写代码的，需要阅读更多代码来增强灵感。

我在github有对Redis源码更详细的注解。感兴趣的可以围观一下，给个star。[Redis4.0源码注解](https://github.com/hoohack/read-redis-src)。可以通过[commit记录](https://github.com/hoohack/read-redis-src/commits/master)查看已添加的注解。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点个赞吧，谢谢^_^

更多精彩内容，请关注个人公众号。

![](https://www.hoohack.me/assets/images/qrcode.jpg)