---
layout: post
title: "[计算机网络]简易http server程序"
date: 2016-10-28
tags: tech
author: hoohack
categories: 计算机网络
excerpt: 'socket,socket编程,server,http server'
keywords: 'socket,socket编程,server,http server'
---

这个http server的实现源代码我放在了[我的github上](https://github.com/hoohack/Makehttpd)，有兴趣的话可以点击查看哦。

好久没输出了，知识还是要写下总结才能让思路更加清晰。最近在学习计算机网络相关的知识，来聊聊如何编写一个建议的HTTP服务器。

## HTTP 服务器
HTTP服务器，就是一个运行在主机上的程序。程序启动了之后，会一直在等待其他所有客户端的请求，接收到请求之后，处理请求，然后发送响应给客户端。客户端和服务器之间使用HTTP协议进行通信，所有遵循HTTP协议的程序都可以作为客户端。

先直接上代码，然后再详细说明实现细节。



#include <stdio.h>
#include <ctype.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#define PORT 9001
#define QUEUE_MAX_COUNT 5
#define BUFF_SIZE 1024

#define SERVER_STRING "Server: hoohackhttpd/0.1.0\r\n"

int main()
{
	/* 定义server和client的文件描述符 */
	int server_fd = -1;
	int client_fd = -1;

	u_short port = PORT;
	struct sockaddr_in client_addr;
	struct sockaddr_in server_addr;
	socklen_t client_addr_len = sizeof(client_addr);

	char buf[BUFF_SIZE];
	char recv_buf[BUFF_SIZE];
	char hello_str[] = "Hello world!";

	int hello_len = 0;

	/* 创建一个socket */
	server_fd = socket(AF_INET, SOCK_STREAM, 0);
	if (server_fd == -1) {
		perror("socket");
		exit(-1);
	}
	memset(&server_addr, 0, sizeof(server_addr));
	/* 设置端口，IP，和TCP/IP协议族 */
	server_addr.sin_family = AF_INET;
	server_addr.sin_port = htons(PORT);
	server_addr.sin_addr.s_addr = htonl(INADDR_ANY);

	/* 绑定套接字到端口 */
	if (bind(server_fd, (struct sockaddr *)&server_addr,
				sizeof(server_addr)) < 0) {
		perror("bind");
		exit(-1);
	}

	/* 启动socket监听请求，开始等待客户端发来的请求 */
	if (listen(server_fd, QUEUE_MAX_COUNT) < 0) {
		perror("listen");
		exit(-1);
	}

	printf("http server running on port %d\n", port);

	while (1) {
		/* 调用了accept函数，阻塞了程序，直到接收到客户端的请求 */
		client_fd = accept(server_fd, (struct sockaddr *)&client_addr,
				&client_addr_len);
		if (client_fd < 0) {
			perror("accept");
			exit(-1);
		}
		printf("accept a client\n");

		printf("client socket fd: %d\n", client_fd);
		/* 调用recv函数接收客户端发来的请求信息 */
		hello_len = recv(client_fd, recv_buf, BUFF_SIZE, 0);

		printf("receive %d\n", hello_len);

		/* 发送响应给客户端 */
		sprintf(buf, "HTTP/1.0 200 OK\r\n");
		send(client_fd, buf, strlen(buf), 0);
		strcpy(buf, SERVER_STRING);
		send(client_fd, buf, strlen(buf), 0);
		sprintf(buf, "Content-Type: text/html\r\n");
		send(client_fd, buf, strlen(buf), 0);
		strcpy(buf, "\r\n");
		send(client_fd, buf, strlen(buf), 0);
		sprintf(buf, "Hello World\r\n");
		send(client_fd, buf, strlen(buf), 0);

		/* 关闭客户端套接字 */
		close(client_fd);
	}

	close(server_fd);

	return 0;
}

## 测试运行
代码写好之后，运行测试一下，将上面代码保存到server.c，然后编译程序：

gcc server.c -o server

./server运行

![runserver](http://7u2eqw.com1.z0.glb.clouddn.com/runserver.jpg)

服务器运行，监听9001端口。再用`netstat`命令查看：
![server_netstat](http://7u2eqw.com1.z0.glb.clouddn.com/server_netstat.jpg)

server程序在监听9001端口，运行正确。接着用浏览器访问http://localhost:9001

![browser_server](http://7u2eqw.com1.z0.glb.clouddn.com/browser_server.jpg)

成功输出了Hello World

再尝试用`telnet`去模拟HTTP请求：

![telnet_http](http://7u2eqw.com1.z0.glb.clouddn.com/telnet_http.jpg)

* 1、成功连接
* 2、发送HTTP请求
* 3、HTTP响应结果

上面是一个最简单的server程序，代码比较简单，省去一些细节，下面通过代码来学习一下socket的编程细节。

## 启动server的流程
![server流程](http://7u2eqw.com1.z0.glb.clouddn.com/server.png)

## socket 函数
创建一个套接字，通过各参数指定套接字的类型。

int socket(int family, int type, int protocol);

* family：协议族。AF_INET：IPV4协议；AF_INET6：IPv6协议；AF_LOCAL：Unix域协议；AF_ROUTE：路由套接字；AF_KEY：密钥套接字
* type：套接字类型。SOCK_STREAM ： 字节流套接字；SOCK_DGRAM：数据包套接字；SOCK_SEGPACKET：有序分组套接字；SOCK_RAW：原始套接字
* protocol：某个协议类型常量。TCP：0，UDP ：1， SCTP ：2

### 套接字地址结构
在socket编程中，大部分函数都用到一个指向套接字地址结构的指针作为参数。针对不同的协议类型，会有不同的结构体定义格式，对于ipv4，结构如下所示：

struct sockaddr_in {
	uint8_t            sin_len;        /* 结构体的长度 */
	sa_family_t        sin_family;     /* IP协议族，IPV4是AF_INET */
	in_port_t          sin_port;       /* 一个16比特的TCP/UDP端口地址 */
	struct in_addr     sin_addr;       /* 32比特的IPV4地址，网络字节序 */
	char               sin_zero[8];    /* 未使用字段 */
};
注：sockaddr_in是**Internet socket address structure**的缩写。

### ip地址结构

struct in_addr {
	in_addr_t      s_addr;
};

套接字地址结构的作用是为了将ip地址和端口号传递到socket函数，写成结构体的方式是为了抽象。当作为一个参数传递进任何套接字函数时，套接字地址结构总是以引用方式传递。然而，协议族有很多，因此以这样的指针作为参数之一的任何套接字函数必须处理来自所有支持的任何协议族的套接字地址结构。使用`void *`作为通用的指针类型，因此，套接字函数被定义为以指向某个通用套接字结构的一个指针作为其参数之一，正如下面的bind函数原型一样。

int bind(int, struct sockaddr *, socklen_t);

这就要求，对这些函数的任何调用都必须要将指向特定于协议的套接字地址结构的指针进行强制类型转换，变成某个通用套接字地址结构的指针。例如：

struct sockaddr_in addr;
bind(sockfd, (struct sockaddr *)&addr , sizeof(addr));

对于所有socket函数而言，sockaddr的唯一用途就是对指向特定协议的套接字地址结构的指针执行强制类型转换，指向要绑定给sockfd的协议地址。

## bind函数
将套接字地址结构绑定到套接字

int bind(sockfd, (struct sockaddr *)&addr, sizeof(addr));
* sockfd：socket描述符，唯一标识一个socket。bind函数就是将这个描述字绑定一个名字。
* addr：一个sockaddr指针，指向要绑定给sockfd的协议地址。一个socket由ip和端口号唯一确定，而sockaddr就包含了ip和端口的信息
地址的长度

绑定了socket之后，就可以使用该socket开始监听请求了。

## listen函数
将sockfd从未连接的套接字转换成一个被动套接字，指示内核应接受指向该套接字的连接请求。

int listen(int sockfd, int backlog);
listen函数会将套接字从CLOSED状态转换到LISTEN状态，第二个参数规定内核应该为相应套接字排队的最大连接个数。

关于backlog参数，内核为任何一个给定的监听套接字维护两个队列：
> * 1、未完成连接队列，在队列里面的套接字处于SYN_RCVD状态
> * 2、已完成队列，处于ESTABLISHED状态

两个队列之和不超过backlog的大小。

listen完成之后，socket就处于LISTEN状态，此时的socket调用accept函数就可以接受客户端发来的请求了。

## accept函数

int accept(int sockfd, struct sockaddr *cliaddr, socklen_t *addrlen);
用于从已完成连接队列头返回下一个已完成连接，如果已完成连接队列为空，那么进程就会被阻塞。因此调用了accept函数之后，进程就会被阻塞，直到有新的请求到来。

第一个参数sockfd是客户端的套接字描述符，第二个是客户端的套接字地址结构，第三个是套接字地址结构的长度。

如果accept成功，那么返回值是由内核自动生成的全新描述符，代表所返回的客户端的TCP连接。

对于accept函数，第一个参数称为监听套接字描述符，返回值称为已连接套接字。服务器仅创建监听套接字，它一直存在。已连接套接字由服务器进程接受的客户连接创建，当服务器完成某个连接的响应后，相应的已连接套接字就被关闭了。

accept函数返回时，会返回套接字描述符或出错指示的整数，以及引用参数中的套接字地址和该地址的大小。如果对返回值不感兴趣，可以把两个引用参数设为空。

accept之后，一个TCP连接就建立起来了，接着，服务器就接受客户端的请求信息，然后做出响应。

## recv和send函数

ssize_t recv(int sockfd, void *buff, size_t nbytes, int flags);
ssize_t send(int sockfd, const void *buff, size_t nbytes, int flags);

分别用于从客户端读取信息和发送信息到客户端。在此不做过多的解释。

## 套接字地址结构大小和值-结果参数
可以看到，在bind函数和accept函数里面，都有一个套接字地址结构长度的参数，区别在于一个是值形式，另一个是引用形式。套接字地址结构的传递方式取决于该结构的传递方向：是从进程到内核，还是从内核到进程。

1、从进程到内核：bind、connect、sendto。
函数将指针和指针所指内容的大小都传给了内核，于是内核知道到底需要从进程复制多少数据进来。

2、从内核到进程：
accept、recvfrom、getsockname、getperrname。
这四个函数的结构大小是以只引用的方式传递。
因为当函数被调用时，结构大小是一个值，它告诉内核该结构的大小，这样内核在写该结构时不至于越界；当函数返回时，结构大小又是一个结果，它告诉内核在该结构中究竟存储了多少信息。

## HTTP响应报文
发送响应给客户端时，发送的报文要遵循HTTP协议，HTTP的响应报文格式如下：

<status-line>
<headers>
<blank line>
[<response-body>]

第一行status-line，状态栏，格式：`HTTP版本 状态码 状态码代表文字`headers是返回报文的类型，长度等信息，接着是一个空行，然后是响应报文的实体。

一个HTTP响应报文例子：

HTTP/1.1 200 OK
Content-Type: text/html;charset=utf-8
Content-Length: 122

<html>
<head>
<title>Hello Server</title>
</head>
<body>
Hello Server
</body>
</html>

最后close函数关闭套接字，时刻保持关闭文件描述符是一个很好的编程习惯。

## 总结
虽然很多东西看起来很简单，但只有自己真正动手做一遍，才发现其中的简单，之后才能说这些基础是最简单的。要更好和更深入地理解系统的知识，你必须重新一点一点地重新构建一次。

这个http server的实现源代码我放在了[我的github上](https://github.com/hoohack/Makehttpd)，有兴趣的话可以点击查看哦。
