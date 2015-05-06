(function() {
    var imgboard = document.getElementById('img-board');
    var operation = document.getElementById('operation');
    var prev = document.getElementById('prev');
    var next = document.getElementById('next');
    var img_nav = document.getElementById('img-nav').getElementsByTagName('li');
    var imgs = document.getElementsByClassName('image');

    BindImgNav(img_nav, imgs);

    prev.onclick = getPrevImg;

    next.onclick = getNextImg;

    function Begin() {
        var interval = 3000;
        setTimeout(function(){
            getNextImg();
            setTimeout(arguments.callee, interval);
        }, interval);
    }

    imgboard.onmouseover = function() {
        operation.style.display = "block";
    }
    imgboard.onmouseout = function() {
        operation.style.display = "none";
    }

    Begin();
})();

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

//上一张
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
    };
}

//下一张
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
    };
}