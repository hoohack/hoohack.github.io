---
layout: post
title: "你附近的人都有谁，这个功能是怎么实现的？"
date: '2020-09-19'
tags: blog
author: hoohack
categories: Redis
excerpt: 'redis,geo,geohash,附近的人,geoadd,georadius,SpringBoot使用RedisGeo'
keywords: 'redis,geo,geohash,附近的人,geoadd,georadius,SpringBoot使用RedisGeo'
---

手机上很多软件都有附近的人的功能，比如微信的“附近的人”，美团的“附近的餐厅”等等，那么这些功能可以怎么实现呢？

## Redis中的Geo命令
在Redis在3.2版本新增了一个功能，就是GEO（地理位置），这个GEO功能总共有6个函数，分别为：

GEOADD：添加指定的地理位置坐标值到指定的key中，可以同时添加多个。

语法：```GEOADD location-set longitude latitude name [longitude latitude name ...]```

GEODIST：计算两个给定位置之间的距离，可指定距离的单位，默认是米。

语法：`GEODIST location-set location-x location-y [unit]`



GEOHASH：获取地理位置的geohash值。

语法：`GEOHASH key member [member …]`

GEOPOS：指定key和member，返回所有指定名称的位置

语法：`GEOPOS location-set name [name ...]`

GEORADIUS：给定经纬度信息，以给定的经纬度为中心，查询与中心位置距离不超过给定最大距离(radius)的所有地理位置元素。

语法：`GEORADIUS location-set longitude latitude radius m|km|ft|mi [WITHCOORD] [WITHDIST] [ASC|DESC] [COUNT count]`

GEORADIUSBYMEMBER：与`GEORADIUS`命令类似，给定中心位置，查询附近的地理位置元素，与`GEORADIUS`命令不同的是，这个命令的中心点是某个成员，是从用户的维度来查询。

语法：```GEORADIUSBYMEMBER location-set location radius m|km|ft|mi [WITHCOORD] [WITHDIST] [ASC|DESC] [COUNT count]```

更详细的参数说明可参考[redis文档](https://redis.io/commands#geo)。

实现附近的人等方法就是通过`GEOADD`将多个用户的地理位置坐标保存到Redis，使用`GEORADIUS`就可以获得某个中心点指定范围内附近的人的所有地理位置元素及距离等信息。

## 使用示例
来看看具体是怎么使用的：

**使用GEOADD添加地理位置坐标**

![geoadd](https://www.hoohack.me/assets/images/2020/09/geoadd.jpg)

**使用GEORADIUS查找附近的人**

![georadius](https://www.hoohack.me/assets/images/2020/09/georadius.jpg)

**使用GEORADIUSBYMEMBER查找附近的人**

![georadiusbymember](https://www.hoohack.me/assets/images/2020/09/georadiusbymember.jpg)

## 使用注意事项
1、异常

注意在Java应用代码中调用georadius和georadiusbymember这两个指令，在没有数据的时候，会抛异常` redis.clients.jedis.exceptions.JedisDataException`，所以在使用这个命令的时候，需要对方法进行try...catch...，或者自己封装一层，如果没有数据或者异常的时候返回空的数据。

2、如何删除单个用户的位置数据

Redis的Geo只提供了六个命令，没有提供删除地理位置的指令，而Redis-geo的底层数据结构是ZSET，因此可以通过ZREM命令来删除某个成员的位置元素。

![zrem-geo](https://www.hoohack.me/assets/images/2020/09/zrem-geo.jpg)

3、单位

查询出来的距离单位，就是查询时指定的单位，比如查询时指定了km，那么距离的单位就是km。

4、经纬度1度的跨度是多少

在经线上，纬度每差1度,实地距离大约为111千米

在纬线上，经度每差1度,实际距离为111×cosθ千米。（其中θ表示该纬线的纬度.在不同纬线上,经度每差1度的实际距离是不相等的）。

在生成测试数据时需要注意这一点，如果随便生成数据，在查询时可能会找不到。

到这里为止，在Redis中使用geohash来实现附近功能的使用就介绍完了，使用起来就是这么简单，如果只是为了使用，看到这里就够了。如果你还想了解一下geohash的原理，那么请继续往下看。

## 实现原理
Redis的Geo功能底层使用的数据结构是ZSET，算法是geohash算法。

### Z阶曲线

Z阶曲线如下所示，曲线看起来比较清晰，生成一个Z阶曲线只需要把每个Z的首尾相连即可。

![Z-line](https://www.hoohack.me/assets/images/2020/09/Z-line.jpg)

### Geohash描述

Geohash是一种位置编码算法，它是基于[Z阶曲线](https://en.wikipedia.org/wiki/Z-order_curve)，把空间区域分割为多个网格/桶来存储，Geohash对地理位置编码后保存到字符串中。

Geohash保证，如果编码得到的字符串的共同前缀长度越长，两点之间的距离就越近，但是反过来是不保证的，两个很接近的点，可以有不同的/很少的共同字符串前缀。嗯，这是一个充分不必要条件。

简单的理解，Geohash就是将每一个经纬度的位置信息进行编码后得到编码字符串保存，而编码字符串相似的点，表示距离相近（也有特殊的情况），因此当根据某个中心点查找附近的人时，可以使用字符串前缀匹配算法来查找附近的人的位置信息。

### Geohash特点与好处

Geohash有两个特点：

1、对于每一个位置，都有唯一的Geohash编码

2、Geohash可以用来做地理标记

在数据库中使用geohash编码保存位置信息还有两个好处：

1、使用geohash来做索引，查询时会非常快

2、geohash的索引可以实现非常快的临近点搜索，因为越接近的点，所在的索引范围越小

### Geohassh编码

在进行编码时，geohash使用“二分逼近法”来得到经纬度的二进制，经度的范围是[-180,180]，纬度的范围是[-90,90]，编码过程如下：

1、将区间以中位数一分为二得到左右区间，如果数值比中位数大，则落在右区间，得到编码1，否则落到左区间，得到编码0

2、从第一步得到的新区间，继续将区间以中位数一分为二得到新的左右区间，继续判断数值的范围，如果数值比中位数大，则落在右区间，得到编码1，否则得到编码0

3、递归执行上述的过程，不断逼近所求数值，直到得到所要的长度

通过二分法不断逼近目标值获得0/1来得到某个数值的二进制编码，而编码的长度与要求的精度有关，长度与精度的对应关系见下表：

| geohash length | 	lat bits	| lng bits	| lat error	| lng error	| km error |
| :----: |   :----:   |   :----:  |  :----:  |  :----:  |  :----:  |  :----:  |  :----:  |
| 1 | 2 | 3 | ±23 | ±23 | ±2500 |
| 2 | 5	| 5 | ±2.8 | ±5.6 | ±630 |
| 3	| 7	| 8 | ±0.70 | ±0.70 | ±78 |
| 4	| 10 | 10 | ±0.087 | ±0.18 | ±20 |
| 5	| 12 | 13 | ±0.022 | ±0.022 | ±2.4 |
| 6	| 15 | 15 | ±0.0027 | ±0.0055 | ±0.61 |
| 7	| 17 | 18 | ±0.00068 | ±0.00068 | ±0.076 |
| 8	| 20 | 20 | ±0.000085 | ±0.00017 | ±0.019 |

### 编码过程示例

以经纬度(23.157 113.273)为例子，二进制编码长度取10位，编码过程如下：

纬度：23.157

| 编码 | 左区间 | 中位数 | 右区间 |
| :----: | :----: | :----:  |  :----:  |
| 1 | -90 | 0 | 90 |
| 0 | 0 | 45 | 90 |
| 1 | 0 | 22.5 | 45 |
| 0 | 22.5 | 33.75 | 45 |
| 0 | 22.5 | 28.125 | 33.75 |
| 0 | 22.5 | 25.3125 | 28.125 |
| 0 | 22.5 | 23.90625 | 25.3125 |
| 0 | 22.5 | 23.203125 | 23.90625 |
| 1 | 22.5 | 22.8515625 | 23.203125 |
| 1 | 22.8515625 | 23.0273438 | 23.203125 |

得到编码序列：1010000011

经度：113.273

| 编码 | 左区间 | 中位数 | 右区间 |
| :----: | :----: | :----:  |  :----:  |
| 1 | -180 | 0 | 180 |
| 1 | 0 | 90 | 180 |
| 0 | 90 | 135 | 180 |
| 1 | 90 | 112.5 | 135 |
| 0 | 112.5 | 123.75 | 135 |
| 0 | 112.5 | 118.125 | 123.75 |
| 0 | 112.5 | 115.3125 | 118.125 |
| 0 | 112.5 | 113.90625 | 115.3125 |
| 1 | 112.5 | 113.203125 | 113.90625 |
| 0 | 113.203125 | 113.554688 | 113.90625 |

得到编码序列：1101000001

### 编码组合

经过计算，纬度的编码序列：1010000011，经度的编码序列：1101000001。

编码后得到的经纬度二进制再进行重新组合，每一个经纬度都是一组数据，纬度放奇数位，经度保存在偶数位，从左到右，下标从0开始，组合后的编码序列：11100 11000 00000 00111，转化为十进制后，分别是28 24 0 13，根据Geohas使用的Base32编码，得到的编码字符串是ws0e。

![base32](https://www.hoohack.me/assets/images/2020/09/base32.png)

验证编码结果：

![geohash](https://www.hoohack.me/assets/images/2020/09/geohash.jpg)

至于为什么要把经纬度分别安排在奇数和偶数位，前面提到，Geohash是基于Z阶曲线实现的，如下图所示，Z阶曲线实现中，空间被划分为多个网格，x 轴就是纬度，y轴就是经度。经度放偶数位，纬度放奇数位就是这样而来的。

![z-line-grid](https://www.hoohack.me/assets/images/2020/09/z-line-grid.jpg)

## Redis中查找距离

进行了编码和数据存储之后，就可以查询中心点附近的地理位置。

在Redis中的实现代码这里不展开了，有兴趣的可参考这份代码注释：https://blog.huangz.me/diary/2015/annotated-redis-geo-source.html

简单的说，是这样的：

1、添加的地理位置数据底层使用跳跃表保存

2、利用输入的中心点和输入半径确定待搜索的区域范围对象。这个范围对象包含了满足条件的经度以及对应的能覆盖目标区域的九宫格区域（目标是为了查询八个方向，四面八方）

3、遍历九宫格，根据每个geohash网格的范围框选出位置对象，最终找到满足条件的对象

以上，就是本次要介绍的内容，从实践和原理上分析了geohash算法实现距离查找的功能，了解了原理，使用起来就更加随心应手。

参考资料：

[https://en.wikipedia.org/wiki/Geohash](https://en.wikipedia.org/wiki/Geohash)

[https://halfrost.com/go_spatial_search/](https://halfrost.com/go_spatial_search/)

[https://www.cnblogs.com/LBSer/p/3310455.html](https://www.cnblogs.com/LBSer/p/3310455.html)

[https://redis.io/commands#geo](https://redis.io/commands#geo)

[https://en.wikipedia.org/wiki/Z-order_curve](https://en.wikipedia.org/wiki/Z-order_curve)

[https://blog.huangz.me/diary/2015/annotated-redis-geo-source.html](https://blog.huangz.me/diary/2015/annotated-redis-geo-source.html)

[https://segmentfault.com/a/1190000020977911](https://segmentfault.com/a/1190000020977911)

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。



