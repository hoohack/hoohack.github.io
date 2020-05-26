---
layout: post
title: "理解Java8中的时间API"
date: '2020-05-23 8:30:00'
author: hoohack
categories: Java
excerpt: 'Java,LocalTime,LocalDate,Instant,LocalDateTime,java8 time'
keywords: 'Java,LocalTime,LocalDate,Instant,LocalDateTime,java8 time'

---

在Java8之前，在Java开发过程中，如果要操作时间，是使用Date这个类，在Java8中新增了LocalTime、LocalDate和LocalDateTime，日期和时间的处理变得更加方便和容易。用了一段时间，刚开始每次用的时候都要上网查一波才能找到要的答案，后来认真看一下官网的API，发现也不是那么难理解，现在能够通过自己的理解找到自己想要的表达式，在这里做个小小的学习总结。

## 为什么要有新的时间API
既然Date类已经存在了那么多年，为什么要花那么大的精力去做这个改动？收益是什么呢？

首先，因为Date类真的很难用，有很多过于Geek的设计，比如月份是从0开始，0是一月，11是十二月。好吧，我已经知道程序员是从0开始计数了，但是每次用的时候都要做各种转换，特别是跟其他输出端有交互的时候，改错一个地方就凌乱了。在新的API`java.time`里，这些都用常量表示了，不会用错，代码看起来也更加清晰。

<!--more-->

在业务代码中，往往有很多种需求，获取某一天的0点，获取下一天的中午时间，将当前时间往前或者往后移动几天，等等这类的需求，这些功能使用Date类配合Calendar要写好多代码，代码简洁性也不够好。

另外一个，Date里面的很多方法都弃用了，如果新的项目还敢用这些类，那就是给自己埋坑了，还是趁早改了为好。

旧的时间类`java.util.Date`和格式化类`SimpleDateFormatter`都是可变类，不是线程安全的，在多线程环境下对共享变量Date进行操作时，需要自己保证线程安全。而新的时间API`LocalTime`和`LocalDate`和格式化类`DateTimeFormatter`都是final类(不可变)且是线程安全的。

基于上面的这些原因，就没有理由不使用新的时间API了。

从一个用着习惯了很多年的工具切换到新的工具总是很不习惯，过程是痛苦的，但是结果是美好的。

## 怎么理解新的时间API
在新的时间API里，有`LocalTime`、`LocalDate`、`LocalDateTime`三个类，`LocalTime`只处理时间，无法包含日期，`LocalDate`只处理日期，无法包含时间，只有`LocalDateTime`能同时处理日期和时间。

## 怎么使用？
如果理解了三个类的区别，那么在使用上，需要根据具体情况来处理，下面看看比较常遇到的场景。

### LocalDate
只取日期，年月日。

**获取今天的日期**

```LocalDate today = LocalDate.now();// 2020-05-20```

**使用年月日构造一个日期**

```LocalDate valentineDay = LocalDate.of(2020, 5, 20); // 月份和日期是从1开始```

**指定对象，获取年、月、日、星期几**
```java
int year = localDate.getYear();
Month month = localDate.getMonth();
int day = localDate.getDayOfMonth();
DayOfWeek dayOfWeek = localDate.getDayOfWeek();
```

或者

```java
int year = localDate.get(ChronoField.YEAR);
int month = localDate.get(ChronoField.MONTH_OF_YEAR);
int day = localDate.get(ChronoField.DAY_OF_MONTH);
int dayOfWeek = localDate.get(ChronoField.DAY_OF_WEEK);
```

### LocalTime
获取时间，只会取几点几分几秒。

**初始化时间对象**

```LocalTime localTime = LocalTime.now();```

**使用时分秒构造一个对象**

```LocalTime localTime = LocalTime.of(12, 0, 0);```

**指定对象，获取时分秒**

```java
LocalTime localTime = LocalTime.now();

int hour = localTime.getHour();
int minute = localTime.getMinute();
int second = localTime.getSecond();

int hour = localTime.get(ChronoField.HOUR_OF_DAY);
int minute = localTime.get(ChronoField.MINUTE_OF_HOUR);
int second = localTime.get(ChronoField.SECOND_OF_MINUTE);
```

### LocalDateTime
获取日期+时间，年月日+时分秒，含义等于LocalDate+LocalTime

**创建时间对象**

```LocalDateTime localDateTime = LocalDateTime.now();```

**使用LocalDate结合LocalTime构造时间对象**
```java
LocalDateTime localDateTime = LocalDateTime.of(localData, localTime);
LocalDateTime localDateTime = localDate.atTime(localTime);
LocalDateTime localDateTime = localTime.atDate(localDate);
```

**通过LocalDateTime获取LocalDate和LocalTime**

```java
LocalDate localDate = localDateTime.toLocalDate();
LocalTime localDate = localDateTime.toLocalTime();
```

## Instant
这个类是表示时间轴上的某一个时刻的时间点。从**1970-01-01 00:00:00**这个时间开始计算，主要用于获取时间戳，与`System.currentTimeMillis()`（精确到毫秒）类似，但是Instant类可以精确到纳秒。

**创建Instant对象**

```Instant instant = Instant.now();```

**使用时间戳创建Instant对象**

```Instant instant = Instant.ofEpochSecond(100, 100000);```

**获取秒数和毫秒**

```java
instant.getEpochSecond();
instant.getEpochMill();
```

## 举例子加深印象
介绍了这几个类的基本API后，再通过实现某些具体的需求来加深印象。

### 获取当前时间戳

```java
// 获取当前时间对象->设置时->转换成时间戳
public static long getCurrentSeconds() {
	return Instant.now().atZone(ZoneOffset.of("+8")).toEpochSecond();
}
```

### 获取当天零点/结束时间的时间戳
```java
// 使用日期和时间构造日期时间对象->指定时区转换成时间戳
public static long getTodayStartTime() {
	return LocalDateTime.of(LocalDate.now(), LocalTime.MIN).toEpochSecond(ZoneOffset.of("+8"));
}

public static long getTodayEndTime() {
    return LocalDateTime.of(LocalDate.now(), LocalTime.MAX).toEpochSecond(ZoneOffset.of("+8"));
}

```

### 获取前一天零点
```java
// 使用日期和时间构造日期时间对象->修改日期->指定时区转换成时间戳
public static long getYesterdayStartTime() {
	return LocalDateTime.of(LocalDate.now(), LocalTime.MIN).minusDays(1).toEpochSecond(ZoneOffset.of("+8"));
}
```

### 根据时间戳获取时间戳表示的时间当天0点
```java
// 使用时间戳构造日期时间对象->修改日期->指定时区转换成时间戳
public static long getDayStartTime(long ) {
	return LocalDateTime.of(LocalDate.now(), LocalTime.MIN).minusDays(1).toEpochSecond(ZoneOffset.of("+8"));
}
```

### 判断是否月初第一天
```java
public static boolean isFirstDayOfMonth(String ymd) {
    LocalDate localDate = LocalDate.parse(ymd, DateTimeFormatter.ofPattern("yyyyMMdd"));
    return localDate.equals(localDate.withDayOfMonth(1));
}
```

## 总结

![理解Java8中的时间API](https://www.hoohack.me/assets/images/2020/05/understand-java-8-time.png)

Java新的时间API很强大，这里只能举几个自己遇到比较多的场景给大家介绍，所讲的只是最基础最皮毛的东西，要熟练的掌握所有的细节，还是需要去看看API或源码的实现，然后在平时具体的需求场景中慢慢积累。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点个赞吧，谢谢

更多精彩内容，请关注个人公众号。

![](https://www.hoohack.me/assets/images/qrcode.jpg)
