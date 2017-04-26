---
layout: post
title: "［井字游戏］做一款回忆童年的游戏"
date: '2016-04-27'
author: hoohack
categories: Javascript
excerpt: '井字游戏算法,井字游戏,算法,Javascript小游戏'
keywords: '井字游戏算法,井字游戏,算法,Javascript小游戏'
---

> 99% of information we read, we forget anyway. The best way to remember
> is to "DO".

体验地址：[http://www.hoohack.me/assets/tictactoe/](http://www.hoohack.me/assets/tictactoe/)

游戏完整的代码在我的 github 上，有兴趣也可以围观一下：[TicTacToe](https://github.com/hoohack/TicTacToe)，也希望大家可以点个 star。

## 缘起
最近在[FreeCodeCamp](https://www.freecodecamp.com/)上面学习前端知识，不知不觉已经学到了319课，现在遇到的一个小project是做一款[井字游戏](https://www.freecodecamp.com/challenges/build-a-tic-tac-toe-game)。说起井字游戏，真是满满的童年味道，还记得最疯狂的时候是小时候跟同桌拿着一张草稿纸就能玩一节课，回到家跟弟弟也能继续玩，对于没有太多娱乐节目的童年来说，真是一款玩不厌的小游戏。这款游戏代码比较简单，主要是掌握算法的原理，但是也有一些需要注意的地方，于是想把自己遇到的问题记录下来。

## 游戏界面
进入正题。项目的效果图如下：

<!--more-->

![项目效果图](http://7u2eqw.com1.z0.glb.clouddn.com/%E4%BA%95%E5%AD%97%E6%B8%B8%E6%88%8F-%E9%A1%B9%E7%9B%AE%E7%9A%84%E6%95%88%E6%9E%9C%E5%9B%BE)

FreeCodeCamp上要求不能查看源码来实现，于是便想着先把页面做出来。看到井字格子，就想着用9个li，然后设置li的边框作为井字线。于是用了一个div包住一个ul，里面有9个li。

游戏有一个开始界面可供选择玩家的角色，然后选择先手是哪一方，接着开始游戏。选择界面做了一个遮罩层，里面提供给用户选择，选择之后便把遮罩层隐藏并开始游戏。

## 井字游戏算法
算法参考了[这篇文章](http://blog.jobbole.com/24719/)。但里面的图片看不到了，笔者根据自己的理解再解释一遍，并配上一些图片。

这次做的是人机对战，因此就需要写出比较智能的算法。首先，设计者要懂得玩游戏，有自己的策略，接下来就是将自己的策略付诸实现。

从下图可以看到，整个棋盘可以连接处8条线，即一共有8种取胜可能：
![8种取胜可能](http://7u2eqw.com1.z0.glb.clouddn.com/%E4%BA%95%E5%AD%97%E6%B8%B8%E6%88%8F-8%E7%A7%8D%E5%8F%96%E8%83%9C%E5%8F%AF%E8%83%BD)


### 1、开局第一步，这一步有两种情况
A、如果先手是电脑，那么就将棋子下在中心位置，如图：
![开局第一步](http://7u2eqw.com1.z0.glb.clouddn.com/%E4%BA%95%E5%AD%97%E6%B8%B8%E6%88%8F-%E5%BC%80%E5%B1%80%E7%AC%AC%E4%B8%80%E6%AD%A5)


B、如果先手是玩家，那么有下面三种情况要考虑
如果玩家在中心位置，那么电脑必须落在四个角位，因为如果不落在角位，那么就会出现必输的情形。假设现在用1-9表示9个棋位。如下图所示，如果玩家第一步在中心位置，第二步电脑落在第2位的棱位（图中的2），第三步玩家只需要在第7或第9位下棋（图中的3），第四步电脑必须在1或3位，第五步玩家跟进在7或9，则第六步电脑必须在1或3，那么第七步玩家只需要在4或者6下棋就可以赢了。

![先手是玩家考虑情况](http://7u2eqw.com1.z0.glb.clouddn.com/%E4%BA%95%E5%AD%97%E6%B8%B8%E6%88%8F-%E5%85%88%E6%89%8B%E6%98%AF%E7%8E%A9%E5%AE%B6%E8%80%83%E8%99%91%E6%83%85%E5%86%B5)

如果玩家在棱位/角位，那么电脑需要在中心位置下棋，在保证不输的情况下反击。

### 2、第二步棋（先角原则）
根据上面的分析，如果先手是玩家且玩家落棋在中心位置，为了避免必输的情形，电脑需要落棋在角上。而如果先手是电脑，那么如果玩家落在棱位，电脑落在角位让必输的情形属于玩家。

### 3、攻击
检测棋盘，如果有两枚己方的棋子连在一起且连线中仍有空位，那么就落棋在该位。

### 4、防守
检测棋盘，如果有对方的两枚棋子连在一起且连线中仍有空位，那么就落棋在该位。

### 5、垃圾时间
当不需要攻击也不需要防守的时候，那就随便找个位置下棋，尽可能找到连线中还有两个空位的位置。

### 特殊情况
有一种特殊情况是不能执行先角原则的，如下图所示，第一步，玩家先下棋在1，第二步，电脑根据开局第一步的规则下棋在中心位置5，第三步，玩家在1的对角位置9下棋，根据先角原则，第四步电脑将落在3或者7的棋位，第五步玩家在7或者3的位置封堵电脑，那么此时电脑就输了。唯有此种情况不能执行先角原则，所以在非攻击且非防守的时候要先排除掉此情况。

![特殊情况](http://7u2eqw.com1.z0.glb.clouddn.com/%E4%BA%95%E5%AD%97%E6%B8%B8%E6%88%8F-%E7%89%B9%E6%AE%8A%E6%83%85%E5%86%B5)

具体实现
说了那么多，可能比较枯燥，下面介绍一下具体的代码实现。
程序使用一个二维数组panel保存棋盘的状态，1是电脑的值，－1是玩家的值。
winArr保存所有可能赢的8个棋位组合；维护computerWin和userWin，初始值等于winArr，当电脑或玩家每次下棋时，都分别更新这两个数组，删除掉不能赢的棋位组合。在更新panel的时候会分别更新computerWin和userWin。

核心的方法是play，play的执行步骤伪代码如下：

    如果可以攻击
        遍历computerWin数组，找到可以攻击的棋位，下棋，显示是否赢了。
    不能攻击，如果需要防守
        遍历userWin，根据玩家可赢的组合，找出需要防守的棋位，下棋，更新panel；
    不需要防守，如果是电脑先手的第一步
        在中心位置下棋，更新panel；
    不是先手第一步
        如果中心位置没有被占去，在中心位置下棋，更新panel；返回
        如果是特殊情况，在棱位下棋，更新panel； 返回
        如果角位仍有位置，选择一个角位下棋，更新panel； 返回
        最后一种情况，找到剩余的空位，优先选择位于computerWin的空位，下棋，更新panel； 返回
        
play算法的实现如下：

    if(canAttack()) {
        console.log("attack");
        var attackPos = findAttackPos();
        updatePanel(attackPos, computerVal);
    } else if(needDefend()) {
        console.log("defend");
        var defendPos = findDefendPos();
        updatePanel(defendPos, computerVal);
    } else if(firstStep()) {
        console.log("first");
            updatePanel(firstPos, computerVal);
            running = true;
    } else {
        console.log("other");
        if(panel[1][1] == 0) {
                   updatePanel(firstPos, computerVal);
               return;
        }
        if(special()) {
            console.log('special');
            var pos = findSpecialPos();
            updatePanel(pos, computerVal);
            return;
        }
        var random = Math.floor(Math.random() * 2);
        if(panel[0][0] == 0 && panel[2][2] == 0) {
            var pos = (random == 0) ? 0 : 8;
            updatePanel(pos, computerVal);
        } else if(panel[0][2] == 0 && panel[2][0] == 0) {
            var pos = (random == 0) ? 2: 6;
            updatePanel(pos, computerVal);
        } else {
            var otherPos = findEmptyPos();
            updatePanel(otherPos, computerVal);
        }
    }
    

## 总结
在编码的过程中遇到的一个难题就是JavaScript的数组对象，我在第一次调用play方法开头输出panel的时候，得到的是play执行后panel的值，后来请教一位大神，发现是因为panel是一个对象，因为对象遍历引用的都是同一块内存地址，所以一旦有改变，就全部改了。如果直接使用下标输出每一个值的话是可以得到初始的值的，也可以用JSON方法将数组字符串，然后打印出来查看结果。

另外，也学会了如何在JavaScript里面封装一个类，将私有方法写在类的外面，需要暴露的方法写在类里面。当然，还有很多需要学习的地方。继续学习。

**有时候一些东西看起来很简单，或者听到了很多次，心里面觉得实现起来应该很简单的，没什么了不起，觉得不以为然，但只有真正去实践出来的时候才能体会到其中的乐趣和思想，才能真正的掌握。所以，尽情的去DO。**

本文较短，如果还有什么疑问或者建议，可以多多交流，原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，望大力点推荐。
