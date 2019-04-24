---
layout: post
title: "从不可描述的服务雪崩到初探Hystrix"
date: '2019-03-11 08:00:00'
author: hoohack
categories: Hystrix
excerpt: 'Hystrix,服务雪崩,服务熔断,服务隔离,高可用分析'
keywords: 'Hystrix,服务雪崩,服务熔断,服务隔离,高可用分析'
---

什么是服务雪崩？什么是服务保护？服务保护的措施有哪些？熔断怎么做？限流怎么做？服务隔离怎么做？降级怎么做？

## 真实案例

举一个自己遇到的真实的例子。
接口A依赖了服务B，接口A的部署情况是有两个机房部署，服务B的部署情况也是两个机房部署。用户请求接口失败会重试，部署架构图如下：

![服务部署架构](https://www.hoohack.me/assets/images/2019/03/ServiceStructure.png)

<!--more-->

说明：服务部署用到的是`Linux+Nginx+PHP`技术栈。

当时遇到的情况是服务B所在的机房挂了，导致接口A调用服务B超时，超时返回之后nginx重试到A的另一个节点，继续调用服务B，A的所有节点都失败后，返回给客户端失败结果，客户端进行重试，于是再进行一次刚刚的步骤，这些超时的请求占用了PHP的进程没有释放，同时用户侧体验感知到缓慢，于是不断刷新重试，导致流量暴涨，PHP的进程池被耗尽了，于是接口A就无法访问了，其他依赖接口A的功能也无法使用，导致整个站点雪崩。

这是典型的服务没有进行隔离导致功能雪崩的例子，那么问题来了，如果要对这次的故障进行改进，为接口和服务之间加入一层服务保护，那么要怎么做呢？

业界比较常见的服务保护主要有以下这些：

1、限流

当发现服务失败数量达到某个阈值，拒绝访问，限制更多流量的到来，防止过多失败的请求将资源耗尽。

2、服务隔离

将不同类型的接口隔离部署，单个类型接口的失败甚至进程池被耗尽不会影响其他接口的正常访问，比如在资讯平台中，如果发布和阅读的接口分开部署了，那么即使发布功能失效，阅读功能还能继续使用。

3、熔断

从接口请求连接就拒绝访问，类似家里用的保险丝，使用的电器总和超过了电压就熔断保险丝，整个电路短了，保护整个区域的电路防止更多的损失。

4、降级

对于简单的展示功能，如果有失败的请求，返回默认值。对于整个站点或客户端，如果服务器负载过高，将其他非核心业务停止，以让出更多资源给其他服务使用。

以上是笔者所知道服务出现雪崩的情况以及保护服务的措施，在Java领域中，业界用得比较多的是Hystrix，那么就来看看它是怎么实现上面这些措施。

## Hystrix是什么？
Hystrix是一个通过增加延迟容错和容错逻辑来控制分布式服务之间交互的一个库。Hystrix通过线程隔离，防止错误级联传递，导致服务雪崩，从而提高服务稳定性。

### Hystrix的主要目标
1、通过隔离第三方客户端库访问依赖关系，防止和控制延迟和故障；

2、防止复杂分布式系统的级联失败；

3、快速响应失败并迅速恢复；

4、提供回滚以及友好降级；

5、实现近实时监控，告警和操作控制

### Hystrix设计原则
1、防止单个依赖耗尽了服务容器的用户线程

2、降低负载以及快速失败，而不是排队

3、当可以阻止服务的失败时提供回退策略

4、使用隔离技术减少任意依赖的影响

5、通过近实时指标、监控和告警优化发现时间

6、在Hystrix的大多数方面，通过配置更改的低延迟和对动态属性更改的支持，使得可以在低延迟的情况下进行实时修改操作，从而优化恢复时间

7、防止整个依赖关系客户端执行中的故障，而不仅仅是网络流量

### Hystrix如何做到上面的目标
1、所有外部的调用都封装到HystrixCommand或HystrixObservableCommand对象，这些对象通常在单独的线程下执行。

2、超时调用的时间，超过定义的阈值。有一个默认值，但是对于大多数的依赖，你可以自定义该属性使得略高于每个依赖测量的99.5%的性能。

3、为每一个依赖项维护一个线程池（或者信号），如果依赖项的线程池满了，新的依赖请求不会继续排队等待，而是马上被拒绝访问。

4、计算成功、失败、超时和线程拒绝的数量。

5、如果依赖服务的失败百分比超过阈值，则手动或自动启动断路器，在一段时间内停止对指定服务的所有请求。

6、为请求失败、被拒绝、超时或短路情况提供回退逻辑。

7、近乎实时地监控指标和配置更改。

### 一段代码demo
讲完这么多，还是看看代码更实在，从Hystrix官网上截取了一段代码如下：

    public class Order {

        private final int orderId;
        private UserAccount user;
    
        public Order(int orderId) {
            this.orderId = orderId;
    
            user = new GetUserAccountCommand(new HttpCookie("mockKey", "mockValueFromHttpRequest")).execute();
        }
    
    }

更多代码内容：[https://github.com/Netflix/Hystrix/tree/master/hystrix-examples/src/main/java/com/netflix/hystrix/examples/demo](https://github.com/Netflix/Hystrix/tree/master/hystrix-examples/src/main/java/com/netflix/hystrix/examples/demo)

上面就是Hystrix使用的实例，在实际代码中，就是new一个Command，然后调用execute方法获取结果，那么这一个过程中Hystrix做了什么呢？

### Hystrix的工作流程

![服务部署架构](https://www.hoohack.me/assets/images/2019/03/HystrixWorkFlow.png)

上面这个图是从Hystrix的官方文档中找到的，能看懂这个文档几乎就能看懂Hystrix是怎么执行的了。通过图中的顺序来解读Hystrix的执行流程。

1、初始化，有两种方式初始化一个Hystrix命令，通过new HystrixCommand或者new HystrixObservableCommand创建，使用服务实例和请求服务需要的参数来构造一个Hystrix命令。

2、成功创建Hystrix后，有四种方法执行实际的命令并得到返回结果。这里Hystrix还使用了响应式编程来设计，这个主题比较大，一时半会解释不出，之后再深入探索。

对于使用HystrixCommand创建命令的实例，执行execute或者queue；而对于使用HystrixObservableCommand创建命令的实例，执行observe或者toObservable方法，可以请求服务然后得到执行结果。这四个方法的特性是：

    execute - 会阻塞，然后返回依赖服务的结果
    queue - 返回一个Future，然后可以通过get方法获得依赖服务的结果。
    observe - 订阅包含依赖服务响应结果的订阅器，当有结果时返回一个订阅器。
    toObservable - 返回一个订阅器，当订阅它时，会知晓Hystrix命令并返回结果。

execute的源码如下：

    public R execute() {
        try {
            return queue().get();
        } catch (Exception e) {
            throw Exceptions.sneakyThrow(decomposeException(e));
        }
    }

    public Future<R> queue() {
        /*
         * The Future returned by Observable.toBlocking().toFuture() does not implement the
         * interruption of the execution thread when the "mayInterrupt" flag of Future.cancel(boolean) is set to true;
         * thus, to comply with the contract of Future, we must wrap around it.
         */
        final Future<R> delegate = toObservable().toBlocking().toFuture();
        // 其他定义
    }

从源码看到，execute方法会调用queue().get()方法，queue()会调用toObservable().toBlocking().toFuture()，说明每一个Hystrix命令最终都回到Observable对象的实现，即使是为了返回一个简单的值。

3、判断Hystrix是否启用缓存且对应请求有缓存值，则返回缓存的结果。

4、如果3没有缓存，Hystrix会检查它的熔断器，如果此时熔断器开启了，那么Hystrix不会执行命令，直接返回降级结果。

5、如果信号或者线程池拒绝请求，返回降级结果。

6、Hystrix通过调用HystrixCommand.run()或者HystrixObservableCommand.construct()方法来触发调用外部服务的操作，如果超时或者失败，返回降级结果。
    如果run或者construct方法超过了命令定义的超时值，线程会抛出TimeoutException，此时Hystrix捕捉到异常，就会忽略run或construct方法的返回值，进入fallback。
    
    注意：没有任何方式可以阻止延迟的线程停止工作，在JVM中，Hystrix可以做到最好的就是抛出一个InterruptedException，如果Hystrix封装的服务没有捕获InterruptedException，Hystrix线程池中的线程会继续它的工作。

7、不管请求如何进行：成功、失败、超时、熔断，Hystrix都会上报健康状态到熔断器，记录服务状态，用于判断是否启动／半启动熔断器。

8、fallback，进行降级操作，会触发回退操作的条件：
    construct或者run方法抛出异常
    熔断器开启
    线程池以及队列或者信号容量不足
    Hystrix命令超时
    
对于每一个Hystrix命令，都需要覆盖getFallback方法，在fallback函数中实现降级的方案，如果需要在fallback中使用网络调用，那么需要通过另一个HystrixCommand或者HystrixObservableCommand。在HystrixCommand中是实现getFallback方法，在HystrixObservableCommand中，是实现sumeWithFallback方法。

如果没有实现fallback方法，或者fallback方法抛出了异常，Hystrix还是会返回一个Observerable，但是不会返回内容并通过一个onError通知来马上终止。通过onError通知，发生异常的会被返回Hystrix的调用者。尽量不要写出可能会抛出异常的fallback实现。

9、如果一切正常，那么Hystrix会发送成功的结果到Observable，程序再去获取。

## 总结
以上就是Hystrix的执行流程，因为最近想了解在PHP中如何实现服务熔断，于是在学习Java中做的比较好的Hystrix是怎么实现的。接下来会继续深入学习Hystrix的熔断器实现，下次再分享Hystrix熔断器的实现原理。

了解一个库的执行流程，除了有助于开发时排查遇到的较棘手的问题，还可以学习一个库的设计理念，从这些库中吸收一些框架设计优点，之后如果需要实现相关功能时，就可以作为参考。


原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点个赞吧，谢谢^_^

更多精彩内容，请关注个人公众号。

![](https://www.hoohack.me/assets/images/qrcode.jpg)