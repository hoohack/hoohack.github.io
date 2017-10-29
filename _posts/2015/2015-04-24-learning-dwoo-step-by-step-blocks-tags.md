---
layout: post
title:  "一步步学习Dwoo模板引擎--块和标签"
date:   '2015-04-24 18:37:41'
author: hoohack
categories: PHP
excerpt: '一步步学习Dwoo,一步步学习Dwoo引擎,PHP,Dwoo,模板引擎'
keywords: '一步步学习Dwoo,一步步学习Dwoo引擎,PHP,Dwoo,模板引擎'
---

##Blocks（块）

###a
输出HTML的<a>标签
    
    a($href, [array $rest = array()])

> * href:指定的目标URI
> * rest:任何你想添加到标签的属性都可以作为命名参数被添加到标签中

<!--more-->

例子：

    {* 创建一个简单的外部链接以及添加一个class属性: *}
    {a $url class="external" /}

    {* 根据其他变量标记链接为可触发变量: *}
    {a $link.url class=tif($link.active "active"); $link.title /}

    {* 同上: <a href="{$link.url}" class="{if $link.active}active{/if}">{$link.title}</a> *}

###autoEscape(自动转义)
在这个块元素里可以重写自动转义编译器:
    
    autoEscape(mixed $enabled)

> * enabled : 如果设为"on"，"enable", true或1，那么自动转义编译器就会使用这个块。设为"off"，"disable"，false或者0，那么就不会启用这个块。

例子：
    
    {$user="<a href=\\"javascript:jsAttack()\\">EvilTroll</a>"}
    {$user} {* => 不转义，如果你在PHP端没有哦过滤你的数据的话，那么这可能会对用户的输入造成伤害 *}

    {autoEscape on}
    {$user} {* 这里任何注入的HTML都被转义了，所以是安全的 *}
    {/autoEscape}

输出结果

    <a href="javascript:jsAttack()">EvilTroll</a>
    &lt;a href="javascript:jsAttack()"&gt;EvilTroll&lt;/a&gt;

第一个结果会被浏览器解析为HTML标签，第二个结果会被浏览器解析为文本。

###block(块)
定义一个可以被子模板集成的块
    
    block(string $name)

> * name : 块名字，可以在子模板中创建一个使用相同名字的新块可以重写它。

###capture(捕获)
默认会捕获块里面的所有输出然后保存到{$.capture.default}中，如果你提供一个变量名，那将保存到{$.capture.name}中。

    capture([ string $name = 'default', [ string $assign = null, [ bool $cat = false ]]])

> * name : 捕获名，用于后面的读取变量
> * assign : 如果有设置了，这个值也会被保存到所给的变量中
> * cat : 如果为true，这个值会被追加到之前的那一个(如果有的话)而不是覆盖它

例子：
    
    {capture "foo"}
      所有在这里的内容都不会展示，会被保存起来日后使用
    {/capture}
    捕获到的内容: {$.capture.foo}

输出结果：
    
    捕获到的内容: 所有在这里的内容都不会展示，会被保存起来日后使用

###注释(comment)
注释插件允许你在模板文件中放入注释。这些注释有Dwoo处理，而且不像HTML注释那样，Dwoo的注释不会被输出到浏览器。注释使用{* 和 *}标签分隔，可以单行注释，也可以多行注释。

    {* 这是一个Dwoo注释 *}

    {*
     - 这是多行的
     - Dwoo 注释!
     *}

    {*
      这也是一个注释
    *}

###else
通用的else块，它支持所有建于选择性展示的块，如：if,loop,for,foreach以及with。

如果有一个块包含else语句，那么如果块的条件不满足的话，在{else}以及{/\*blockname\*}(你不需要关闭else标签)之间的内容就不会被显示。

例子：

    {foreach $array val}
      $array 非空，展示它的值 : {$val}
    {else}
      如果这里有数据，说明$array是空的或者不存在。
    {/foreach}

###for
与PHP的for语句十分相似：
    
    for(string $name, mixed $from, [ int $to = null, [ int $step = 1, [ int $skip = 0 ]]])

> * name : 访问迭代器变量的名字
> * from : 迭代数组的开始位置(从0开始)或者一个数字的开始值
> * to : 迭代数组的结束位置 (如果你在$from里设置一个数组，那么这个值会自动设置为count($array))
> * step : 定义每一次遍历过程的增量

>注： 这个插件支持从其它命名参数传递过来的迭代器，也支持其它语句传递过来的迭代器

例子：

    {for i 0 5} {$i} {/for}

    {for i 0 5 2} {$i} {/for}

    {$arr=array("Bob","John","Jim")}
    {for i $arr}
      {$i} -> {$arr.$i} {* or $arr[$i] *}
    {/for}

输出:

    0  1  2  3  4  5 
    0  2  4 
    0 -> Bob
    1 -> John
    2 -> Jim

###foreach
与PHP的foreach块相似，遍历一个数组
    
    foreach(array $from, [ string $key = null, [ string $item = null, [ string $name = 'default', [ string $implode = null ]]]])

> * from : 你想遍历的数组
> * key : 键值的变量名 (如果某项没有定义的话就是该项的变量名)
> * item : 每项的变量名
> * name : 访问迭代器变量的名字
> * implode : 分隔符，如果提供了，那么将会插入到每项之间

>注：这个插件支持从其它命名参数传递过来的迭代器，也支持其它语句传递过来的迭代器

例子：

PHP 数据

    <?php
    array(
      'arr' => array(
        array('id'=>1, 'name'=>'Jim'),
        array('id'=>2, 'name'=>'John'),
        array('id'=>3, 'name'=>'Bob'),
      )
    )

HTML

    {foreach $arr val implode=", "}
      {$val.id} - {$val.name}
    {/foreach}

输出：

    1 - Jim,
    2 - John,
    3 - Bob
分隔符参数允许你使用逗号或者任何你想使用来分隔每一项的符号，这比在foreach块中使用{if $.foreach.name.last}, {/if}来分隔更简单。

###function
在模板文件中创建一个函数

    function(string $name [, array $rest = array() ])

> * name : 子模板的名称，你调用时使用的名字，如果你使用一个现有的插件名，那它将会覆盖它
> * rest : 一系列的参数以及可选参数(参数名被模板自己保存下来)

看看{load_templates}函数，允许你从一个文件中加载多个模板，就像你在php中从外部文件include一个方法或者类。

注意：不能创建相同名字的函数。

递归输出菜单例子：

$menuTree为一个数组：

    <?php
    $menuTree = array(
      array('name'=>'Foo', 'children'=>array(
        array('name'=>'Foo-Sub', 'children'=>array()),
        array('name'=>'Foo-Sub2', 'children'=>array()),
      )), 
      array('name'=>'Bar', 'children'=>array()), 
      array('name'=>'Baz', 'children'=>array()), 
    );
    {function menu data tick="-" indent=""}
      {foreach $data entry}
        {$indent}{$tick} {$entry.name}<br />

        {if $entry.children}
          {* 递归调用让子模板更好地输出树状结构 *}
          {menu $entry.children $tick cat("&nbsp;&nbsp;", $indent)}
        {/if}
      {/foreach}
    {/function}

    {menu $menuTree ">"}

输出

    > Foo

      > Foo-Sub

      > Foo-Sub2

    > Bar

    > Baz

###if
条件块，语法跟PHP的十分相似，允许使用() || &&以及其他php操作符。下面是其他Dwoo操作符以及它们对应的php操作符：

> * eq → ==
> * neq or ne → !=
> * gte or ge → >=
> * lte or le → <=
> * gt → >
> * lt → <
> * mod → %
> * not → !
> * X is [not] div by Y → (X % Y) == 0
> * X is [not] even [by Y] → (X % 2) == 0 or ((X/Y) % 2) == 0
> * X is [not] odd [by Y] → (X % 2) != 0 or ((X/Y) % 2) != 0

例子：
    
    {if 3 == 5}
      不会发生
    {elseif 3 == 3}
        一定发生
    {else}
        这永远不会展现
    {/if}

输出：

一定发生

#literal(字面量)
不把它们当做模板代码输出整个块的内容
    
    literal()

>这个块必须使用{/literal}作为结束，使用{/}或关闭父块无效。

例子：

    {$var=3}
    {literal}
     {$var} {* 注释和条件功能在literal会出现异常，因为它们在literal中依然是有效的行为 *}
    {/literal}
    {$var}

输出：

{$var} 

3

###loop
循环遍历数组和通过自动移动作用域到每一个元素实现真正的简单/小的结构。实际上它是foreach和with的内部结合。

    loop(array $from [, $name = "default ] )

例子：

PHP 数据

    <?php
    array('users' => array(
      array( 'id' => 1, 'name' => 'Bob'),
      array( 'id' => 2, 'name' => 'John' )
    )

HTML显示
  
    {loop $users}
        {$id}-{$name}
    {/loop}

输出

1-Bob

2-John

访问数组键值

你可以在loop里面使用`{$_key}`变量来访问数组Ian之，为了保持loop的简单性，它的名字不能自定义。

##strip
删除头和尾的空格，还有去除分行。

    strip(string $mode = 'default')

mode : mode定义了一些规则来保护某些内容不受伤害，现在只有js/javascript，保证JavaScript的注释不会使脚本失效。

例子：
  
    {strip}
     spaces between words in a same line     
    + are not removed -    
       but    
     everything   
         else   
       is     
    {/strip}

输出：
    
    spaces between words in a same line- are not removed -buteverythingelseis

如果你在模板中嵌入了JavaScript，如果代码中包含注释的话，{strip}组件可能会打断你的JavaScript。看个例子：

    {strip}
    <script type="text/javascript">
        // say hello!
        alert("hello!");
    </script>
    {/strip}
这将会输出：

    <script type="text/javascript"> // say hello! alert("hello!"); </script>
脚本现在在一行了，因为第一行是注释，所以全部内容被解析为注释里。为了避免这种情况，可以在{strip}组件中使用js参数。

    {strip js}
    <script type="text/javascript">
        // say hello!
        alert("hello!");
    </script>
    {/strip}
这样做会移除脚本里的所有注释。

##textformat(文本格式化)

使用所给的格式来格式化字符串，你可以限定一行字符串的长度或者使其缩进。

    textformat([ int $wrap = 80, [ string $wrap_char = "\r\n", [ string $wrap_cut = false, [ int $indent = 0, [ string $indent_char = " ", [ int $indent_first = 0, [ string $style = "", [ string $assign = "" ]]]]]]]])

> * wrap : 一行最大的长度
> * wrap_char : 用于分行的字符
> * wrap_cut : 如果是true，超过$wrap的部分将会被删除掉而不是溢出
> * indent : 插入到每一行的缩进字符的个数
> * indent_char : 插入到每一行的缩进字符
> * indent_first : 每个段落第一行需要插入缩进字符的个数
> * style : 为一些必要的变量设置了的预定义格式样式，如：email或者html
> * assign : 如果设置了，那么格式化之后的文本会被复制到该变量而不会输出

例子

    {textformat 10}here is some text that should wrap{/textformat}

    {textformat 10 wrap_cut=true}and this one should cut words that go beyoooooooond 10 chars{/textformat}

输出：

here is
some text
that
should
wrap

and this
one should
cut words
that go
beyooooooo
ond 10
chars

##with
移动作用域到数组里面的元素，在{with}块里面，允许使用{$var}代替{$array.var}

    with(array $var)

> * var : 需要移动作用域的数组

例子：

    {$arr.foo}
    {with $arr} {$foo} / {$arr.foo} {/with}

数据

>'arr' => array( 'foo' => 'bar' )

输出

bar
bar /

这个组件比较狡猾的地方是，一旦你移动了作用域到其他地方，你就不能访问全局变量了。
正如你看到的上个例子，在{with}里面的{$arr.foo}是无效的并返回null。你可以使用`_parent_and_root`解决这个问题。`$_root`链接到最顶部的作用域，`$_parent`是上一级作用域。$dwoo的魔法变量不会被这个影响，它们可以在任何作用域中使用相同方式访问。

例子

    {with $arr.sub}
      {$foo} / {$_root.arr.sub.foo} / {$_parent.foo}
      {$_root.url} / {$_parent._parent.url}
      {$dwoo.version}
    {/with}
数据

'arr' => array( 'sub' => array( 'foo' => 'bar' ) )

'url' => 'example.org'

输出

bar / bar / bar

example.org / example.org

0.3.3
