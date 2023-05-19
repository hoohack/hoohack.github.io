---
layout: post
title: "使用拦截器统一处理异常"
date: '2020-06-13'
tags: blog
author: hoohack
categories: Java
excerpt: 'Java,AOP,拦截器,代码优化,整洁代码,Spring ExceptionHandler,ExceptionHandler,统一处理,统一异常处理'
keywords: 'Java,AOP,拦截器,代码优化,整洁代码,Spring ExceptionHandler,ExceptionHandler,统一处理,统一异常处理'

---

作为一个业务仔，在业务接口代码中肯定会遇到处理异常的情况，比如有代码逻辑的异常，业务逻辑的异常等等。这些异常场景是非常非常多的，这么多异常逻辑要处理，就意味着要写很多重复的代码，作为一个有点追求的业务仔，不能只是懂得CURD，当然希望代码看起来简洁、舒服一点。

本文打算分享笔者处理异常情况的演进过程，然后给出统一异常处理的示例。

一开始的方法是定义一个业务异常类，当捕获到业务异常时，使用异常的错误码和错误信息，构造错误提示返回。



```java
/**
* 错误码枚举类
*/
public enum ResponseCode {
    SUCCESS(0, "OK"),
    SERVER_ERROR(1, "server error");

    private int code;
    private String msg;

    ResponseCode(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }

    public int getCode() {
        return code;
    }

    public ResponseCode setCode(int code) {
        this.code = code;
        return this;
    }

    public String getMsg() {
        return msg;
    }

    public ResponseCode setMsg(String msg) {
        this.msg = msg;
        return this;
    }
}

/**
* 自定义业务异常类
*/
public class BizException extends RuntimeException {

    private final int code;

    public BizException(ResponseCode errCode) {
        super(errCode.getMsg());
        this.code = errCode.getCode();
    }

    public BizException(ResponseCode errCode, String msg) {
        super(msg);
        this.code = errCode.getCode();
    }

    public BizException(int code, String msg) {
        super(msg);
        this.code = code;
    }

    public int getCode() {
        return this.code;
    }

}

class TestService {
	public void testAMethod() {
		// 业务异常代码
		throw new BizException(ResponseCode.BIZ_CODE);
	}
}

/**
* 接口返回的通用结构HttpResult
* {"code": 0, "msg": "OK"}
*/
class TestController {

	@Autowired
	private TestService testService;

	public HttpResult testA() {
		try {
			testService.testAMethod();
		} catch (BizException e) {
			return HttpResult(e.getCode(), e.getMsg());
		} catch (Exception e) {
			return HttpResult(ResponseCode.SERVER_ERROR);
		}

		return HttpResult(ResponseCode.SUCCESS);
	}

}

```

后来发现需要进行一次优化，首先，随着业务代码越来越多，这些try...catch看起来就好臃肿了。

其次，在底层代码有异常时也要在外层捕获住，然后一层一层地往外抛，直到业务接口返回处返回错误信息，如果是一个业务逻辑特别复杂的接口，这些异常处理的代码就会遍布整个系统，使得这些异常代码看起来十分不美观，代码可读性也较差。

久而久之，就在想是否有一种跟[校验拦截器](https://www.hoohack.me/2020/04/22/common-check-with-interceptor)一样的方法，在某个地方统一处理这些判断，使得代码看起来比较美观。**答案是有的**，就是使用`ExceptionHandler`和`RestControllerAdvice`注解。

首先，定义一个类：`SpringMvcExceptionDemo`，类加上`RestControllerAdvice`注解，类里面定义一个方法exceptionHandler，方法前面加上`ExceptionHandler`注解，然后就可以在方法里面写异常判断逻辑，对异常逻辑进行相应的处理。

具体的实现代码示例如下：

```java

@RestControllerAdvice
public class SpringMvcExceptionDemo {

    @ExceptionHandler
    public Object exceptionHandler(Exception e, HttpServletRequest request, HttpServletResponse response) {
        if (e instanceof BizException) {
            BizException be = (BizException) e;
            return new HttpResult(be.getCode(), be.getMessage());
        }
        if (e instanceof IllegalArgumentException) {
            return new HttpResult(ResponseCode.PARAM_ERROR.getCode(), e.getMessage());
        }

        return new HttpResult(ResponseCode.SERVER_ERR);
    }

}

public HttpResult testA() {
	testService.testAMethod();
	return HttpResult(ResponseCode.SUCCESS);
}

```

这样一来，就只需要在该抛出业务异常的地方抛出异常，由拦截器统一处理异常即可，减少了很多重复代码，同时提高代码的可读性。

RestControllerAdvice 和 ExceptionHandler
> RestControllerAdvice是Spring框架中的一个注解，这个注解包含了`ControllerAdvice`和`ResponseBody`，帮助我们通过加入一个横切点`ExceptionHandler`来处理RestfulAPI中的异常。执行的时机是在`doDispatch`中，调用`processDispatchResult`方法，如果有异常，则会调用添加了`ExceptionHandler`注解的方法去判断。

流程图如下：

![统一处理异常拦截器流程](https://www.hoohack.me/assets/images/2020/06/exception-handler-progress.jpg)

核心处理代码：
```java
for (HandlerExceptionResolver handlerExceptionResolver : this.handlerExceptionResolvers) {
	exMv = handlerExceptionResolver.resolveException(request, response, handler, ex);
	if (exMv != null) {
		break;
	}
}
```

## 总结
代码和原理比较简单，统一处理异常的目的只是为了消除重复的代码块，写出更简洁的代码，现在写代码也是坚持这个想法，希望能探索出更多的技巧，有其他技巧的也欢迎一起讨论。

原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。





