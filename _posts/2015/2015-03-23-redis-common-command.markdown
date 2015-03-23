---
layout: post
title:  "Redis常用命令"
date:   '2015-03-23 20:56:41'
author: Hector
categories: Redis
tags: [Redis]
---

##Redis常用命令

###SET 建立一个名为mykey的键，设置其键值为2
127.0.0.1:6379>set mykey 2

OK

###KEYS 获取Redis所有键(当前库只有一个键)
127.0.0.1:6379>KEYS *

1)"mykey"

<!--more-->

注：KEYS * 会遍历Redis中所有键，当键的数量多时会影响性能，不建议在生产环境使用。

###EXISTS 判断一个键是否存在
127.0.0.1:6379>EXISTS mykey

(integer)1

如果键存在则返回整数类型1，否则返回0

127.0.0.1:6379>EXISTS var

(integer)0

###DEL 删除键
127.0.0.1:6379>DEL mykey

(integer)1

127.0.0.1:6379>DEL mykey

(integer)0

返回值是删除的键的个数。第二次执行DEL命令是因为bar键被删除了，实际上并没有删除任何键，所以返回值是0。


###TYPE 获得键值的数据类型
127.0.0.1:6379>TYPE mykey

String

可能的类型有：string字符串类型、hash散列类型、list列表类型、set集合类型、zset有序集合类型等

###INCR 递增数字
127.0.0.1:6379>INCR mykey

(integer)2

127.0.0.1:6379>INCR mykey

(integer)3

###DECR 减少数字
127.0.0.1:6379>DECR mykey
(integer)5

###APPEND 向尾部增加值
127.0.0.1:6379>APPEND mykey a

(integer)6

返回值是追加后字符串的总长度

###STRLEN 获取字符串长度
127.0.0.1:6379>STRLEN mykey

(integer)6

###EXPIRE 设置键的过期时间
在实际开发中经常会遇到一些有时效的数据，如限时优惠活动、连续签到等，过了一定时间就需要删除这些数据。在关系数据库中一般需要额外的一个字段记录到期时间，然后定期检测删除过期数据。
而在Redis中可以使用EXPIRE命令来设置一个键的生存时间，过了生存时间后它会被Redis自动删除。

127.0.0.1:6379>SET session:12306 uid12306

OK

127.0.0.1:6379>EXPIRE session:12306 60

(integer)1

设置session:12306键在60s后过期。返回值为1表示设置成功，返回值为0表示设置失败。

###TTL 查询一个键还有多长的生存时间，也就是多久后会被删除。

返回值的单位为秒。

127.0.0.1:6379>SET mykey hello

OK

127.0.0.1:6379>EXPIRE mykey 20

(integer)2

127.0.0.1:6379>TTL mykey

(integer)16

127.0.0.1:6379>TTL mykey

(integer)2

127.0.0.1:6379>TTL mykey

(integer)-2

随着时间推移，mykey键的生存时间越来越少，20s后mykey键会被删除。当 key 不存在时，返回 -2 。当 key 存在但没有设置剩余生存时间（即该键永久存在）时，返回 -1 。否则，以秒为单位，返回 key 的剩余生存时间。

###PERSIST 取消键的生存时间设置（即将键恢复为永久）。

返回1表示成功清除生存时间，否则返回0（即键不存在或者键本来就是永久的）：

127.0.0.1:6379>SET mykey "hello"

OK

127.0.0.1:6379>EXPIRE mykey 20

(integer)1

127.0.0.1:6379>PERSIST mykey

(integer)1

127.0.0.1:6379>TTL mykey

(integer)-1

除了PERSIST命令之外，使用SET命令为键赋值同时也会清除键的生存时间；或者使用对一个已经带有生存时间的键执行EXPIRE命令，新指定的生存时间会取代旧的生存时间。