---
layout: post
title: "Java项目如何分层"
date: '2020-08-07'
tags: blog
author: hoohack
categories: Java
excerpt: 'Java项目结构,Java项目分层,Spring,Controller,Manager,Service,Spring Boot,Spring Web,Java Web'
keywords: 'Java项目结构,Java项目分层,Spring,Controller,Manager,Service,Spring Boot,Spring Web,Java Web'
---

在现在的Java项目中的项目分层，大多数都是简单的Controller、Service、Dao三层，看起来非常简单。

但是，随着代码越写越多，写久了以后，渐渐发现其实并没有把他们真正的职责区分开来，大多数情况下，Controller只是简单的调用Service中的方法，然后就返回；Service之间组合起来处理业务逻辑，甚至有时候Service页只是Dao层的一次简单透传转发。在项目庞大，追求快速发展的情况下，往往不会过于在乎这些细节，所以大部分人都觉得无所谓了，能用就行，久而久之，层级关系逐渐混乱，维护起来就会觉得挺头疼，而且后续如果要扩展业务功能的时候也无法复用。

在很多人眼里，分层这个都无所谓的，新建一个项目的时候都是从一个项目拷过来，反正能运行就行，大家都是这么写，我也这么写就好了，先跑起来再说。

然而每个人的习惯都不一样，有的人习惯在Controller中写一大堆业务逻辑，有的人习惯在Controller里返回Service层的调用，去改别人代码的时候就会很纠结，究竟使用什么风格好呢？特别是一些其他语言转过来的新手往往会疑惑，究竟Controller、Service、Dao这些的区别是什么？应该怎么布局代码呢？当看到代码里的Service大部分都是Dao的封装，就会觉得在Controller里面调用各个Service的方法来处理业务逻辑也是没毛病的。



> 本人不会觉得任何一种做法有任何问题的，以笔者自己亲身经历而言，项目要快速发展或者开发压力较大的情况下，绝对不会反对，也不会嘲笑任何一种做法，但是等到项目稍微稳定或者有时间停下来思考的时候，可以认真思考一下各个层之间的职责和关系，制定一个约定俗成的风格，大家遵循这种风格开发。个人认为风格是没有绝对的好与坏，只要团队里大家统一，那就可以了。

讲了那么多文字，先来点代码更实际一点。以笔者个人比较倾向使用的应用分层，通过以下代码示例来介绍一个好的分层应该是怎么样的。

## 代码示例

```java
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    public HttpResult getUserInfo(Parameter parameter) {
        parameter.validateArgs();
        return userService.getUserInfo(parameter.getUserId());
    }

}

@Service
public class UserService {

    @Autowired
    private UserManager userManager;

    public UserInfoDTO getUserInfo(long userId) {
        if (!userManager.isExists(userId)) {
            return null;
        }

        return userManager.getUserInfo(userId);
    }

}

@Component
public class UserManager {

    @Autowired
    private UserDao userDao;

    public UserInfoDTO getUserInfo(long userId) {
        try {
            Optional<UserDO> userDO = Optional.ofNullable(userDao.queryUserById(userId));
            return userDO.ifPresent(v -> UserInfoDTO.build(v)).orElse(null);
        } catch(Exception e) {
            log.error("exception, {}, ", userId);
        }

        return null;
    }

    public boolean getUserInfo(long userId) {
        try {
            return userDao.countUser(userId) > 0;
        } catch(Exception e) {
            log.error("exception, {}, ", userId);
        }

        return false;
    }
}

public interface UserDao {

    @Select("SELECT count(*) FROM t_user WHERE userId = #{userId}")
    int countUser(@Param("userId")long userId);

    @Select("SELECT * FROM t_user WHERE userId = #{userId}")
    UserDO queryUserById(@Param("userId")long userId);

}

```

## 阿里规范

在互联网里，阿里在Java领域还是比较权威，所以笔者参考的是阿里分层规范，规范如下：

![阿里项目分层规范](https://www.hoohack.me/assets/images/2020/08/alibaba-project-stratify.jpg)

开放接口层:可直接封装Service接口暴露成RPC接口;通过Web封装成http接口;网关控制层等。

终端显示层:各个端的模板渲染并执行显示层。当前主要是velocity渲染，JS渲染，JSP渲染，移动端展示层等。

Web层:主要是对访问控制进行转发，各类基本参数校验，或者不复用的业务简单处理等。

Service 层:相对具体的业务逻辑服务层。

Manager 层:通用业务处理层，它有如下特征:
>* 对第三方平台封装的层，预处理返回结果及转化异常信息;
>* 对Service层通用能力的下沉，如缓存方案、中间件通用处理; 
>* 与DAO层交互，对DAO的业务通用能力的封装。

DAO 层:数据访问层，与底层 MySQL、Oracle、Hbase 进行数据交互。

外部接口或第三方平台:包括其它部门 RPC 开放接口，基础平台，其它公司的 HTTP 接口。

以上图文来自于阿里开发手册，而笔者个人的理解是这样的：

Web层，就是Http的Controller/Thrift的TService层，主要是暴露给前端/内部部门的接口，里面做的是访问控制的转发，完成基本的参数校验，token校验等等，不做任何业务逻辑处理。

Service层，处理具体的业务逻辑，通常是一个功能/接口对应一个Controller，Controller调用Service的业务方法。

Manager层，对所有需要RPC调用的封装，包括但不限于内部接口调用、Dao调用、Redis调用，以及上述调用的异常封装、数据转换；这一层是最适合做复用逻辑抽象的，其他Service也可以调用封装好的Manager。

Dao层，封装数据库层，映射到DB的表和实体类。

## 分层领域模型的转换

阿里规范文档还给了领域模型规范的参考：

DO(Data Object):与数据库表结构一一对应，通过 DAO 层向上传输数据源对象。

DTO(Data Transfer Object):数据传输对象，Service 和 Manager 向外传输的对象。

BO(Business Object):业务对象。可以由 Service 层输出的封装业务逻辑的对象。

QUERY:数据查询对象，各层接收上层的查询请求。注:超过 2 个参数的查询封装，禁止 使用 Map 类来传输。

VO(View Object):显示层对象，通常是 Web 向模板渲染引擎层传输的对象。

规范并不一定是全对的，如果按照上面的数据模型操作，那么数据从数据库读取出来到真正展示到接口层，将经历3-4次的数据实体转换，而这些转换大多是重复的，甚至还会因为漏掉设置某个属性而出现意想不到的bug。所以还是具体情况具体分析，有一条基本原则就是**Controller/TService与Dao的数据不能直接互传**。

## 总结
以上就是本文要介绍的内容，对于业务发展比较稳定的团队，或者没有任何历史代码的团队，项目的分层还是很有必要的，对于之后代码的可维护性及复用性都有很大的帮助。

另外，再次重申，所有的风格都没有绝对的好与坏，只要适合团队，统一使用，那就是好的风格。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。





