---
layout: post
title: "[计算机网络]httpserver--如何解析HTTP请求报文"
date: 2016-11-06
tags: tech
author: hoohack
categories: 计算机网络
excerpt: 'socket,socket编程,server,http server,parse request,http request line'
keywords: 'socket,socket编程,server,http server,parse request,http request line'
---

这个http server的实现源代码我放在了[我的github上](https://github.com/hoohack/Makehttpd)，有兴趣的话可以点击查看哦。

在[上一篇文章](https://www.hoohack.me/2016/10/28/lcn-simple-server)中，讲述了如何编写一个最简单的server，但该程序只是接受到请求之后马上返回响应，实在不能更简单。在正常的开发中，应该根据不同的请求做出不同的响应。要做到上述的功能，首先要解析客户端发来的请求报文。

报文在不同的上下文情景下有不同的理解，本文所说的报文都是在HTTP上下文中描述的名词。

## HTTP报文是什么
在HTTP程序中，报文就是HTTP用来搬运东西的包裹，也可以理解为程序之间传递信息时发送的数据块。这些数据块以一些文本形式的元信息开头，这些信息描述了报文的内容和含义，后面跟着可选的数据部分。

## 报文的流动
HTTP使用属于流入和流出来描述报文的传递方向。HTTP报文会像合水一样流动。不管时请求报文还是响应报文，都会向下游流动，所有报文的发送者都在接受者的上游。下图展示了报文向下游流动的例子。



![报文向下游流动](https://www.hoohack.me/assets/images/package-float.png)

## 报文的组成

报文由三个部分组成：

> * 对报文进行描述的起始行
> * 包含属性的首部块
> * 可选的、包含数据的主体部分

起始行和首部是由行分隔的ASCII文本。每行都以一个由两个字符（回车符--ASCII码13和换行符--ASCII码10）组成的行终止序列结束。可以写做**CRLF**。

尽管规范说明应该用CRLF来表示行终止，但稳健的应用程序也应该接受单个换行作为行的终止。笔者仅支持以CRLF换行的解析，因为我觉得既然有了规范，那就需要遵循，遵循相同的协议的程序才能互相通信。

实体是一个可选的数据块。与起始行和首部不同的是，主体中可以包含主体或二进制数据，也可以为空（比如仅仅GET一个页面或文件）。

下面来看看报文的语法的格式和规则。

### 报文的语法
请求报文的语法：

<method> <request-URL> <version>
<headers>

<entity-body>

响应报文的语法：

<version> <status-code> <reason-phrase>
<headers>

<entity-body>

method，方法

> 客户端希望服务器对资源执行的操作。比如GET、POST

request-URL，请求URL

> 请求资源，或者URL路径组件的完整URL。

version，版本

> 报文所使用的HTTP版本。格式：HTTP/<major>.<minor>。其中major(主要版本号)和minor(次要版本号)都是整数。

status-code，状态码

> 描述请求过程所发生的情况的数字。

reason-phrase，原因短语

> 数字状态码的文字描述版本。

headers，首部

> 每个首部包含一个名字，后面跟着一个冒号(:)，然后是一个可选的空格，接着是一个值，最后是一个CRLF。可以有零个或多个首部。首部由一个CRLF结束，表示首部结束和实体主体开始。

entity-body，实体的主体部分

> 包含一个由任意数据组成的数据块。可以没有，此时是以一个CRLF结束。

### 请求行

请求报文的起始行称为请求行。所有的HTTP报文都以一行起始行作为开始。请求行包含一个方法和一个请求URL以及HTTP的版本三个字段。每个字段都以空格分隔。

比如：**GET / HTTP/1.1**。

请求方法为GET，请求URL为/，HTTP版本为HTTP/1.1。

### 响应行
响应报文的起始行称为响应行。响应行包含HTTP版本、数字状态码以及描述操作状态的文本形式的原因短语。三个字段也是以空格分隔。

比如：**HTTP/1.1 200 OK**。

HTTP版本为HTTP/1.1，数字状态码是200，原因短语是OK。表示请求成功。

### 首部
首部是是包含在请求和响应报文的一些附加信息。本质上，他们只是一些键值对的列表。

比如：**Content-Length: 19**

表示返回内容长度为19。

### 实体的主体部分
简单地说，这部分就是HTTP要传输的内容。

## 解析请求报文
了解了报文是如何组成和各部分代表的内容之后，就对如何解析请求报文心里有数了。

### 核心代码


/* 解析请求行 */
int parse_start_line(int sockfd, char *recv_buf, req_pack *rp)
{
	char *p = recv_buf;
	char *ch = p;
	int i = 0;
	enum parts { method, url, ver } req_part = method;
	char *method_str;
	char *url_str;
	char *ver_str;
	int k = 0;

	if (*ch < 'A' || *ch > 'Z') {
		return -1;
	}

	while (*ch != CR) {
		if (*ch != BLANK) {
			k++;
		} else if (req_part == method) {
			method_str = (char *)malloc(k * sizeof(char *));
			memset(method_str, 0, sizeof(char *));
			strncpy(method_str, recv_buf, k);
			k = 0;
			req_part = url;
		} else if (req_part == url) {
			url_str = (char *)malloc(k * sizeof(char *));
			memset(url_str, 0, sizeof(char *));
			strncpy(url_str, recv_buf + strlen(method_str) + 1, k);
			k = 0;
			req_part = ver;
		}
		ch++;
		i++;
	}

	if (req_part == url) {
		if (k != 0) {
			url_str = (char *)malloc(k * sizeof(char));
			memset(url_str, 0, sizeof(char));
			strncpy(url_str, recv_buf + strlen(method_str) + 1, k);
			k = 0;
		} else {
			return -1;
		}
	}

	if (k == 0) {
		ver_str = (char *)malloc(8 * sizeof(char));
		memset(ver_str, 0, sizeof(char));
		strcpy(ver_str, "HTTP/1.1");
	} else {
		ver_str = (char *)malloc(k * sizeof(char));
		memset(ver_str, 0, sizeof(char));
		strncpy(ver_str,
				recv_buf + strlen(method_str) + strlen(url_str) + 2, k);
	}

	rp->method = method_str;
	rp->url = url_str;
	rp->version = ver_str;

	return (i + 2);
}

/* 解析首部字段 */
int parse_header(int sockfd, char *recv_buf, header headers[])
{
	char *p = recv_buf;
	char *ch = p;
	int i = 0;
	int k = 0;
	int v = 0;
	int h_i = 0;
	bool is_newline = false;
	char *key_str;
	char *value_str;
	header *tmp_header = (header *)malloc(sizeof(header *));
	memset(tmp_header, 0, sizeof(header));

	while (1) {
		if (*ch == CR && *(ch + 1) == LF) {
			break;
		}
		while (*ch != COLON) {
			ch++;
			i++;
			k++;
		}
		if (*ch == COLON) {
			key_str = (char *)malloc(k * sizeof(char *));
			memset(key_str, 0, sizeof(char *));
			strncpy(key_str, recv_buf + i - k, k);
			k = 0;
			ch++;
			i++;
		}
		while (*ch != CR) {
			ch++;
			i++;
			v++;
		}
		if (*ch == CR) {
			value_str = (char *)malloc(v * sizeof(char *));
			memset(value_str, 0, sizeof(char *));
			strncpy(value_str, recv_buf + i - v, v);
			v = 0;
			i++;
			ch++;
		}
		i++;
		ch++;
		headers[h_i].key = key_str;
		headers[h_i].value = value_str;
		h_i++;
	}

	return (i + 2);
}

### 解析思想

遍历recv接受到的请求字符串，检查是否遇到回车符**\r**判断一行数据。

对于起始行，检查是否遇到空格分隔不同的字段；对于首部，检查是否遇到冒号分隔键值对的字段值；对于实体的主体部分，则先判断是否遇到CRLF字符串，然后将剩余内容全部作为实体的主体部分。

返回值是告知程序下一次遍历的起始位置。

如果遇到非法请求行则返回400的响应。

## 总结
解析报文的过程就是遵循HTTP协议规定的内容去解析报文，获取报文包含的信息。

由于基础知识较薄弱，代码还有很多错误以及很多地方需要优化。如果有看到错误的地方或有其它建议望各位大侠不吝赐教。^_^

这个http server的实现源代码我放在了[我的github上](https://github.com/hoohack/Makehttpd)，有兴趣的话可以点击查看哦。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。

如果本文对你有帮助，请点下推荐吧，谢谢^_^
