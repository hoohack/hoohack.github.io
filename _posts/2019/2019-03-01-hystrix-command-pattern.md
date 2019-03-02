---
layout: post
title: "聊聊Hystrix中的命令模式"
date: '2019-03-02 15:30:00'
author: hoohack
categories: 设计模式
excerpt: 'Hystrix,设计模式,命令模式,Command Pattern,DesignPattern'
keywords: 'Hystrix,设计模式,命令模式,Command Pattern,DesignPattern'
---

最近在实践服务熔断时用到了Hystrix这个框架，觉得里面的设计思想挺值得学习，决定深入研究一番。在学习过程中，发现很多名词还是不太熟悉，还是需要有一些技术准备才能继续深入，第一个遇到的是设计模式中的命令模式，命令模式这个设计模式之前也学过，但是由于没有实践机会，所以很快就忘记，现在有机会来实战一次，温故而知新。

## 定义
直接看维基百科上的定义，Command Pattern（命令模式）

在面对对象编程中，命令模式是一种行为模式，其中对象用于封装执行动作或稍后触发事件所需的所有信息。这些信息包括方法名称，拥有该方法的对象以及方法参数的值。（来自维基百科）

看概念直接解释名词还是比较模糊，先来看看一个具体的实例，然后再继续解释其中的名词模式的定义。

<!--more-->

## 举个例子
需求：为一个电器遥控器编程功能实现，一共开灯、关灯、开风扇、关风扇、风扇调高档、风扇调低档等6按钮。

如果不用命令模式，实现可能会是在按下按钮时，传递具体的指令给遥控对象，遥控对象根据具体的指令实例化对象，并调用对应的操作。

遥控器的实现代码如下所示：
    
    public class RemoteControl {

        private Light light;

        private Fan fan;

        public RemoteControl() {
            light = new Light();
            fan = new Fan();
        }

        public void buttonPressed(String buttonName) {
            if (buttonName.equals(light.getButtonTurnOnName())) {
                light.on();
            } else if (buttonName.equals(light.getButtonTurnOffName())) {
                light.off();
            } else if (buttonName.equals(fan.getButtonTurnOnName())) {
                fan.on();
            } else if (buttonName.equals(fan.getButtonTurnOffName())) {
                fan.off();
            } else if (buttonName.equals(fan.getButtonSetSpeedUpName())) {
                fan.speedUp();
            } else if (buttonName.equals(fan.getButtonSetSpeedDownName())) {
                fan.speedDown();
            }
        }
    }

这里有个比较繁琐的一点是遥控器对象需要根据指令来调用对象的方法，如果需要为遥控器新增功能，比如对灯增加调节档数的功能，那么就需要在遥控器里增加判断，判断是否属于灯光调档的指令，然后才能完成工作。这样的缺点是遥控器始终要关注需要调用的外部服务，如果新增服务时需要改动代码，这样违背了面向接口编程的原则，同时代码也较难维护。

改为使用命令模式，实现的方式是将服务的实现封装到一个对象委托出去，由命令对象来实现具体的调用。只需要将具体的执行指令遥控器，按下按钮后就会开始执行相应的指令，无需入侵业务代码。具体实现代码如下：

    public class RemoteControl {

        private Command command;

        public void command(Command command) {
            this.command = command;
        }

        public void buttonPressed() {
            this.command.execute();
        }

    }
    
    public class RemoteControlRun {

        public static void main(String[] args) {
            Light light = new Light();


            RemoteControl remoteControl = new RemoteControl();
            remoteControl.command(new LightOnCommand(light));
            remoteControl.buttonPressed();

            remoteControl.command(new LightOffCommand(light));
            remoteControl.buttonPressed();
        }

    }

使用命令模式实现此次代码的UML图如下，结合UML图及代码可以看出，这样一来，遥控器只需要实现的是发送执行指令就可以，执行什么指令，就由命令对象去关注这一点，具体要怎么执行，交给接收者去决定。当需要新增指令时，只需要新增命令对象，不需要对遥控器对象进行修改，实现了面向接口编程。同时也可以看到，请求者与接收者通过封装命令对象进行了解耦，当增加指令时，只需要增加命令对象，设置到遥控器，即可实现增加指令的需求，这就是命令模式中可以使用不同请求参数化对象的意思。

![遥控实现UML图](https://www.hoohack.me/assets/images/2019/03/LightOnCommandUML.png)

## 理解命令模式
在命令模式中，有四种角色：命令、接收者、调用者以及客户端。

命令知道具体接收者，也是接收者具体方法的调用方。接收者方法参数的值保存在命令。

执行具体方法的接收者对象通过组合的方式保存在命令对象中。

接收者执行具体的调用当命令实例调用“执行”方法时。

调用者对象知道如何执行命令，很有可能还会记录下执行的命令，但是调用者对具体要执行什么命令一无所知，仅仅知道的是要调用的是一个命令接口。

调用者对象、命令对象、接收者对象，通通由客户端持有，客户端决定它要分配给命令对象的接收者对象，以及要分配给调用者的命令对象。

客户端决定什么时候执行命令，客户端通过传递命令对象给调用者对象来执行命令。

使用命令对象，使得更容易构建一些在无需知道方法的类和方法参数的情况下，需要在选择时委托、排序或执行方法调用的通用组件。

使用调用者对象，允许方便地实现命令执行的簿记，以及实现由调用者对象管理的命令的不同模式，而不需要客户端知道簿记或模式的存在。

### 命令模式解决的问题
**可以使用请求配置对象（调用者）。**使代码可扩展，当需要增加实现时，只需继承/实现"命令”，然后将具体执行的代码封装为对象，设置到调用者即可。即使用封装好的请求来配置调用者对象，无需入侵调用者的代码。

**解耦请求者和实现者**，请求者不需要知道关于具体的实现者的信息以及如何实现，只需要知道的是要执行某个命令，由具体的命令去关心实现者是谁，如何调用。

**使用命令封装了请求**，比如开灯命令。

命令模式描述的实现：
定义分开的命令对象来封装请求。
类将请求委托给命令对象而不是直接实现请求。

命令模式中使用不同请求参数化对象的意思是：命令已经被封装为一个对象了，因此可以将命令设置到其他对象的属性中，这样其他对象就拥有更丰富的功能了。比如一个按钮可以是开灯的，但也可以改造内部的线路让按钮是控制音量的。

### 缺点
命令模式的缺点就是类的数量太多，因为每一个命令都需要新建一个类。

### 模式结构图

![命令模式UML图](https://www.hoohack.me/assets/images/2019/03/CommandUML.png)

当要调用外部服务时，往往不知道具体的外部服务是谁，也不知道具体做了什么操作，要做的只是指定具体的外部服务，具体要做什么时候怎么执行该操作，由接受者决定，发送者只是知道发出请求就可以。

## Hystrix中的命令模式
Hystrix使用了命令模式，以Hystrix为例，再介绍一个使用示例。
应用依赖两个服务，每个服务都提供了获取单个数据和数据列表的接口，如果需要对服务进行熔断控制，不使用命令模式的情况下的代码如下：
    
    public class SimpleHystrix {

        private AService aService;

        private BService bService;

        public SimpleHystrix() {
            this.aService = new AService();
            this.bService = new BService();
        }

        public void call(String callName, int param) {
            if (callName.equals("aServiceGetSingleData")) {
                try {
                    aService.getSingleData(param);
                } catch (Exception e) {
                    System.out.println("aService getSingleData exception");
                }
            } else if (callName.equals("aServiceGetList")) {
                try {
                    aService.getList();
                } catch (Exception e) {
                    System.out.println("aService getList exception");
                }
            } else if (callName.equals("bServiceGetSingleData")) {
                try {
                    bService.getSingleData(param);
                } catch (Exception e) {
                    System.out.println("bService getSingleData exception");
                }
            } else if (callName.equals("bServiceGetList")) {
                try {
                    bService.getList();
                } catch (Exception e) {
                    System.out.println("bService getList exception");
                }
            }
        }
    }


很明显，如果还要添加一个服务的话，则需要多加一个服务，使用命令模式封装后的代码如下：

    public class SimpleHystrix {

        private SimpleHystrixCommand simpleHystrixCommand;

        public void setSimpleHystrixCommand(SimpleHystrixCommand simpleHystrixCommand) {
            this.simpleHystrixCommand = simpleHystrixCommand;
        }

        public void call() {
            simpleHystrixCommand.execute();
        }

    }

代码结构非常清晰，需要增加服务也很简单，无需入侵业务代码，只需要增加一个继承Command的类，然后在execute方法实现对应服务的调用以及其他操作即可。

本次用到的demo代码可以在我的github上找到：
[https://github.com/hoohack/DesignPattern/tree/master/Command/Java](https://github.com/hoohack/DesignPattern/tree/master/Command/Java)

## 总结
以上就是命令模式的介绍，个人觉得，想要看懂Java实现的框架或者库的源码，就先要了解设计模式，毕竟Java是一门封装性较强的语言，在很多框架和库，都是通过设计模式来提升代码的优雅性和可维护性，但是单纯地学习设计模式也较难好好掌握，甚至会经常遗忘核心原理，在需要的时候带着目的去学习是较好的掌握方式。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点个赞吧，谢谢^_^

更多精彩内容，请关注个人公众号。

![](https://user-gold-cdn.xitu.io/2018/9/27/16618367007a1173?w=258&h=258&f=jpeg&s=28215)