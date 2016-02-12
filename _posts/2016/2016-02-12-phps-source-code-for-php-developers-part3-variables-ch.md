---
layout: post
title: "【译】PHP的变量实现（给PHP开发者的PHP源码-第三部分）"
date: '2016-02-12 11:00:00'
author: Hector
categories: PHP
excerpt: 'PHP,PHP源码,PHP源码结构,PHP源码分析,PHP变量'
keywords: 'PHP,PHP源码,PHP源码结构,PHP源码分析,PHP变量'
---

在"给PHP开发者的PHP源码"系列的第三篇文章，我们打算扩展上一篇文章来帮助理解PHP内部是怎么工作的。在第一篇文章，我们介绍了如何查看PHP的源码，它的代码结构是怎样的以及一些介绍给PHP开发者的C指针基础。第二篇文章介绍了函数。这一次，我们打算深入PHP最有用的结构之一：变量。

## 进入ZVAL
在PHP的核心代码中，变量被称为`ZVAL`。这个结构之所以那么重要是有原因的，不仅仅是因为PHP使用弱类型而C使用强类型。那么ZVAL是怎么解决这个问题的呢？要回答这个问题，我们需要认真的查看ZVAL类型的定义。要查看这个定义，让我们尝试在lxr页面的定义搜索框里搜索zval。乍一眼看去，我们似乎找不到任何有用的东西。但是有一行`typedef`在zend.h文件（typedef在C里面是一种定义新的数据类型的方式）。这个也许就是我们要找的东西，再继续查看。原来，这看起来是不相干的。这里并没有任何有用的东西。但为了确认一些，我们来点击`_zval_struct`这一行。

    struct _zval_struct {
    /* Variable information */
    zvalue_value value; /* value */
    zend_uint refcount__gc;
    zend_uchar type; /* active type */
    zend_uchar is_ref__gc;
    };

然后我们就得到PHP的基础，zval。看起来很简单，对吗？是的，没错，但这里还有一些很有意义的神奇的东西。注意，这是一个结构或结构体。基本上，这可以看作PHP里面的类，这些类只有公共的属性。这里，我们有四个属性：`value`,`refcount__gc`,`type`以及`is_ref__gc`。让我们来一一查看这些属性（省略它们的顺序）。

### Value
我们第一个谈论的元素是value变量，它的类型是`zvalue_value`。我不认识你，但我也从来没有听说过`zvalue_value`。那么让我们尝试弄懂它是什么。跟网站的其他部分一样，你可以点击某个类型查看它的定义。一旦你点击了，你会看到它的定义跟下面的是一样的：
    
    typedef union _zvalue_value {
        long lval; /* long value */
        double dval; /* double value */
        struct {
            char *val;
            int len;
        } str;
        HashTable *ht; /* hash table value */
        zend_object_value obj;
    } zvalue_value;

现在，这里有一些黑科技。看到那个union的定义吗？那意味着这不是真正的结构体，而是一个单独的类型。但是有多个类型的变量在里面。如果这里面有多种类型的话，那它怎么能作为单一的类型呢？我很高兴你问了这个问题。要理解这个问题，我们需要先回想我们在第一篇文章谈论的C语言中的类型。

在C里面，变量只是一行内存地址的标签。也可以说类型只是标识哪一块内存将被使用的方式。在C里面没有使用任何东西将4个字节的字符串和整型值分隔开。它们都只是一整块的内存。编译器会尝试通过"标识"内存段作为变量来解析它，然后将这些变量转换为特定的类型，但这并不是总是成功（顺便说一句，当一个变量“重写”它得到的内存段，那将会产生段错误）。

那么，据我们所知，union是单独的类型，它根据怎么被访问而使用不同的方式解释。这可以让我们定义一个值来支持多种类型。有一点要注意的是，所有类型的数据都必须使用同一块内存来存储。这个例子，在64位的编译器，long和double都会占用64个位来保存。字符串结构体会占用96位（64位存储字符指针，32位保存整型长度）。`hash_table`会占用64位，还有`zend_object_value`会占用96位（32位用来存储元素，剩下的64位来存储指针）。而整一个union会占用最大元素的内存大小，因此在这里就是96位。

现在，如果再看清楚这个联合体（union），我们可以看到只有5种PHP数据类型在这里（long == int，double == float，str == string，hashtable == array，zend_object_value == object）。那么剩下的数据类型去了哪里呢？原来，这个结构体已经足够来存储剩余的数据类型。BOOL使用long(int)来存储，`NULL`不占用数据段，`RESOURCE`也使用long来存储。

### TYPE
因为这个value联合体并没有控制它是怎么被访问的，我们需要其他方式来记录变量的类型。这里，我们可以通过数据类型来得出如何访问value的信息。它使用type这个字节来处理这个问题（`zend_uchar`是一个无符号的字符，或者内存中的一个字节）。它从zend类型常量保留这些信息。这真的是一种魔法，是需要使用`zval.type = IS_LONG`来定义整型数据。因此这个字段和value字段就足够让我们知道PHP变量的类型和值。

### IS_REF
这个字段标识变量是否为引用。那就是说，如果你执行了在变量里执行了`$foo = &$bar`。如果它是0，那么变量就不是一个引用，如果它是1，那么变量就是一个引用。它并没有做太多的事情。那么，在我们结束`_zval_struct`之前，再看一看它的第四个成员。

### REFCOUNT
这个变量是指向PHP变量容器的指针的计数器。也就是说，如果refcount是1，那就表示有一个PHP变量使用这个容器。如果refcount是2，那就表示有两个PHP变量指向同一个变量容器。单独的refcount变量并没有太多有用的信息，但如果它与`is_ref`一起使用，就构成了垃圾回收器和写时复制的基础。它允许我们使用同一个zval容器来保存一个或多个PHP变量。refcount的语义解释超出这篇文章的范围，如果你想继续深入，我推荐你查看这篇文档。

这就是ZVAL的所有内容。

## 它是怎么工作的？
在PHP内部，zval使用跟其他C变量一样，作为内存段或者一个指向内存段的指针（或者指向指针的指针，等等），传递到函数。一旦我们有了变量，我们就想访问它里面的数据。那我们要怎么做到呢？我们使用定义在`zend_operators.h`文件里面的宏来跟zval一起使用，使得访问数据更简单。有一点很重要的是，每一个宏都有多个拷贝。不同的是它们的前缀。例如，要得出zval的类型，有`Z_TYPE(zval)`宏，这个宏返回一个整型数据来表示zval参数。但这里还有一个`Z_TYPE(zval_p)`宏，它跟`Z_TYPE(zval)`做的事情是一样的，但它返回的是指向zval的指针。事实上，除了参数的属性不一样之外，这两个函数是一样的，实际上，我们可以使用`Z_TYPE(*zval_p)`，但_P和_PP让事情更简单。

我们可以使用VAL这一类宏来获取zval的值。可以调用`Z_LVAL(zval)`来得到整型值（比如整型数据和资源数据）。调用`Z_DVAL(zval)`来得到浮点值。还有很多其他的，到这里到此为止。要注意的关键是，为了在C里面获取zval的值，你需要使用宏（或应该）。因此，当我们看见有函数使用它们时，我们就知道它是从zval里面提取它的值。

## 那么，类型呢？
到现在为止，我们知识谈论了类型和zval的值。我们都知道，PHP帮我们做了类型判断。因此，如果我们喜欢，我们可以将一个字符串当作一个整型值。我们把这一步叫做`convert_to_type`。要转换一个zval为string值，就调用`convert_to_string`函数。它会改变我们传递给函数的ZVAL的类型。因此，如果你看到有函数在调用这些函数，你就知道它是在转换参数的数据类型。

## Zend_Parse_Paramenters
上一篇文章中，介绍了`zend_parse_paramenters`这个函数。既然我们知道PHP变量在C里面是怎么表示的，那我们就来深入看看。
    
    ZEND_API int zend_parse_parameters(int num_args TSRMLS_DC, const char *type_spec, ...) /* {{{ */
    {
        va_list va;
        int retval;

        RETURN_IF_ZERO_ARGS(num_args, type_spec, 0);

        va_start(va, type_spec);
        retval = zend_parse_va_args(num_args, type_spec, &va, 0 TSRMLS_CC);
        va_end(va);

        return retval;
    }

现在，从表面上看，这看起来很迷惑。重点要理解的是，va_list类型只是一个使用'...'的可变参数列表。因此，它跟PHP中的`func_get_args()`函数的构造差不多。有了这个东西，我们可以看到`zend_parse_parameters`函数马上调用`zend_parse_va_args`函数。我们继续往下看看这个函数...

这个函数看起来很有趣。第一眼看去，它好像做了很多事情。但仔细看看。首先，我们可以看到一个for循环。这个for循环主要遍历从`zend_parse_parameters`传递过来的`type_spec`字符串。在循环里面我们可以看到它只是计算期望接收到的参数数量。它是如何做到这些的研究就留给读者。

继续往下看，我么可以看到有一些合理的检查（检查参数是否都正确地传递），还有错误检查，检查是否传递了足够数量的参数。接下来进入一个我们感兴趣的循环。这个循环真正解析那些参数。在循环里面，我们可以看到有三个if语句。第一个处理可选参数的标识符。第二个处理`var-args`(参数的数量)。第三个if语句正是我们感兴趣的。可以看到，这里调用了`zend_parse_arg()`函数。让我们再深入看看这个函数...

继续往下看，我们可以看到这里有一些非常有趣的事情。这个函数再调用另一个函数（zend_parse_arg_impl），然后得到一些错误信息。这在PHP里面是一种很常见的模式，将函数的错误处理工作提取到父函数。这样代码实现和错误处理就分开了，而且可以最大化地重用。你可以继续深入研究那个函数，非常容易理解。但我们现在仔细看看`zend_parse_arg_impl()`...

现在，我们真正到了PHP内部函数解析参数的步骤。让我们看看第一个switch语句的分支，这个分支用来解析整型参数。接下来的应该很容易理解。那么，我们从分支的第一行开始吧：

    long *p = va_arg(*va, long *);

如果你记得我们之前说的，va_args是C语言处理变量参数的方式。所以这里是定义一个整型指针（long在C里面是整型）。总之，它从va_arg函数里面得到指针。这说明，它得到传递给zend_parse_parameters函数的参数的指针。所以这就是我们会用分支结束后的值赋值的指针结果。接下来，我们可以看到进入一个根据传递进来的变量（zval）类型的分支。我们先看看`IS_STRING`分支（这一步会在传递整型值到字符串变量时执行）。

    case IS_STRING:
    {
        double d;
        int type;

        if ((type = is_numeric_string(Z_STRVAL_PP(arg), Z_STRLEN_PP(arg), p, &d, -1)) == 0) {
            return "long";
        } else if (type == IS_DOUBLE) {
            if (c == 'L') {
                if (d > LONG_MAX) {
                    *p = LONG_MAX;
                    break;
                } else if (d < LONG_MIN) {
                    *p = LONG_MIN;
                    break;
                }
            }

            *p = zend_dval_to_lval(d);
        }
    }
    break;

现在，这个做的事情并没有看起来的那么多。所有的事情都归结与`is_numeric_string`函数。总的来说，该函数检查字符串是否只包含整数字符，如果不是的话就返回0。如果是的话，它将该字符串解析到变量里（整型或浮点型，p或d），然后返回数据类型。所以我们可以看到，如果字符串不是纯数字，他返回“long”字符串。这个字符串用来包装错误处理函数。否则，如果字符串表示double（浮点型），它先检查这个浮点数作为整型数来存储的话是否太大，然后它使用`zend_dval_to_lval`函数来帮助解析浮点数到整型数。这就是我们所知道的。我们已经解析了我们的字符串参数。现在继续看看其他分支：
    
    case IS_DOUBLE:
        if (c == 'L') {
            if (Z_DVAL_PP(arg) > LONG_MAX) {
                *p = LONG_MAX;
                break;
            } else if (Z_DVAL_PP(arg) < LONG_MIN) {
            *p = LONG_MIN;
            break;
        }
    }
    case IS_NULL:
    case IS_LONG:
    case IS_BOOL:
    convert_to_long_ex(arg);
    *p = Z_LVAL_PP(arg);
    break;

这里，我们可以看到解析浮点数的操作，这一步跟解析字符串里的浮点数相似（巧合？）。有一个很重要的事情要注意的是，如果参数的标识不是大写'L'，它会跟其他类型变量一样的处理方式（这个case语句没有break）。现在，我们还有一个有趣的函数，convert_to_long_ex()。这跟我们之前说到的convert_to_type()函数集合是一类的，该函数转换参数为特定的类型。唯一的不同是，如果参数不是引用的话（因为这个函数在改变数据类型），这个函数就将变量的值及其引用分离（拷贝）了。( The only difference is that it separates (copies) the passed in variable if it's not a reference (since it's changing the type). )这就是写时复制的作用。因此，当我们传递一个浮点数到到一个非引用的整型变量，该函数会把它当作整型来处理，但我们仍然可以得到浮点型数据。
    
    case IS_ARRAY:
    case IS_OBJECT:
    case IS_RESOURCE:
    default:
    return "long";

最后，我们还有另外三个case分支。我们可以看到，如果你传递一个数组、对象、资源或者其他不知道的类型到整型变量中，你会得到错误。

剩下的部分我们留给读者。阅读`zend_parse_arg_impl`函数对更好地理解额PHP类型判断系统真的很有用。一部分一部分地读，然后尽量追踪在C里面的各种参数的状态和类型。

下一部分
下一部分会在Nikic的博客（我们会在这个系列的文章来回跳转）。在下一篇，他会谈到数组的所有内容。