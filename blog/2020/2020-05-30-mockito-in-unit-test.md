---
layout: post
title: "Mockito-提高单元测试效率利器"
date: '2020-05-30'
tags: blog
author: hoohack
categories: Java
excerpt: 'Java,Mockito,unit,JUnit,UnitTest,Mockito Exception,Mockito void,Mockito static,PowerMock'
keywords: 'Java,Mockito,unit,JUnit,UnitTest,Mockito Exception,Mockito void,Mockito static,PowerMock'

---

## 前言
之前在开发进行到写单元测试阶段的时候，发现要测试的方法里面是包含依赖的：外部接口RPC调用、DB调用。在某些情况下，部分依赖不稳定或者无法在测试环境调用时，会导致用例偶尔执行失败。

另外一点，很多用例都是在测试用例的开头写了`@SpringRunTest`的注解，导致跑用例的时候会启动整个Spring容器，这样一来，运行测试用例就非常慢了。当在一些比较大的项目运行用例时，甚至达到了每次启动容器需要5-6分钟的时长，渐渐就有点受不了这种操作，每改一行代码心里都焦急，因为如果错了的话又要再等5-6分钟才能看到效果了。后来请教同事和上网搜索，找到了一种比较快且安全的方案，使用Mock框架--[Mockito](https://site.mockito.org/)，学习并实践了一段时间，总结一下使用方法。



## Mockito
Mockito是当前最流行的单元测试Mock框架。

### 什么是Mock
Mock的字面意思就是模仿，虚拟，在单元测试中，使用Mock可以虚拟出一个外部依赖对象。

对于在单元测试中一些不容易构造或者不容易获取的对象（如外部服务），用一个Mock对象来创建，可以降低测试的复杂度，只关心当前单元测试的方法。

### 为什么用Mock
单元测试的目的就是为了验证一个代码单元的正确性，真正要验证的只是某个输入对应的输出的正确与否。如果把外部依赖服务引入进来，就会增加原来单元的复杂度，且在该单元中隐形地掺杂了其他功能的内容。

使用Mock对象进行单元测试，开发可以只关心要测试单元的代码。

## 使用示例
先看看代码示例，假设有以下的场景：

 >* 验证获取用户信息接口：包含用户ID、用户昵称、是否vip
 >* 是否vip需要外部服务VIPService获取，通过RPC调用，测试环境如果机器性能较差或者网络不好会导致用例不稳定
 >* 编写单元测试判断用户VIP信息返回是否正确

需求是判断获取用户信息接口返回的格式是否正确，与vip接口的返回值无关，只要透传vip接口返回的字段即可，测试代码如下：

```java
@RunWith(PowerMockRunner.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private VIPService vipService;

    @Test
    public void getUserInfo() {
        Mockito.when(vipService.isVip(Mockito.anyString())).thenReturn(true);

        Result result = userService.getUserInfo("123");

        Assert.assertEquals(true, result.getData().get("isVip"));
    }
}
```


解释下上面代码用到的几个注解

**@Mock**：创建一个Mock

**@InjectMocks**：Mock一个实例，其余用Mock注解创建的mock将被注入到该实例中。

**Mockito.when(...).thenReturn(...)**：Mock方法，如果满足when里面的条件，返回thenReturn指定的结果。

在这段代码里，使用`@Mock`注解创建了一个VipService实例，使用`@InjectMock`创建了UserService，Mock创建的vipService实例会被注入到UserService的实例中，在写测试用例的时候就可以模拟vipService的行为。

`Mockito.when(vipService.isVip(Mockito.anyString())).thenReturn(true);`
这段代码表示不管传任何参数给vipService.isVip方法，该方法都会返回true，这样，就不影响获取用户信息接口的正常测试，也可以使用断言验证返回的数据。

## 遇到过的场景
以上是使用Mockito实践最简单的示例，在生产环境使用过程中，会有各种各样的需求需要满足，下面列一下笔者遇到过的场景。

### mock异常
这种场景是，方法里面声明了可能会抛出A异常，而A异常有多种可能性，不同的异常对应不同的message，为了验证抛出某种A异常后的功能，就需要模拟方法抛出指定message的A异常。

使用方式是定义一个`Rule`注解的属性，在使用时，设置thrown抛出的异常类型和所带的message。简要代码如下：


```java
class AException extends RuntimeException {
    private final int code;

    public AException(int code, String msg) {
        super(msg);
        this.code = code;
    }
}

@RunWith(PowerMockRunner.class)
public class MockExceptionTest {

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Test
    public void mockException() {

        thrown.expect(AException.class);
        thrown.expectMessage("expected message");

        // test code
    }

}
```

### mock空方法
mock一个空方法，比较简单，就是调用`doNothing().when()...`。

### mock静态方法
如果要Mock静态方法，首先在类的开头增加注解：`@PrepareForTest({ClassNameA.class})`。

在需要Mock类方法的之前，增加代码：`PowerMockito.mockStatic(ClassNameA.class);`，然后就可以愉快的Mock了。简要代码如下：
```java
class ClassNameA {

    public static int methodA() {
        // code

        return ret;
    }

}

@RunWith(PowerMockRunner.class)
@PrepareForTest({ClassNameA.class})
public class MockStaticClassTest {

    @Test
    public void mockStaticMethod() {
        PowerMockito.mockStatic(ClassNameA.class);

        Mockito.when(ClassNameA.methodA()).thenReturn(1);
        // test code
    }

}
```

### 部分mock
对于某些场景，在一个单元测试里，需要某个方法Mock，某个方法走正常逻辑，这种操作就一点要启动容器，目前还没找到合适的方法可以进行这种操作，如果有更好的方法麻烦指点指点。笔者目前的做法是将原来的方法再拆分，拆分为更小的单元，让各自可以进行Mock，在集成测试时才真正执行全部代码。

以上是笔者在日常开发中遇到的场景

## 总结
单元测试是针对代码逻辑最小单元进行正确性检验的校验工作，写好单元测试，对于发现代码bug、保障系统稳定性以及重构而言都是非常必要的一项工作，可以提前发现一些隐藏问题。

[JUnit最佳实践](https://howtodoinjava.com/best-practices/unit-testing-best-practices-junit-reference-guide)这篇文章提到，Mock所有外部服务和状态：
> Mock out all external services and state
Otherwise, behavior in those external services overlaps multiple tests, and state data means that different unit tests can influence each other’s outcome. You’ve definitely taken a wrong turn if you have to run your tests in a specific order, or if they only work when your database or network connection is active.

> Also, this is important because you would not love to debug the test cases which are actually failing due to bugs in some external system.

所以，还是尽可能使用Mock来进行有外部服务的单元测试。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点个赞吧，谢谢





参考文章
[JUnit Best Practices Guide](https://howtodoinjava.com/best-practices/unit-testing-best-practices-junit-reference-guide)