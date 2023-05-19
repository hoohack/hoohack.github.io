---
layout: post
title:  "[LeetCode]字符翻转--多种解法分析"
date:   '2015-03-28'
tags: tech
author: hoohack
categories: LeetCode
excerpt: '字符翻转,杂耍算法,逆置'
keywords: '字符翻转,杂耍算法,LeetCode,RotateArray,Reverse'
---

最近在LeetCode网站上学习算法，记录一下学到的东西。

##问题描述

>Rotate an array of n elements to the right by k steps.
>
>For example, with n = 7 and k = 3, the array [1,2,3,4,5,6,7] is rotated to [5,6,7,1,2,3,4].
>
>Note:
Try to come up as many solutions as you can, there are at least 3 different ways to solve this problem.



##解法一：一个一个地移动
刚开始看到这道题，题目说有很多种解法，当时我的第一个想法就是一个一个地移动。于是就有下面的解法：

    void rotate(int nums[], int n, int k) {
        int cursor = 0;
        for (int i = 0; i < k; ++i) {
            cursor = nums[n - 1];
            for (int j = 0; j < n - 1; ++j) {
                nums[n-j-1] = nums[n-j-2];
            }
            nums[0] = cursor;
        }
    }

这个算法的时间复杂度是O(n*k)，空间复杂度是O(1)。提交的时候超时了，So，不能用这种方法。

##解法二：杂耍算法
这个算法是比较难想到的，这个算法优点是在执行了GCD(n, k)次后即可停止，程序的走向我是明白的，至于为什么能够如此，还是上网查了很多资料才弄明白了，现在通过自己的语言描述一遍。加深理解。

GCD(Greatest Common Divisor)--最大公约数

###辗转相除法求最大公约数。
两个整数的最大公约数是能够同时整除它们的最大的正整数。辗转相除法基于以下原理

>两个整数的最大公约数等于其中较小的数和两数的差的最大公约数。

先来了解一些数论知识（以下内容摘自《初等数论》，潘承洞著）：

####同余
>设m不等于0, 若`m|a-b`,即`a-b=km`, 则称m为模，a同余于b模m，以及b是a对模m的剩余。记作`a≡b(mod m)`

####同余类
>对给定的模m，有且恰有m个不同的模m的同余类，他们是
0 mod m，1 mod m，…，（m-1）mod m。

####完全剩余系
>一组数y1,y2,…，ys称为是模m的完全剩余系，如果对任意的a有且仅有一个yj是a对模m的剩余，即a同余于yj模m。
>由此可见0,1,2，…，m-1是一个完全剩余系。因此，如果m个数是两两不同余的，那么这m个数便是完全剩余系。

基于以上知识，我们可以证明这样一个事实，即如果i和n互质的话，那么序列：
`0     i mod n  2i mod n       3i mod n       ….   (n-1)*i mod n`
就包括了集合{0,1,2 … n-1}的所有元素。（下一个元素(n)*i mod n 又是0）
为什么呢？

证明：
由于0,1,2，…，n-1本身是一个完全剩余系，即它们两两互不同余。设此序列为Xi（0<=i<=n-1），可得下式：
Xi≠Xj (mod n)
`注：这里由于不能打出不同余字符因此用不等于替代`

由于i与n是互质的，所以
Xi*i ≠i*Xj (mod n)
因此i*Xi是m个互不同余数，那么可断定它们是完全剩余系。得证。

有了上面的结论，那么，如果n与k互质，下面的赋值过程就能完成所有值的赋值(设数组为X[0...n-1],长度为n)：
t = X[0]

X[0] = X[i mod n]

X[i mod n] = X[2i mod n]

……

X[(n-2)*i mod n] = X[(n-1)*i mod n]

X[(n-1)*i mod n] = t

以上操作已经把包括{0,1,…,n-1}所有元素放到了最终位置上，每次完成一个元素的放置。
根据以上我们得到了一个中间结论，如果n和k互质，我们就可以一次完成所有元素的纺织。那么如果n和k不是互质的呢？

那就是让n和k互质。即让k'=k/gcd(k, n),n'=n/gcd(k,n)。这样就构成了一对互质的数。这就意味着需要把整个数组的每g(g=gcd(k,n))个元素组成块，每个块的k'和n'就互质了。每次相当于把g中的一个元素移到最终的位置，由于g是块元素，每个块含有g个元素，所以总共需要g次移动。

    int gcd(int m, int n) {
        if (m % n == 0)
        {
            return n;
        }
        else
        {
            return gcd(n, m%n);
        }
    }

    void rotate(int nums[], int n, int k)
    {
        if (k > n) {
            k %= n;
        }
        if (k % n == 0) return;
        int count = gcd(n, k);
        for(int j = 0; j < count;j++) {
            int temp = nums[n - j - 1];
            int current = n - j - 1;
            int previous = (current - k) % n;
            for (;previous != n - j - 1;previous = (previous - k + n) % n) {
                nums[current] = nums[previous];
                current = previous;
            }
            previous = (previous + k) % n;
            nums[previous] = temp;
        }
    }


##解法三 以n-k为界，分别对数组的两边进行逆置，然后再对整个数组进行一次逆置
这个算法的实现原理我能理解，但是为什么要这样做呢？推导过程是从以结果为导向来推导。

以数组arr[5] = {1, 2, 3, 4, 5};为例。

如果n=5，k=2，则旋转结果为{4, 5, 1, 2, 3}

看上去很像整个数组的逆置{5, 4, 3, 2, 1}

但是还需要变换一下才能得到想要的结果：

发现如果将前面(0,k)和后面(k,n)的两部分分别逆置之后就会得到最终的结果。

即

{5, 4} => {4, 5}

{1, 2, 3} => {3, 2, 1}

于是就有了先将数组前后两部分逆置，然后再将整个数组逆置的解法。

    void swap(int arr[], int a, int b) {
        int temp = arr[a];
        arr[a] = arr[b];
        arr[b] = temp;
    }

    void reverse(int arr[], int begin, int end)
    {
        int mid = (begin + end) / 2;
        for (int i = begin, j = 0; i < mid; i++, ++j) {
            swap(arr, i, end - j - 1);
        }
    }

    void rotate(int nums[], int n, int k)
    {
        if (k >= n) k %= n;
        reverse(nums, 0, n - k);
        reverse(nums, n - k, n);
        reverse(nums, 0, n);
    }


也可以先逆置整个数组，然后在逆置前后两部分。

##解法四 开辟新空间
这个解法就是开辟一个新的空间p保存需要移动的值，然后将原数组移动k位，最后在将p中的值插入到原数组中。

    void rotate(int nums[], int n, int k) {
        if (k >= n) {
            k = k % n;
        }

        int *p = new int[k];
        for (int i = 0; i < k; ++i) {
            p[i] = nums[n - k + i];
        }
        for (int j = 0; j < n - k; ++j) {
            nums[n - j - 1] = nums[n - k - j - 1];
        }
        for (int i = 0; i < k; ++i) {
            nums[i] = p[i];
        }
    }

记录下自己的分析，如果错误和更多建议，欢迎指出。谢谢阅读。
