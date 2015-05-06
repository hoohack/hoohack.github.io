(function() {
    var scroller = (function() {
        var imgboard = document.getElementById('img-board'),
            operation = document.getElementById('operation'),
            prev = document.getElementById('prev'),
            next = document.getElementById('next'),
            img_nav = document.getElementById('img-nav').getElementsByTagName('li'),
            imgs = document.getElementsByClassName('image'),
            autoChange = 0,
            interval = 3000;

        //设置透明度
        function setOpacity(item,level){
            if(item.filters){
                item.style.filter = "alpha(opacity="+level+")";
            }else{
                item.style.opacity = level / 100;
            }
        }

        //淡入处理函数
        function fadeIn(item) {
            setOpacity(item, 0);
            for(var i = 0; i<=20; i++) {
                (function(){
                    var level = i * 5;
                    setTimeout(function(){
                        setOpacity(item, level)
                    },i*25);
                })(i);
            }
        }

        //淡出处理函数
        function fadeOut(item) {
            setOpacity(item, 0);
            for(var i = 0; i<=20; i++) {
                (function(){
                    var level = 100 - i * 5;
                    setTimeout(function(){
                        setOpacity(item, level)
                    },i*25);
                })(i);
            }
        }

        //下一张
        function getNextImg() {
            var selected = document.getElementsByClassName('nav');
            var selectedImg = document.getElementsByClassName('image');
            for (var i = 0; i < selected.length; i++) {
                var currImg = '',
                    nextImg = '',
                    currNav = '',
                    nextNav = '';
                if(selected[i].className.indexOf('selected') > 0) {
                    currNav = selected[i];
                    currImg = selectedImg[i];
                    fadeOut(currImg);
                    if(i == (selected.length - 1)) {
                        nextNav = selected[0];
                        nextImg = selectedImg[0];
                    } else {
                        nextNav = selected[i+1];
                        nextImg = selectedImg[i+1];
                    }
                    fadeIn(nextImg);
                    currNav.className = "nav";
                    nextNav.className += " selected";
                    currImg.className = "image";
                    nextImg.className += " current";
                    break;
                }
            }
        }

        //上一张
        function getPrevImg() {
            var selected = document.getElementsByClassName('nav');
            var selectedImg = document.getElementsByClassName('image');
            for (var i = 0; i < selected.length; i++) {
                var currImg = '',
                    nextImg = '',
                    currNav = '',
                    nextNav = '';
                if(selected[i].className.indexOf('selected') > 0) {
                    currNav = selected[i];
                    currImg = selectedImg[i];
                    fadeOut(currImg);
                    if(i == 0) {
                        nextNav = selected[selected.length-1];
                        nextImg = selectedImg[selected.length-1];
                    } else {
                        nextNav = selected[i-1];
                        nextImg = selectedImg[i-1];
                    }
                    fadeIn(nextImg);
                    currNav.className = "nav";
                    nextNav.className += " selected";
                    currImg.className = "image";
                    nextImg.className += " current";
                    break;
                }
            }
        }

        //为下面的导航栏添加事件
        function BindImgNav(img_nav, imgs) {
            for(var i = 0; i < img_nav.length; ++i) {
                img_nav[i].i = i;
                img_nav[i].onclick = function() {
                    var nav_class = this.className;
                    if(nav_class != 'selected') {
                        var selected = document.getElementsByClassName('selected');
                        var selectedImg = document.getElementsByClassName('current');
                        fadeOut(selectedImg[0]);
                        selected[0].className = "nav";
                        selectedImg[0].className = "image";
                        this.className += ' selected';
                        imgs[this.i].className += ' current';
                        fadeIn(imgs[this.i]);
                    }
                };
            }
        }

        return {

            eventBind: function () {
                var _this = this;

                prev.onclick = getPrevImg;

                next.onclick = getNextImg;

                BindImgNav(img_nav, imgs);

                imgboard.onmouseover = function() {
                    operation.style.display = "block";
                    clearTimeout(autoChange);
                }
                imgboard.onmouseout = function() {
                    operation.style.display = "none";
                    _this.change();
                }
            },

            change: function() {
                autoChange = setTimeout(function(){
                    getNextImg();
                    autoChange = setTimeout(arguments.callee, interval);
                }, interval);
            },

            init: function() {
                this.eventBind();
                this.change();
            }
        }
    })();
    scroller.init();
})();