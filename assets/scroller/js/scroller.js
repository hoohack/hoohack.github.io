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
                    if(i == (selected.length - 1)) {
                        nextNav = selected[0];
                        nextImg = selectedImg[0];
                    } else {
                        nextNav = selected[i+1];
                        nextImg = selectedImg[i+1];
                    }
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
                    if(i == 0) {
                        nextNav = selected[selected.length-1];
                        nextImg = selectedImg[selected.length-1];
                    } else {
                        nextNav = selected[i-1];
                        nextImg = selectedImg[i-1];
                    }
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
                        console.log(selectedImg[0]);
                        selected[0].className = "nav";
                        selectedImg[0].className = "image";
                        this.className += ' selected';
                        imgs[this.i].className += ' current';
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