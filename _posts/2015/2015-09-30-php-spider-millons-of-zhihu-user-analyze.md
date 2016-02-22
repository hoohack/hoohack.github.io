---
layout: post
title:  "【php爬虫】百万级别知乎用户数据爬取与分析"
date:   '2015-09-30 17:00:37'
author: Hector
categories: PHP
excerpt: 'php,网页爬虫,pcntl,curl'
keywords: 'php,网页爬虫,pcntl,curl'
---

代码托管地址：[https://github.com/HectorHu/zhihuSpider][1]

这次抓取了110万的用户数据，数据分析结果如下：

![知乎数据统计图.png][2]

<!--more-->

##开发前的准备
安装Linux系统（Ubuntu14.04），在VMWare虚拟机下安装一个Ubuntu；

安装PHP5.6或以上版本；

安装MySQL5.5或以上版本；

安装curl、pcntl扩展。

##使用PHP的curl扩展抓取页面数据
PHP的curl扩展是PHP支持的允许你与各种服务器使用各种类型的协议进行连接和通信的库。

本程序是抓取知乎的用户数据，要能访问用户个人页面，需要用户登录后的才能访问。当我们在浏览器的页面中点击一个用户头像链接进入用户个人中心页面的时候，之所以能够看到用户的信息，是因为在点击链接的时候，浏览器帮你将本地的cookie带上一齐提交到新的页面，所以你就能进入到用户的个人中心页面。因此实现访问个人页面之前需要先获得用户的cookie信息，然后在每次curl请求的时候带上cookie信息。在获取cookie信息方面，我是用了自己的cookie，在页面中可以看到自己的cookie信息：

![爬虫-查看cookie.jpg][3]

一个个地复制，以"__utma=?;__utmb=?;"这样的形式组成一个cookie字符串。接下来就可以使用该cookie字符串来发送请求。

初始的示例：

    $url = 'http://www.zhihu.com/people/mora-hu/about'; //此处mora-hu代表用户ID
    $ch = curl_init($url); //初始化会话
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_COOKIE, $this->config_arr['user_cookie']);  //设置请求COOKIE
    curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);  //将curl_exec()获取的信息以文件流的形式返回，而不是直接输出。
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);  
    $result = curl_exec($ch);
    return $result;  //抓取的结果

运行上面的代码可以获得mora-hu用户的个人中心页面。利用该结果再使用正则表达式对页面进行处理，就能获取到姓名，性别等所需要抓取的信息。

###图片防盗链
在对返回结果进行正则处理后输出个人信息的时候，发现在页面中输出用户头像时无法打开。经过查阅资料得知，是因为知乎对图片做了防盗链处理。解决方案就是请求图片的时候在请求头里伪造一个referer。

在使用正则表达式获取到图片的链接之后，再发一次请求，这时候带上图片请求的来源，说明该请求来自知乎网站的转发。具体例子如下：


    function getImg($url, $u_id)
    {
        if (file_exists('./images/' . $u_id . ".jpg"))
        {
            return "images/$u_id" . '.jpg';
        }
        if (empty($url))
        {
            return '';
        }
        $context_options = array(  
            'http' =>  
            array(
                'header' => "Referer:http://www.zhihu.com"//带上referer参数
        　　)
    　　);

        $context = stream_context_create($context_options);  
        $img = file_get_contents('http:' . $url, FALSE, $context);
        file_put_contents('./images/' . $u_id . ".jpg", $img);
        return "images/$u_id" . '.jpg';
    }

###爬取更多用户
抓取了自己的个人信息后，就需要再访问用户的关注者和关注了的用户列表获取更多的用户信息。然后一层一层地访问。可以看到，在个人中心页面里，有两个链接如下：

![爬虫-查看链接.jpg][4]

这里有两个链接，一个是关注了，另一个是关注者，以“关注了”的链接为例。用正则匹配去匹配到相应的链接，得到url之后用curl带上cookie再发一次请求。抓取到用户关注了的用于列表页之后，可以得到下面的页面：

![爬虫-查看用户信息.jpg][5]

分析页面的html结构，因为只要得到用户的信息，所以只需要框住的这一块的div内容，用户名都在这里面。可以看到，用户关注了的页面的url是：

![爬虫-查看页面链接地址.jpg][6]

不同的用户的这个url几乎是一样的，不同的地方就在于用户名那里。用正则匹配拿到用户名列表，一个一个地拼url，然后再逐个发请求（当然，一个一个是比较慢的，下面有解决方案，这个稍后会说到）。进入到新用户的页面之后，再重复上面的步骤，就这样不断循环，直到达到你所要的数据量。

###Linux统计文件数量
脚本跑了一段时间后，需要看看究竟获取了多少图片，当数据量比较大的时候，打开文件夹查看图片数量就有点慢。脚本是在Linux环境下运行的，因此可以使用Linux的命令来统计文件数量：

    ls -l | grep "^-" | wc -l

其中， `ls -l` 是长列表输出该目录下的文件信息（这里的文件可以是目录、链接、设备文件等）； `grep "^-"` 过滤长列表输出信息， `"^-"`  只保留一般文件，如果只保留目录是 `"^d"` ； `wc -l` 是统计输出信息的行数。下面是一个运行示例：

![爬虫-统计文件数量.png][7]

###插入MySQL时重复数据的处理
程序运行了一段时间后，发现有很多用户的数据是重复的，因此需要在插入重复用户数据的时候做处理。处理方案如下：

1）插入数据库之前检查数据是否已经存在数据库；

2）添加唯一索引，插入时使用 `INSERT INTO ... ON DUPLICATE KEY UPDATE... `

3）添加唯一索引，插入时使用 `INSERT INGNORE INTO...`

4）添加唯一索引，插入时使用 `REPLACE INTO...`

第一种方案是最简单但也是效率最差的方案，因此不采取。二和四方案的执行结果是一样的，不同的是，在遇到相同的数据时， `INSERT INTO ... ON DUPLICATE KEY UPDATE` 是直接更新的，而  `REPLACE INTO`  是先删除旧的数据然后插入新的，在这个过程中，还需要重新维护索引，所以速度慢。所以在二和四两者间选择了第二种方案。而第三种方案，  `INSERT INGNORE`  会忽略执行INSERT语句出现的错误，不会忽略语法问题，但是忽略主键存在的情况。这样一来，使用  `INSERT INGNORE`  就更好了。最终，考虑到要在数据库中记录重复数据的条数，因此在程序中采用了第二种方案。

##使用curl_multi实现多线程抓取页面
刚开始单进程而且单个curl去抓取数据，速度很慢，挂机爬了一个晚上只能抓到2W的数据，于是便想到能不能在进入新的用户页面发curl请求的时候一次性请求多个用户，后来发现了curl_multi这个好东西。curl_multi这类函数可以实现同时请求多个url，而不是一个个请求，这类似于linux系统中一个进程开多条线程执行的功能。下面是使用curl_multi实现多线程爬虫的示例：

        $mh = curl_multi_init(); //返回一个新cURL批处理句柄
        for ($i = 0; $i < $max_size; $i++)
        {
            $ch = curl_init();  //初始化单个cURL会话
            curl_setopt($ch, CURLOPT_HEADER, 0);
            curl_setopt($ch, CURLOPT_URL, 'http://www.zhihu.com/people/' . $user_list[$i] . '/about');
            curl_setopt($ch, CURLOPT_COOKIE, self::$user_cookie);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
            $requestMap[$i] = $ch;
            curl_multi_add_handle($mh, $ch);  //向curl批处理会话中添加单独的curl句柄
        }

        $user_arr = array();
        do {
                        //运行当前 cURL 句柄的子连接
            while (($cme = curl_multi_exec($mh, $active)) == CURLM_CALL_MULTI_PERFORM);

            if ($cme != CURLM_OK) {break;}
                        //获取当前解析的cURL的相关传输信息
            while ($done = curl_multi_info_read($mh))
            {
                $info = curl_getinfo($done['handle']);
                $tmp_result = curl_multi_getcontent($done['handle']);
                $error = curl_error($done['handle']);

                $user_arr[] = array_values(getUserInfo($tmp_result));

                //保证同时有$max_size个请求在处理
                if ($i < sizeof($user_list) && isset($user_list[$i]) && $i < count($user_list))
                {
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_HEADER, 0);
                    curl_setopt($ch, CURLOPT_URL, 'http://www.zhihu.com/people/' . $user_list[$i] . '/about');
                    curl_setopt($ch, CURLOPT_COOKIE, self::$user_cookie);
                    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36');
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
                    $requestMap[$i] = $ch;
                    curl_multi_add_handle($mh, $ch);

                    $i++;
                }

                curl_multi_remove_handle($mh, $done['handle']);
            }

            if ($active)
                curl_multi_select($mh, 10);
        } while ($active);

        curl_multi_close($mh);
        return $user_arr;

###HTTP 429 Too Many Requests
使用curl_multi函数可以同时发多个请求，但是在执行过程中使同时发200个请求的时候，发现很多请求无法返回了，即发现了丢包的情况。进一步分析，使用 curl_getinfo 函数打印每个请求句柄信息，该函数返回一个包含HTTP response信息的关联数组，其中有一个字段是http_code，表示请求返回的HTTP状态码。看到有很多个请求的http_code都是429，这个返回码的意思是发送太多请求了。我猜是知乎做了防爬虫的防护，于是我就拿其他的网站来做测试，发现一次性发200个请求时没问题的，证明了我的猜测，知乎在这方面做了防护，即一次性的请求数量是有限制的。于是我不断地减少请求数量，发现在5的时候就没有丢包情况了。说明在这个程序里一次性最多只能发5个请求，虽然不多，但这也是一次小提升了。

###使用Redis保存已经访问过的用户
抓取用户的过程中，发现有些用户是已经访问过的，而且他的关注者和关注了的用户都已经获取过了，虽然在数据库的层面做了重复数据的处理，但是程序还是会使用curl发请求，这样重复的发送请求就有很多重复的网络开销。还有一个就是待抓取的用户需要暂时保存在一个地方以便下一次执行，刚开始是放到数组里面，后来发现要在程序里添加多进程，在多进程编程里，子进程会共享程序代码、函数库，但是进程使用的变量与其他进程所使用的截然不同。不同进程之间的变量是分离的，不能被其他进程读取，所以是不能使用数组的。因此就想到了使用Redis缓存来保存已经处理好的用户以及待抓取的用户。这样每次执行完的时候都把用户push到一个already_request_queue队列中，把待抓取的用户（即每个用户的关注者和关注了的用户列表）push到request_queue里面，然后每次执行前都从request_queue里pop一个用户，然后判断是否在already_request_queue里面，如果在，则进行下一个，否则就继续执行。

在PHP中使用redis示例：

    <?php
        $redis = new Redis();
        $redis->connect('127.0.0.1', '6379');
        $redis->set('tmp', 'value');
        if ($redis->exists('tmp'))
        {
            echo $redis->get('tmp') . "\n";
        }


##使用PHP的pcntl扩展实现多进程
改用了curl_multi函数实现多线程抓取用户信息之后，程序运行了一个晚上，最终得到的数据有10W。还不能达到自己的理想目标，于是便继续优化，后来发现php里面有一个pcntl扩展可以实现多进程编程。下面是多编程编程的示例：

    //PHP多进程demo
    //fork10个进程
    for ($i = 0; $i < 10; $i++) {
        $pid = pcntl_fork();
        if ($pid == -1) {
            echo "Could not fork!\n";
            exit(1);
        }
        if (!$pid) {
            echo "child process $i running\n";
            //子进程执行完毕之后就退出，以免继续fork出新的子进程
            exit($i);
        }
    }

    //等待子进程执行完毕，避免出现僵尸进程
    while (pcntl_waitpid(0, $status) != -1) {
        $status = pcntl_wexitstatus($status);
        echo "Child $status completed\n";
    }

###在Linux下查看系统的cpu信息
实现了多进程编程之后，就想着多开几条进程不断地抓取用户的数据，后来开了8调进程跑了一个晚上后发现只能拿到20W的数据，没有多大的提升。于是查阅资料发现，根据系统优化的CPU性能调优，程序的最大进程数不能随便给的，要根据CPU的核数和来给，最大进程数最好是cpu核数的2倍。因此需要查看cpu的信息来看看cpu的核数。在Linux下查看cpu的信息的命令：

    cat /proc/cpuinfo


结果如下：

![爬虫-查看cpu信息.png][8]

其中，model name表示cpu类型信息，cpu cores表示cpu核数。这里的核数是1，因为是在虚拟机下运行，分配到的cpu核数比较少，因此只能开2条进程。最终的结果是，用了一个周末就抓取了110万的用户数据。


###多进程编程中Redis和MySQL连接问题
在多进程条件下，程序运行了一段时间后，发现数据不能插入到数据库，会报mysql too many connections的错误，redis也是如此。

下面这段代码会执行失败：

    <?php
         for ($i = 0; $i < 10; $i++) {
              $pid = pcntl_fork();
              if ($pid == -1) {
                   echo "Could not fork!\n";
                   exit(1);
              }
              if (!$pid) {
                   $redis = PRedis::getInstance();
                   // do something     
                   exit;
              }
         }

根本原因是在各个子进程创建时，就已经继承了父进程一份完全一样的拷贝。对象可以拷贝，但是已创建的连接不能被拷贝成多个，由此产生的结果，就是各个进程都使用同一个redis连接，各干各的事，最终产生莫名其妙的冲突。

解决方法：
>程序不能完全保证在fork进程之前，父进程不会创建redis连接实例。因此，要解决这个问题只能靠子进程本身了。试想一下，如果在子进程中获取的实例只与当前进程相关，那么这个问题就不存在了。于是解决方案就是稍微改造一下redis类实例化的静态方式，与当前进程ID绑定起来。

改造后的代码如下：

    <?php
         public static function getInstance() {
              static $instances = array();
              $key = getmypid();//获取当前进程ID
              if ($empty($instances[$key])) {
                   $inctances[$key] = new self();
              }

              return $instances[$key];
         }


###PHP统计脚本执行时间
因为想知道每个进程花费的时间是多少，因此写个函数统计脚本执行时间：

    function microtime_float()
    {
         list($u_sec, $sec) = explode(' ', microtime());
         return (floatval($u_sec) + floatval($sec));
    }

    $start_time = microtime_float();

    //do something
    usleep(100);

    $end_time = microtime_float();
    $total_time = $end_time - $start_time;

    $time_cost = sprintf("%.10f", $total_time);

    echo "program cost total " . $time_cost . "s\n";


若文中有不正确的地方，望各位指出以便改正。


  [1]: https://github.com/HectorHu/zhihuSpider
  [2]: http://7u2eqw.com1.z0.glb.clouddn.com/知乎数据统计图.png
  [3]: http://7u2eqw.com1.z0.glb.clouddn.com/爬虫-查看cookie.jpg
  [4]: http://7u2eqw.com1.z0.glb.clouddn.com/爬虫-查看链接.jpg
  [5]: http://7u2eqw.com1.z0.glb.clouddn.com/爬虫-查看用户信息.jpg
  [6]: http://7u2eqw.com1.z0.glb.clouddn.com/爬虫-查看页面链接地址.jpg
  [7]: http://7u2eqw.com1.z0.glb.clouddn.com/爬虫-统计文件数量.png
  [8]: http://7u2eqw.com1.z0.glb.clouddn.com/爬虫-查看cpu信息.png
