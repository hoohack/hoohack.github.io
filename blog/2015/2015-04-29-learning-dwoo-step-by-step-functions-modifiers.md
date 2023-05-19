---
layout: post
title:  "一步步学习Dwoo模板引擎--函数/修饰符"
date:   '2015-04-29'
tags: tech
author: hoohack
categories: PHP
excerpt: '一步步学习Dwoo,一步步学习Dwoo引擎,PHP,Dwoo,模板引擎,Dwoo模板'
keywords: '一步步学习Dwoo,一步步学习Dwoo引擎,PHP,Dwoo,模板引擎,Dwoo模板'
---

###assign
赋值一个变量

    assign(mixed $value, string $var)

> * value : 你想要保存的值
> * var : 变量名称 (除了$开头的字符)

例子 :

    {assign 'test string' myVar}
    Variable contains: {$myVar}



输出:

>Variable contains: test string

注意：

这个组件为了smarty的兼容性而提供，使用=操作符会更简单，就像在各种语言上的赋值一样：

    {$myVar='test string'}

###capitalize(转成大写)
把字符串的每一个单词的首字母转成大写。

    capitalize(string $value [, bool $numwords = false ] )

> * value : 需要转成大写的字符串
> * numwords : 是否要转换带有数字的单词

例子:

    {capitalize('this is a string what2')}
输出:

>This Is A String what2

###cat
连接任意数量的变量或字符串

    cat(array $rest)

> * rest : 两个或多个字符串会被合并成一个。

例子：

    {$a='abc'}
    {$d='def'}
    {$g='ghi'}
    {cat $a $d $g}

输出

>abcdefghi

###countCharacters
计算在字符串中的字符数量

    countCharacters(string $value, [ bool $count_spaces = false ])

> * value : 进行运输的字符串
> * count_spaces : 如果为true，那么空格的个数也会被计算进去

例子：

    {countCharacters('ab cd')}
    {countCharacters('ab cd', true)}

输出

>4

>5

###countParagraphs
计算字符串中的段落数

    countParagraphs(string $value)

> * value : 需要计算的字符串

例子

    {countParagraphs('ab cd')}
    {countParagraphs('ab\n cd')}

输出

>1

>2

###countSentences
计算字符串的句子数

    countSentences(string $value)

> * value : the string to process

例子：

    {countSentences('ab cd')}
    {countSentences('ab. cd')}

输出

>1

>2

###countWords
计算字符串中的单词个数

    countWords(string $value)

> * value : 需要计算的字符串

例子：

    {countWords('ab cd')}

输出：

>2

###counter
初始化一个计数器，在每次调用中递增

    counter([ string $name = 'default', [ int $start = 1, [ int $skip = 1, [ string $direction = "up", [ bool $print = true, [ string $assign = null ]]]]]])

> * name : 计数器名字，如果你需要多个计数器的话就定义它吧
> * start : 初始值，如果设置了，那么它会被重置为这个值，默认是1
> * skip : 在每一次调用中counter的增量，默认是1
direction : "up"(默认)或者"down"，定义counter是增还是减
> * print : 如果为false，counter的值不会被输出。默认是true
> * assign : 如果设置了，counter的值会被保存到所给的变量中而不会输出任何东西，重写了print变量

例子

    {counter start=10 skip=5}
    {counter}
    {counter}
    {counter start=10 direction=down}
    {counter}

输出

>10

>15

>20

>10

>5

###cycle
几个值之间的轮询，每次返回它们当中的一个值

    cycle([ string $name = 'default', [ mixed $values = null, [ bool $print = true, [ bool $advance = true, [ string $delimiter = ',', [ string $assign = null, [ bool $reset = false ]]]]]]])

> * name : 轮询名称，如果你需要多个轮询，那你就定义一个变量
> * values : 一个包含所有值的数组或使用$delimiter分隔的字符串
> * print : 如果是false，当前指针会继续指向下一位，但是不会输出任何内容
> * advance : 如果为false，指针不会指向下一个值
> * delimiter : 用来分隔是字符串的值的分隔符
> * assign : 如果设置了，那么该值会被保存到变量中而不是输出
> * reset : 如果是true，指针会被从新指向第一个值

例子：

    {cycle values=array("1red","2blue","3green")}
    {cycle}
    {cycle advance=false}
    {cycle}
    {cycle}
    {cycle}
    {cycle reset=true}

输出：

>1red

>2blue

>3green

>3green

>1red

>2blue

>1red

###dateFormat
格式化日期

    dateFormat([string $value = 'now', [ string $format = 'M n, Y', [ int $timestamp = 0, [int $timeZone = 2047, [string $modify = '']]]]]) 

> * value : 任何时间格式或DateTime类能支持的日期/时间字符串
> * format : 输出的格式，更多详情请见[http://www.php.net/manual/en/function.date.php](http://www.php.net/manual/en/function.date.php)
> * timestamp : 一个有效的时间戳
> * timeZone : DateTimeZone类支持的地区值
> * modify : 修改时间戳，更多详情见[http://www.php.net/manual/en/datetime.modify.php](http://www.php.net/manual/en/datetime.modify.php)

例子：
    
    {$.now}
    {dateFormat value="now" format="Y-m-j"}
    {dateFormat format="m/d/y" timestamp=$.now modify="+150 day"}
    {dateFormat "1994-3-15 10:24:22"}

输出

>1382017201.358

>2013-10-17

>03/16/14

>Mar 3, 1994

###default
返回一个值，如果是空的话就返回默认值

    default(mixed $value, [ mixed $default = ""])
> * value : 需要检查的变量
> * default : 后备值，如果第一个为空就返回它

例子：

    {$var1="foo"}
    {$var2=""}
    {default $var1 "bar"}
    {default $var2 "bar"}
    {default $var3 "bar"}

输出：

>foo

>bar

>bar

###do
执行一些语句，但不会输出。这是一个简单的可选清洁器，执行如`{assign func("foo") var}`或使用`{capture}`这样的语句而不输出。
我暂时还想不到模板中任何使用它的原因，但是基于一些内部原因，它存在了，因此你可以在你需要的时候使用它。

例子：

    {do "foo"}
    {do reverse("bar")}
输出：

-nothing*

###docType
输出一个有效的(X)HTML DOCTYPE

    docType([$docType = ''])
docType : doctype的名称, 默认为HTML5如果该值无法识别或没有给以下的有效值:

HTML5

XHTML11

XHTML1_STRICT

XHTML1_TRANSITIONAL

XHTML1_FRAMESET

XHTML_BASIC1

HTML4_STRICT

HTML4_LOOSE

HTML4_FRAMESET

例子：

    {docType XHTML1_STRICT}
    {docType}

输出

>`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">`

>`<!DOCTYPE html>`

###dump
输出变量的值，就像PHP里的var_dump()函数

    dump($value)

> * value : 需要展示的值

例子：

    {dump $}

输出

>Will output an array of all variables global.

###escape
为字符串提供多种过滤模式

    escape([ $value = "", [ $format = 'html', [ $charset = null ]]])

> * value : 需要处理的字符串
> * format : 使用的过滤格式,有效的格式有 : html, htmlall, url, urlpathinfo, quotes, hex, hexentity, javascript 以及 mail
> * charset : 转换所使用的编码(只提供给某些格式)，默认是当前Dwoo的编码

例子

    {"some <strong>html</strong> tags"|escape}

输出

>`some &lt;strong&gt;html&lt;/strong&gt; tags`

###eval

执行一个所给的模板字符串

    eval(string $var, [ $assign = null ])

> * var : 用于作为模板的字符串
> * assign : 如果设置了，那模板的输出将会被保存到改变了而不是输出
尽管这个组件有点像优化而且不会重新编译你的字符串，但还是不建议使用它。如果你希望你的模板被保存到数据库或其他地方，你应该使用Dwoo\Template\String 类或集成它来实现。

###exectime
返回php程序的执行时间

    exectime([$precision = 0])

> * $precision : 一个十进制的数字，用于表示程序执行次数。

例子

    {exectime 3}ms
输出

>62.064ms

###extends
继承一个模板

    extends(string $file)

> * file : 继承的模板(资源名称)

注: 你不能使用`../`等路径来继承父模板。但是如果是根目录的话可以使用`./`。

例子：

    {extends "base.tpl"}

###fetch
读取一个文件

    fetch(string $file, [ string $assign = null ])

> * file : 需要读取的文件的路径或URI (但是为了性能问题，不推荐读取其他网站的文件)
> * assign : 如果设置了，文件将会被保存到该变量而不会输出

例子

    {fetch 'http://php.net'}

输出

>把网站内容输出到你的模板中(没有展示任何iframe)

###formatSize
格式化一个给定的字节大小的文件为人类可阅读的文件大小

    formatSize($size)

> * size : 文件的字节大小
> * unit : 输出的单元大小
> * decimals : 展示的次数

例子

    {"123"|formatSize}
    {"2049"|formatSize}
    {"123456"|formatSize}
    {"5000000"|formatSize}
    {"1572864"|formatSize}
    {formatSize("1572864", "KB", 3)}

输出

>123.00 B

>2.00 KB

>120.56 KB

>4.77 MB

>1.50 MB

>1536.000 KB

###googleAnalytics
生成谷歌分析脚本

    googleAnalytics($code, [$domain = ''])

> * $code : 谷歌分析的代码
> * $domain : 定义一个主机名

例子

    {googleAnalytics code="UA-xxxxxxxx-1"}

输出

    <script>
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-xxxxxxxx-1']);

        _gaq.push(['_setAllowLinker', true]);
        _gaq.push(['_trackPageview']);

        (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript';
          ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' :
          'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];
          s.parentNode.insertBefore(ga, s);
        })();
    </script>

###gravatar(Globally Recognized Avatar:全球通用头像)
根据一个人的邮箱地址返回某个用户的头像，如果你不知道是什么的话，那就查看Grabatar网站。

    gravatar(string $email, [ int $size = 80, [ string $default = "", [ string $rating = "g" ]]] )

> * email : 你需要头像的用户的email地址
> * size : 图片的像素大小，默认为80
> * default : ，默认展示的图片的URL, 或者下面三种图片生成器的一种: identicon(Hash值的默认表示), monsterid 或者 wavatar, 点击这里[查看更多](http://en.gravatar.com/site/implement/url), 这个默认为gravator的logo
> * rating : 图片的最高访问级别, 默认为g (普通级) 以及其他值 (按顺序) pg (家长指引), r (限制级) and x (成人级)

例子

    <img src="{gravatar "test@gravatar.com" 20 "identicon" "x"}" alt="Test gravatar" />

输出

    <img src="http://www.gravatar.com/avatar/df3d4780faaf2446a65ce39eafdfe1c0?s=20&r=x" alt="T

###htmlStateSelect
返回简单的包含所有美国城市的HTML的select元素

    htmlStateSelect(string $name, [ string $width = "100%", [int $size = false, [bool $multiselect = false]]])

> * name : select元素的id和名字
> * width : select元素垂直展示的大小
> * size : 大小，默认为false
> * multiselect : 多选标志，默认为false

例子

    {htmlStateSelect name="state" width="200px"}

输出

    <select name="state" id="state" style="width:200px;">
     <option value="AL">Alabama</option>
     ...
     <option value="WY">Wyoming</option>
    </select>

例子

    {htmlStateSelect name="state" size="5" multiselect="true"}

输出

    <select name="state" id="state" style="width:100%;" size="5" multiple="multiple">
     <option value="AL">Alabama</option>
     ...
     <option value="WY">Wyoming</option>
    </select>

###htmlSelectTime
为时，分，秒和子午线创建一个select框。

    htmlSelectTime( [$prefix = "Time_", [$time = null, [$display_hours = true, [$display_minutes = true, [$display_seconds = true, [$display_meridian = true, [$use_24_hours = true, [$minute_interval = 1, [$second_interval = 1, [$field_array = null, [$all_extra = "", [$hour_extra = "", [$minute_extra = "", [$second_extra = "", [$meridian_extra = ""]]]]]]]]]]]]]]] )

> * prefix : 名字前缀
> * time : 使用的时间，可以是任何可被strtotime()函数处理的值，mysql或unix的时间戳
> * display_hours : 显示小时选择框的标志
> * display_minutes : 显示分钟选择框的标志
> * display_seconds : 显示秒选择框的标志
> * display_meridian : 显示子午线选择框(am/pm)的标志
> * use_24_hours : 使用24小时制
> * minute_interval : 分钟选择框的间隔
> * second_interval : 秒选择框的间隔
> * field_array : 使用命名数组。如： foo[hour], foo[minute]...
> * all_extra : 添加到所有选择框的附件属性
> * hour_extra : 添加到小时选择框的附件属性
> * minute_extra : 添加到分钟选择框的附件属性
> * second_extra : 添加到秒选择框的附件属性
> * meridian_extra : 添加到子午线选择框的附件属性

基本使用

    {htmlSelectTime}

输出

    <select name='Time_Hour'>
     <option value='0'>0</option>
     <option value='1'>1</option>
     ...
     <option value='22'>22</option>
     <option value='23' selected='selected'>23</option>
    </select>
    <select name='Time_Minute'>
     <option value='0'>0</option>
     <option value='1'>1</option>
     ...
     <option value='35' selected='selected'>35</option>
     <option value='36'>36</option>
     ...
     <option value='58'>58</option>
     <option value='59'>59</option>
    </select>
    <select name='Time_Second'>
     <option value='0'>0</option>
     <option value='1'>1</option>
     ...
     <option value='14' selected='selected'>14</option>
     <option value='15'>15</option>
     ...
     <option value='58'>58</option>
     <option value='59'>59</option>
    </select>

扩展例子

    {htmlSelectTime prefix="MyTime_" display_seconds=false use_24_hours=false}

输出

    <select name='MyTime_Hour'  >
     <option value='1'>1</option>
     ...
     <option value='11' selected='selected'>11</option>
     <option value='12'>12</option>
    </select>
    <select name='MyTime_Minute'  >
     <option value='0'>0</option>
     <option value='1'>1</option>
     ...
     <option value='38'>38</option>
     <option value='39' selected='selected'>39</option>
     ...
     <option value='58'>58</option>
     <option value='59'>59</option>
    </select>
    <select name='MyTime_Meridian'>
     <option value='am'>AM</option>
     <option value='pm' selected='selected'>PM</option>
    </select>

###include
include允许你插入其他模板到当前模板中

    include(string $file [, int $cache_time = null [, string $cache_id = null [, string $compile_id = null [, mixed $data = '_root' [, string $assign = null [, array $rest = array() ]]]]]])

> * file : include的资源名称
> * cache_time : 模板缓存时间，单位是秒，默认为null (= 会使用Dwoo对象的缓存时间)
> * cache_id : 模板的cache_id
> * compile_id : 模板的编译id
> * data : 这是一个包含数据的数组，会作为被引入模板的根数据，默认为当前传送的数据
> * assign : 如果设置了，引入进来的文件会被赋值到该变量中而不会输出
> * rest : 会覆盖$data参数的值 (详情见下面)

注: 所有的赋值变量都是从引入文件来的旧的且有效的数据！

注: 你不能使用`../`等路径来引入模板。但是如果是根目录的话可以使用`./`。

如例子所示，你要有一个被引入到你的所有页面中的公用的头部。可以通过这样来实现：

index.html:

    <html>
      <head>
        <title>Some awesome website</title>
      </head>
      <body>

        {include file="header.html"}

      </body>
    </html>

header.html:

    <h1>Some awesome website</h1>
    <div id="menu">
    {loop $menuItems}<a href="{$url}">{$title}</a>{/loop}
    </div>

输出：

    <html>
      <head>
        <title>Some awesome website</title>
      </head>
      <body>

        <h1>Some awesome website</h1>
        <div id="menu">
          <a href="index.html">Home</a>
          <a href="products.html">Products</a>
          <a href="contact.html">Contact</a>
        </div>

      </body>
    </html>

重写或解析模板变量

有时你需要在不引入使用Dwoo类的get/output方法得到的变量的模板的情况下解析变量。下面的例子可以帮你实现：

site_header.tpl:

    <html>
      <head>
        <title>{$title} - Awesome Inc.</title>
      </head>
      <body>

page_about.tpl:

    {include file="site_header.tpl" title="About Us"}

<!-- 公司的About us的页面内容如下 -->
在上面的例子中有两个文件，一个是头部和一些'关于我们'的片段的页面。page_about.tpl文件是在include语句中用title变量解析和传递它的标题--'About Us'以输出下面的内容：

    <html>
      <head>
        <title>About Us - Awesome Inc.</title>
      </head>
      <body>

###indent
在每一行的开头插入给定数量的字符

    indent(string $value, [ int $by = 4, [ string $char = ' ' ]])
> * value : 要缩进的字符串
> * by : 需要在每一行的头部插入的字符数
> * char : 需要插入的字符

例子

    baseline
    {indent "foo bar baz
    qux and then what was it
    again? quux quuux and so on I think"}

输出

    baseline

      foo bar baz
      
      qux and then what was it

      again? quux quuux and so on I think

###isset
检查变量是否非空

    isset(mixed $var)

> * var : 需要检查的变量

例子

    {if isset($foo)}SET{else}not set or null{/if}
    {$foo=1}
    {if isset($foo)}SET{else}not set or null{/if}
    {$bar=null}
    {if isset($bar)}SET{else}not set or null{/if}

输出结果：

    not set or null
    SET
    not set or null

注意下面这句：

`{if $foo}{$foo}{/if}`

是跟下面的这句一样作用的：

`{if isset($foo)}{$foo}{/if}`

###loadTemplates
在当前模板中加载其他模板，当前模板的任何有效变量在被引入的模板中也是有效的。

    loadTemplates(string $file)

> * file : 需要被子模板(使用{template}定义)解析的资源/模板名称。模板只在它们被引入的情况下可见，因此，如果你需要引入其他文件的话你需要调用load_templates函数。

例子

    {loadTemplates "subtemplates.tpl"}

###lower
将所给的字符串转换成小写

    lower(string $value)

> * value : 需要转换的字符串

例子

    {lower('ThiS IS a STRING')}

输出结果

>this is a string

###mailto
使用可选的垃圾邮件证明(可能失效)编码输出邮件地址

    mailto(string $address, [ string $text = null, [ string $subject = null, [ string $encode = null, [ string $cc = null, [ string $bcc = null, [ string $newsgroups = null, [ string $followupto = null, [ string $extra = null ]]]]]]]])

> * address : 目标邮件地址
> * text : 链接的展示文本，默认为邮箱地址
> * subject : 邮件主题
> * encode : 有效的编码方式(none, js, jscharcode or hex)
> * cc : 抄送地址, 用逗号分隔
> * bcc : 密件抄送地址, 用逗号分隔
> * newsgroups : 发送到新闻组邮箱地址, 用逗号分隔
> * followupto : 跟进的邮箱地址, 用逗号分隔
> * extra : 添加到标签的附加属性

例子

    {mailto "test@gmail.com" "Name" "subject"}

输出结果

    <a href="mailto:test@gmail.com?subject=subject" >Name</a>

###math
计算一个数学方程式

    math(string $equation, [ string $format = "", [ string $assign = "", [ array $rest = array() ]]])

> * equation : 需要计算的方程式，可以使用$foo或特殊的数学变量来包含一些基本的变量
> * format : 输出的结果的格式，与printf的相似
> * assign : 如果设置了，结果会被赋值到该变量中而不会输出
> * rest : 你所用到的数学变量都需要被定义，见例子

例子

    {$c=2}
    {math "(a+b)*$c/4" a=3 b=5} {* which translates to: ((3+5)*2/4) *}

输出

>4

###nl2br
转换换行为`<br />`标签

    nl2br(string $value)

> * value : 需要处理的字符串

例子

    {nl2br("string
    breaking")}

输出

    string`<br />`

    breaking

###optional
输出一个变量，如果不存在的话不给予任何提示

    optional(mixed $value)

> * value : 要输出的变量

例子

    {optional $var}

输出

(如果$var没有定义的话，没有任何输出，也没有warning提示)

###regexReplace
使用正则表达式搜索和替换字符串

    regexReplace(string $value, string $search, string $replace)

> * value : 搜索的字符串
> * search : 使用的搜索字符串
> * replace : 用于替换的内容，必须为完整的正则表达式


注意，如果你想使用反向应用的话，使用`\$1`、`\$2`而不是`$1`、`$2`，Dwoo会替换掉$1如果$1是一个变量的话。

例子

    {regexReplace "abcdABCD" "/([a-z])/" "\$1*"}

输出

>a\*b\*c\*d\*ABCD

###replace
字符串替换

    replace(string $value, mixed $search, mixed $replace)

> * value : 被搜索的字符串
> * search : 需要搜索的内容或一个数组
> * replace : 用于替换的字符串或者一个字符串数组(与搜索的数组一一对应)

例子

    {replace "abc" "b" "B"} or {"abc"|replace:array(a,c):array(A,C)}

输出

>aBc or AbC

###reverse
逆转字符串或者数组

    reverse(string $value, [ bool $preserve_keys = false ])

> * value : 需要逆转的字符串或者数组
> * preserve_keys : 如果value是一个数组而且这个值是true，那么数组的键值会在左边

例子

    {loop reverse(array('a', 'b', 'c'))}{$} {/loop}
    {"abc"|reverse}

输出

>c b a 

>cba

###safe
标记变量为安全的且移除自动转义函数，当且仅当你开启了自动转义函数时有效

    safe(mixed $var)

> * var : 需要处理的变量

例子

    {auto_escape on}
    {safe $user}
    {/auto_escape}

###spacify
在字符串的每一个字符之间增加空格(或者给定的字符)

    spacify(string $value, [ $space_char = ' ' ])

> * value : 字符串
> * space_char : 插入的字符

例子

    {spacify 'abcd'}
    {spacify 'abcd' '-'}

输出

>a b c d

>a-b-c-d

###stringFormat
使用springf函数格式化字符串

    stringFormat(string $value, string $format)

> * value : 需要格式化的字符串
> * format : 使用的格式，详情见sprintf函数

例子

    {stringFormat('23.5787446', "%.2f")}
    {stringFormat('23.5787446', "%d")}

输出

>23.58

>23

###stripTags
移除所有的html标签

    stripTags(string $value, [ bool $addspace = true ])

> * value : 处理的字符串
> * addspace : 如果是true，每个被移除的标签都会加上空格

例子

    {stripTags "foo<strong>bold</strong>bar"}
    {stripTags "foo<strong>bold</strong>bar" false}

输出

>foo bold bar

>fooboldbar

###tif
三元if运算符。

    tif(array $rest)

> * rest : 你不能使用命名参数来调用此函数，必须是三个按顺序排列的参数(表达式，true的值，false的值) or 或者使用PHP的语法 (expression ? true result : false result)

例子

    {$foo = "foo"}
    {tif $foo == "bar" ? "true" : "false"} {* full syntax *}
    {tif $foo ?: "false"} {* 你可以忽略true的值，expression部分会被重用为true的结果 *}
    {tif $foo ? "true"} {* 你可以忽略false的值，expression部分会被重用为false的结果 *}
    {tif $foo} {* 你可以忽略两个值，这种情况下，如果是true，那将输出$foo，否者没有任何输出 *}

    {$foo = null}
    {tif $foo == "bar" ? "true" : "false"}
    {tif $foo ?: "false"}
    {tif $foo ? "true"}
    {tif $foo}

输出

    true

    foo

    true

    foo

    false

    false

    (empty)

    (empty)

###truncate
截断字符串

    truncate(string $value, [ int $length = 80, [ string $etc = '...', [ bool $break = false, [ bool $middle = false ]]]])

> * value : 字符串
> * length : 字符串的最大长度
> * etc : 当字符串被截断后，添加到字符串后面的字符
> * break : 如果是true，在精确的长度位置开始截断，而不是从最近的空间了
> * middle : 如果是true，那么会从中间截断字符

例子

    {truncate "this text is really too long, or let's just pretend it is will you?" 30 middle=true}
    {strlen truncate("this text is really too long, or let's just pretend it is will you?" 30 middle=true)} {* 检查是否为30个字符 *}

输出

>this text is r... is will you?

>30

###upper
转换成大写

    upper(string $value)

> * value : 字符串

例子

    {upper('This is a String')}

输出

>THIS IS A STRING

###whitespace
替换所有字符串的空格

    whitespace(string $value, [ string $with = ' '])

> * value : 字符串
> * with : 替换到被移除位置的字符，注意，每一个连续的空格都会被一个字符串替换

例子

    {"a    b  c        d\ne"|whitespace}

输出

>a b c d e

###wordwrap
将字符串包成给定长度

    wordwrap(string $value, [ int $length = 80, [ string $break = "\n", [ bool $cut = false ]]])

> * value : 字符串
> * length : 最大长度
> * break : 用于分行的字符
> * cut : 如果是true，将会从某长度的位置开始截断

例子

    {wordwrap "abcdefghijklmnopqrstuvwxyz" 8 cut=true}

输出

>abcdefgh

>ijklmnop

>qrstuvwx

>yz
