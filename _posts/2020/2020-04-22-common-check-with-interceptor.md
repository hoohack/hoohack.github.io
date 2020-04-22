---
layout: post
title: "使用拦截器统一处理通用检查"
date: '2020-04-22 22:00:00'
author: hoohack
categories: Java
excerpt: 'Java,AOP,拦截器,代码优化,整洁代码,Spring HandlerInterceptor,HandlerInterceptor,统一处理'
keywords: 'Java,AOP,拦截器,代码优化,整洁代码,Spring HandlerInterceptor,HandlerInterceptor,统一处理'

---

## 繁琐的检查

在平时的业务开发中，相信大家都有很多这样的代码：

```java
public void login(Parameter parameter) {
  if (!validateXXX(parameter)) {
    throw new BizException(ErrCode.PAMRM_ERROR);
  }
  
  // 真正的逻辑代码
}
```



那么，如果代码还有其他通用的校验，而且每加一个接口都要加这些校验逻辑，久而久之，代码会显得较臃肿，看起来会有很多重复的代码，那么有没有办法精简这部分代码呢？有！



## Spring的HandlerInterceptor

先上代码

### 拦截器定义

```java
public class CheckXXXHandlerInterceptor extends HandlerInterceptorAdapter {

    final Map<Method, Boolean> methodCache = new IdentityHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        HandlerMethod handlerMethod = (HandlerMethod) handler;

        /**
        这个是双重判断锁单例
        外层的判断，为了避免在实例已经创建好的情况下再次加锁获取，影响性能；
        里层的判断，考虑在多线程环境下，多个线程同时过掉外层判断，也就是都已经判断变量为空，如果不加一重判断，还是有可能重复创建。
        */
        Method method = handlerMethod.getMethod();
        if (!methodCache.containsKey(method)) {
            synchronized (methodCache) {
                if (!methodCache.containsKey(method)) {
                    boolean check = false;
                    if (method.isAnnotationPresent(CheckXXX.class)) {
                        check = method.getAnnotation(CheckXXX.class).value();
                    } else if (method.getDeclaringClass().isAnnotationPresent(CheckXXX.class)) {
                        check = method.getDeclaringClass().getAnnotation(CheckXXX.class).value();
                    }
                    methodCache.put(method, check);
                }
            }
        }
        if (methodCache.get(method)) {
            // do check
        }

        return true;
    }
}
```


### 注解定义
```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface CheckXXX {
    boolean value() default true;
}
```

### 注解使用
```java
@CheckXXX
public class XXXController {

    public void login(Parameter parameter) {
      // 真正的逻辑代码
    }
}
```

这样，就能抽离出通用的逻辑，精简通用的代码。那么，这个拦截器是什么时候执行的呢？它的实现原理是什么？

### 执行时机

![](https://www.hoohack.me/assets/images/2020/04/Interceptor_UML.png)

通过查看自定义拦截器的UML类图关系，可以看出来，其实是实现了HandlerInterceptor的preHandle方法，通过追踪HandlerInterceptor的调用链路，最终是在请求进入分发器，执行`doDispatch`方法用的，而处理器是在初始化的时候就加载好。

整体的流程如下：

![](https://www.hoohack.me/assets/images/2020/04/Interceptor_Procedure.png)

核心代码：

```java
if (!mappedHandler.applyPreHandle(processedRequest, response)) {
    return;
}


boolean applyPreHandle(HttpServletRequest request, HttpServletResponse response) throws Exception {
    HandlerInterceptor[] interceptors = getInterceptors();
    if (!ObjectUtils.isEmpty(interceptors)) {
        for (int i = 0; i < interceptors.length; i++) {
            HandlerInterceptor interceptor = interceptors[i];
            if (!interceptor.preHandle(request, response, this.handler)) {
                triggerAfterCompletion(request, response, null);
                return false;
            }
            this.interceptorIndex = i;
        }
    }
    return true;
}
```



拦截器数组interceptors是在Spring容器启动的时候初始化好的，实现原理比较简单，就是取出请求处理器的map，遍历调用注册好的拦截器。

## 实现原理

通过拦截器处理通用检查，背后的编程思想其实是AOP，[面向切面编程](https://zh.wikipedia.org/zh-cn/%E9%9D%A2%E5%90%91%E5%88%87%E9%9D%A2%E7%9A%84%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1)。

> * 
使用切面的优点：首先，现在每个关注点都集中于一个地 方，而不是分散到多处代码中;其次，服务模块更简洁，因为它们只包含主要关注点(或核 心功能)的代码，而次要关注点的代码被转移到切面中了。----摘自《Spring实战》

关于AOP，网上有很多资料解释，看维基百科的描述也很清晰，，笔者就不多赘述了。

在这个例子里面，每个接口的核心功能是响应为业务功能提供服务，但是每个接口需要的参数检查、安全检查，都统一交给切面完成。如下图所示：

![](https://www.hoohack.me/assets/images/2020/04/Interceptor_AOP.png)


## 总结
代码和原理比较简单，但是里面包含的知识点却不少，通过追朔源码，能了解细节之余，还能掌握某一类问题的实现方案。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点个赞吧，谢谢^_^

更多精彩内容，请关注个人公众号。

![](https://www.hoohack.me/assets/images/qrcode.jpg)