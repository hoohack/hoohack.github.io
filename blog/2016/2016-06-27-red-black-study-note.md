---
layout: post
title: "红黑树探索笔记"
date: 2016-06-27
tags: tech
author: hoohack
categories: 数据结构和算法
excerpt: '数据结构和算法,红黑树,红黑树实现,red black tree,implement red black in c,C语言实现红黑树'
keywords: '数据结构和算法,红黑树,红黑树实现,red black tree,implement red black in c,C语言实现红黑树'
---

最近花了些时间重拾数据结构的基础知识，先尝试了红黑树，花了大半个月的时间研究其原理和实现，下面是学习到的知识和一些笔记的分享。望各位多多指教。本次代码的实现请点击：[红黑树实现代码](https://github.com/hoohack/KeepCoding/tree/master/DataStructure/RBTree)


## 红黑树基础知识

### 定义

红黑树是带有 color 属性的二叉搜索树，color 的值为红色或黑色，因此叫做红黑树。

对红黑树的每个结点的结构体定义如下：

```
struct RBNode {
     int color;
     void *key;
     void *value;
     struct RBNode *left;
     struct RBNode *right;
     struct RBNode *parent;
};
```



设根结点的 parent 指针指向 NULL，新结点的左右孩子 left 和 right 指向 NULL。叶子结点是 NULL。

定义判断红黑树颜色的宏为

    #define ISRED(x) ((x) != NULL && (x)->color == RED)

因此，叶子结点 NULL 的颜色为非红色，在红黑树中，它就是黑色，包括黑色的叶子结点。

黑高的定义，从某个结点 x 触发（不含该结点）到达一个叶结点的任意一条简单路径上的黑色结点个数称为该结点的黑高（black-height），记作 bh(x)。

### 红黑树的性质

1. 每个节点不是红色就是黑色；
2. 根节点是黑色；
3. 每个叶子节点是黑色；
4. 如果节点是红色，那么它的两个孩子节点都是黑色的；
5. 对每个节点来说，从节点到叶子节点的路径包含相同数目的黑色节点。

下面是一个红黑树的例子

![red-black-tree-demo](http://7u2eqw.com1.z0.glb.clouddn.com/red-black-tree.png)

### 红黑树的旋转

旋转操作在树的数据结构里面很经常出现，比如 AVL 树，红黑树等等。很多人都了解旋转的操作是怎么进行的（HOW），在网上能找到很多资料描述旋转的步骤，但是却没有人告诉我为什么要进行旋转（WHY）？为什么要这样旋转？通过与朋友交流，对于红黑树来说，之所以要旋转是因为左右子树的高度不平衡，即左子树比右子树高或者右子树比左子树高。那么，以左旋为例，通过左旋转，就可以将左子树的黑高 +1，同时右子树的黑高 -1，从而恢复左右子树黑高平衡。

![rotate-demo](http://7u2eqw.com1.z0.glb.clouddn.com/rotate.png)

以右旋为例，α 和 β 为 x 的左右孩子，γ 为 y 的右孩子，因为 y 的左子树比右子树高度多一，因此以 y 为根的子树左右高度不平衡，那么以 y-x 为轴左旋使其左右高度平衡，左旋之后 y 和 β 同时成为 x 的右孩子，然而因为要旋转的是 x 和 y 结点，因此就让 β 成为 y 的左孩子即可。

旋转的算法复杂度：从图示可知，旋转的操作只是做了修改指针的操作，因此算法复杂度是 O(1)。

### 红黑树的算法复杂度分析

红黑树的所有操作的算法复杂度都是 O(lgn)。这是因为红黑树的最大高度是 2lg(n+1)。

证明如下：

设每个路径的黑色节点的数量为 bh(x)`，要证明红黑树的最大高度是 2lg(n+1)，首先证明任何子树包含 2^bh(x) - 1 个内部节点。

下面使用数学归纳法证明。

当 bh(x) 等于 0 时，即有 0 个节点，那么子树包含 2^0 - 1 = 0 个内部节点，得证。

对于其他节点，其黑高为 bh(x) 或 bh(x) - 1，当 x 是红节点时，黑高为 bh(x)，否则，为 bh(x) - 1。对于下一个节点，因为每个孩子节点都比父节点的高度低，因此归纳假设每个子节点至少有 2^bh(x)-1 - 1 个内部节点，因此，以 x 为根的子树至少有 2^(bh(x)-1) - 1 + 2^(bh(x)-1) - 1 = 2^bh(x) - 1个内部节点。

设 h 是树高，根据性质 4 可知道，每一条路径至少有一半的节点是黑的，因此 bh(x) - 1 = h/2。

那么红黑树节点个数就为 n >= 2^h/2 - 1。

可得 n + 1 >= 2^h/2。两边取对数得：

```
    log(n+1) >= h/2

=>  2log(n+1) >= h

=>  h <= 2log(n+1)
```

由上面的证明可得，红黑树的高度最大值是 2log(n+1)，因此红黑树查找的复杂度为 O(lgn)。对于红黑树的插入和删除操作，算法复杂度也是 O(lgn)，因此红黑树的所有操作都是 O(lgn)`的复杂度。


## 红黑树的插入操作分析

> 红黑树的插入操作，先找到要新节点插入的位置，将节点赋予红色，然后插入新节点。最后做红黑树性质的修复。

### 新节点赋予红色的原因

因为插入操作只可能会违反性质 2、4、5，对于性质 2，只需要直接将根节点变黑即可；那么需要处理的就有性质 4 和性质 5，如果插入的是黑节点，那么就会影响新节点所在子树的黑高，这样一来就会违反性质 5，如果新节点是红色，那么新插入的节点就不会违反性质 5，只需要处理违反性质 2 或性质 4 的情况。即根节点为红色或者存在两个连续的红节点。简而言之，就是减少修复红黑性质被破坏的情况。

### 插入算法伪代码

```
RB-INSERT(T, node)
    walk = T.root
    prev = NULL
    while (walk != NULL)
        prev = walk
        if (node.key < walk.key)
            walk = walk.left
        else walk = walk.right
    node.parent = walk
    if (walk == NULL)
        T.root = node
    else if (node.key < walk.key)
        walk.left = node
    else walk.right = node
    RB-INSERT-FIXUP(T, node)
```

### 插入算法流程图

![red-black-tree-insert](http://7u2eqw.com1.z0.glb.clouddn.com/red-black-tree-insert.png)

### 插入的修复

插入之后，如果新结点（node）的父结点（parent）或者根节点（root）是红色，那么就会违反了红黑树的性质 4 或性质 2。对于后者，只需要直接将 root 变黑即可。

而前者，违反了性质 4 的，即红黑树出现了连续两个红结点的情况。修复的变化还要看父结点是祖父结点的左孩子还是右孩子，左右两种情况是对称的，此处看父结点是祖父结点的左孩子的情况。要恢复红黑树的性质，那么就需要将 parent 的其中一个变黑，这样的话，该结点所在的子树的黑高 +1，这样就会破坏了性质 5，违背了初衷。因此需要将 parent->parent(grandparent)的另一个结点（uncle 结点）的黑高也 +1 来维持红黑树的性质。

如果 uncle 是红色，那么直接将 uncle 变为黑色，同时 parent 也变黑。但是这样一来，以 grandparent 为根所在的子树的黑高就 +1，因此将 grandparent 变红使其黑高减一，然后将 node 指向 grandparent，让修复结点上升两个 level，直到遇到根结点为止。

如果 uncle 是黑色，那么就不能将 uncle 变黑了。那么只能将红节点上升给祖父节点，即将祖父结点变红，然后将父结点变黑，这样一来，以父结点为根的子树的左右子树就不平衡了，此时左子树比右子树的黑高多 1，那么就需要通过将祖父结点右旋以调整左右平衡。

### 插入修复算法的伪代码

    RB-INSERT-FIXUP(T, node)
        while IS_RED(node)
            parent = node->parent
            if !IS_RED(parent) break
            grandparent = parent->parent
            if parent == grandparent.left
                uncle = grandparent.right
                if IS_RED(uncle)
                    parent.color = BLACK
                    uncle.color = BLACK
                    grandparent.color = RED
                    node = grandparent
                elseif node == parent.right
                    LEFT_ROTATE(T, parent)
                    swap(node, parent)
                else
                    parent.color = BLACK
                    grandparent.color = RED
                    RIGHT_ROTATE(T, grandparent)
            else
                same as then clause with "right" and "left" exchanged
        
        T.root.color = BLACK

### 插入修复算法的流程图

![red-black-insert-fixup](http://7u2eqw.com1.z0.glb.clouddn.com/red-black-tree-insert-fixup.png)

### 插入的算法复杂度分析

插入的步骤主要有两步

a. 找到新结点的插入位置
b. 进行插入修复。而插入修复包括旋转和使修复结点上升。

对于 a，从上面可知，查找的算法复杂度是 O(lgn)。

对于 b，插入修复中，每一次修复结点上升 2 个 level，直到遇到根结点，走过的路径最大值是树的高度，算法复杂度是 O(lgn)；由旋转的描述可得其算法复杂度是 O(1)，因此插入修复的算法复杂度是 O(lgn)。

综上所述，插入的算法复杂度 O(INSERT) = O(lgn) + O(lgn) = O(lgn)。


## 红黑树的删除操作分析

> 红黑树的删除操作，先找到要删除的结点，然后找到要删除结点的后继，用其后继替换要删除的结点的位置，最后再做红黑树性质的修复。

红黑树的删除操作比插入操作更复杂一些。

要删除一个结点（node），首先要找到该结点所在的位置，接着，判断 node 的子树情况。

> * 如果 node 只有一个子树，那么将其后继（successor）替换掉 node 即可；
> * 如果 node 有两个子树，那么就找到 node 的 successor 替换掉 node；
> * 如果 successor 是 node 的右孩子，那么直接将 successor 替换掉 node 即可，但是需要将 successor 的颜色变为 node 的颜色；
> * 如果 successor 不是 node 的右孩子，而因为 node 的后继是没有左孩子的（这个可以查看相关证明），所以删除掉 node 的后继 successor 之后，需要将 successor 的右孩子 successor.right 补上 successor 的位置。

删除过程中需要保存 successor 的颜色 color，因为删除操作可能会导致红黑树的性质被破坏，而删除操作删除的是 successor。因此，每一次改变 successor 的时候，都要更新 color。

### 删除时用到的 TRANSPLANT 操作

TRANSPLANT(T, u, v) 是移植结点的操作，此函数的功能是使结点 v 替换结点 u 的位置。在删除操作中用来将后继结点替换到要删除结点的位置。

### 删除结点的后继结点没有左孩子证明

用 x 表示有非空左右孩子的结点。在树的中序遍历中，在 x 的左子树的结点在 x 的前面，在 x 的右子树的结点都在 x 的后面。因此，x 的前驱在其左子数，后继在其右子树。

假设 s 是 x 的后继。那么 s 不能有左子树，因为在中序遍历中，s 的左子树会在 x 和 s 的中间。（在 x 的后面是因为其在 x 的右子树中，在 s 的前面是因为其在 x 的左子树中。）在中序遍历中，与前面的假设一样，如果任何结点在 x 和 s 之间，那么该结点就不是 x 的后继。

### 删除算法伪代码

    RB-DELETE(T, node)
        color = node.color
        walk_node = node
        if IS_NULL(node.left)
            need_fixup_node = node.right
            transplant(T, node, need_fixup_node)
        elseif IS_NULL(node.right)
            need_fixup_node = node.left
            transplant(T, node, need_fixup_node)
        else
            walk_node = minimum(node.right)
            color = walk_node.color
            need_fixup_node = walk_node.right
            if walk_node.parent != node
                transplant(T, walk_node, walk_node.right)
                walk_node.right = node.right
                walk_node.right.parent = walk_node
            transplant(T, node, walk_node)
            walk_node.left = node.left
            walk_node.left.parent = walk_node
            walk_node.color = node.color
        
        if color == BLACK
            RB-DELETE-FIXUP(T, need_fixup_node)

> 注：笔者参考的是算法导论的伪代码，但是在实现的时候，因为用 NULL 表示空结点，如果需要修复的结点 need_fixup_node为空时无法拿到其父结点，因此保存了其父结点 need_fixup_node_parent 及其所在方向 direction，为删除修复时访问其父结点及其方向时做调整。

### 删除操作流程图

![red-black-delete](http://7u2eqw.com1.z0.glb.clouddn.com/red-black-tree-delete.png)

### 删除的修复操作分析

删除过程中需要保存 successor 的颜色 color，因为删除操作可能会导致红黑树的性质被破坏，而删除操作删除的是 successor。因此，每一次改变 successor 的时候，都要更新 color。

会导致红黑树性质被破坏的情况就是 successor 的颜色是黑色，当 successor 的颜色是红色的时候，不会破坏红黑树性质，理由如下：

> * 性质 1，删除的是红结点，不会改变其他结点颜色，因此不会破坏。
> * 性质 2，如果删除的是红结点，那么该结点不可能是根结点，因此根结点的性质不会被破坏。
> * 性质 3，叶子结点的颜色保持不变。
> * 性质 4，删除的是红结点，因为原来的树是红黑树，所以不可能出现连续两个结点为红色的情况。因为删除是 successor 只是替换 node 的位置，但是颜色被改为 node 的颜色。另外，如果 successor 不是node 的右孩子，那么就需要先将 successor 的右孩子 successor->right 替换掉 successor，如果 successor 是红色，那么 successor->right 肯定是黑色，因此也不会造成两个连续红结点的情况。性质 4 不被破坏。
* 性质 5，删除的是红结点，不会影响黑高，因此性质 5 不被破坏。

如果删除的是黑结点，可能破坏的性质是 2、4、5。理由及恢复方法如下：

> * 如果 node 是黑，其孩子是红，且 node 是 root，那么就会违反性质 2；（修复此性质只需要将 root 直接变黑即可）
> * 如果删除后 successor 和 successor->right 都是红，那么会违反性质 4；（直接将 successor->right 变黑就可以恢复性质）
> * 如果黑结点被删除，会导致路径上的黑结点 -1，违反性质 5。

那么剩下性质 5 较难恢复，不妨假设 successor->right 有一层额外黑色，那么性质 5 就得以维持，而这样做就会破坏了性质 1。因为此时 new_successor 就为 double black（BB）或 red-black（RB）。那么就需要修复new_successor 的颜色，将其“额外黑”上移，使其红黑树性质完整恢复。

注意：该假设只是加在 new_successor 的结点上，而不是该结点的颜色属性。

如果是 R-B 情况，那么只需要将 new_successor 直接变黑，那么“额外黑”就上移到 new_successor 了，修复结束。

如果是 BB 情况，就需要将多余的一层“额外黑”继续上移。此处还要看 new_successor 是原父结点的左孩子还是右孩子，这里设其为左孩子，左右孩子的情况是对称的。

如果直接将额外黑上移给父结点，那么以 new_successor 的父结点为根的子树就会失去平衡，因为左子树的黑高 -1 了。因此需要根据 new_successor 的兄弟结点 brother 的颜色来考虑调整。

如果 brother 是红色，那么 brother 的两个孩子和 parent 都是黑色，此时额外黑就无法上移给父结点了，那么就需要做一些操作，将 brother 和 parent 的颜色交换，使得 brother 变黑， parent 变红，这样的话，brother 所在的子树黑高就 +1 了，以 parent 为根做一次左旋恢复黑高平衡。旋转之后，parent 是红色的，且 brother 的其中一个孩子成为了 parent 的新的右孩子结点，将 brother 重新指向新的兄弟结点，然后接着考虑其他情况。

如果 brother 是黑色，那么就需要通过将 brother 的黑色和 successor 的额外黑组成的一重黑色上移达到目的，而要上移 brother 的黑色，还需要考虑其孩子结点的颜色。

如果 brother->right 和 brother->right 都是黑色，那么好办，直接将黑色上移，即 brother->color = RED。此时包含额外黑的结点就变成了 parent。parent 为 RB 或 BB，循环继续。

如果 brother->left->color =RED，brother->right->color = BLACK，将其转为最后一种情况一起考虑。即将 brother->right 变红。转换步骤为：将 brother->left->color = BLACK; brother->color = RED。这样的话 brother 的左子树多了一层黑，右旋 brother，恢复属性。然后将 brother 指向现在的 parent 的右结点，那么现在的 brother->right 就是红色。转为最后一种情况考虑。

如果 brother->right->color = RED。那么就要将 brother->right 变黑，使得 brother 的黑色可以上移而不破坏红黑树属性，上移步骤是使 brother 变成 brother->parent 的颜色，brother->parent 变黑这样一来，黑色就上移了。然后左旋 parent，这样 successor 的额外黑就通过左旋加进来的黑色抵消了。但是 parent 的右子树的黑高就 -1 了，而通过刚刚将 brother->right 变黑就弥补了右子树减去的黑高。现在就不存在额外黑了，结束修复，然后让 successor 指向 root，判断 root 是否为红色。

### 删除修复算法伪代码

    while node != root && node.color == BLACK)
        parent = node.parent
        if node = parent.left
            brother = parent.right
            if IS_RED(brother)
                brother.color = BLACK
                parent.color = RED
                LEFT_ROTATE(T, parent)
                brother = parent.right
            
            if brother.left.color == BLACK and brother.right.color == BLACK
                brother.color = RED
                node = parent
            elseif brother.right.color = BLACK
                brother.left.color = BLACK
                brother.color = RED
                RIGHT_ROTATE(T, brother)
                brother = parent.right
            else
                brother.color = parent.color
                parent.color = BLACK
                brother.right.color = BLACK
                LEFT_ROTATE(T, parent)
                node = root
        else (same as then clause with “right” and “left” exchanged)
    node.color = BLACK

### 删除修复算法的流程图

![red-black-delete-fixup](http://7u2eqw.com1.z0.glb.clouddn.com/red-black-tree-delete-fixup.png)

### 删除操作的算法复杂度分析

删除的操作主要有查找要删除的结点，删除之后的修复。

修复红黑树性质主要是旋转和结点上移。对于查找来说，查找的算法复杂度是O(lgn)，旋转的复杂度是O(1)，结点上移，走过的路径最大值就是红黑树的高，因此上移结点的复杂度就是O(lgn)。

综上所述，删除算法的复杂度是 `O(DELETE) = O(lgn) + O(1) + O(lgn) = O(lgn)`。


## 资源分享

如果对部分步骤不理解，可以到这个网站看看红黑树每一步操作的可视化过程：[红黑树可视化网站](http://www.cs.usfca.edu/~galles/visualization/RedBlack.html)。

本次代码的实现请点击：[红黑树实现代码](https://github.com/hoohack/KeepCoding/tree/master/DataStructure/RBTree)


## 总结

因为基础知识比较薄弱，所以想补一下自己的基础，无奈悟性较低，花了大半个月时间才把红黑树给理解和实现出来。中途跟朋友讨论了很多次，因此有以上的这些总结。之前一直不敢去实现红黑树，因为觉得自己根本无法理解和实现，内心的恐惧一直压抑着自己，但经过几次挣扎之后，终于鼓起勇气去研究一番，发现，只要用心去研究，就没有解决不了的问题。纠结了很久要不要发这篇博文，这只是一篇知识笔记的记录，并不敢说指导任何人，只想把自己在理解过程中记录下来的笔记分享出来，给有需要的人。但其实想想，纠结个蛋，让笔记作为半成品躺在印象笔记里沉睡，还不如花时间完善好发布出来，然后有兴趣的继续探讨一下。

如果真的要问我红黑树有什么用？为什么要学它？我真的回答不上，但是我觉得，基础的东西，多学一些也无妨。只有学了，有个思路在脑海里，以后才能用得上，不然等真正要用才来学的话，似乎会浪费了很多学习成本。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^
