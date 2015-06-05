/* 
* @Author: Hector
* @Date:   2015-05-22 17:15:52
* @Last Modified by:   huhuaquan
* @Last Modified time: 2015-06-02 16:18:39
*/
(function() {

	var card = (function() {
		var first = 9,
			second = 5.5,
			animationProperty = 'webkitAnimationEnd',
			animateState = '-webkit-animation-play-state',
			positions = [0, 230, 430, 630, 830, 1030, 1230, 1430];

		function move(begin, end, interval, property) {
	    	var elem = $('#timeline'),
	    		left = begin;

			function frame() {
				left++;
			    elem.width(left);
			    if (left == end) {
			    	drawTime(property);
			    	clearInterval(id)
			    }
			}

			var id = setInterval(frame, interval);
		}

		function drawTime(elemName) {
			var elem = $('#' + elemName + '_time'),
				top = 0,
				height = 20,
				interval = 10,
				display = 1;
			function frame() {
				++top;
				elem.height(top);
				if (top == height) {
					$('#' + elemName + '_desc').fadeTo('slow', display);
					clearInterval(id);
				}
			}

			var id = setInterval(frame, interval);
		}

		return {
			init : function() {
				var _this = this;
				$('#broegg').addClass('animated bounceInDown').one(animationProperty, function(e) {
					$(this).removeClass('bounceInDown');
					$(this).fadeTo('slow', 1);
					$(this).css('background-image', "url(./images/egg_broke.jpg)");
					drawTime('broegg');
					setTimeout(function () {
						_this.growToKid();
						move(positions[0], positions[1], second, 'kid');
					}, 500);
				});
			},
			growToKid : function() {
				var _this = this;
				$("#kid").addClass('animated fadeInLeftBig').one(animationProperty, function(e) {
					$(this).fadeTo('slow', 1);
					setTimeout(function () {
						_this.growToPupils();
						move(positions[1], positions[2], second, 'pupils');
					}, 500);
				});
			},
			growToPupils : function() {
				var _this = this;
				$("#pupils").addClass('animated flash').one(animationProperty, function(e) {
					$(this).fadeTo('slow', 1);
					setTimeout(function () {
						_this.growToJunior();
						move(positions[2], positions[3], second, 'junior');
					}, 500);
				});
			},
			growToJunior : function() {
				var _this = this;
				$("#junior").addClass('animated rollIn').one(animationProperty, function(e) {
					$(this).fadeTo('slow', 1);
					setTimeout(function () {
						_this.growToWithme();
						move(positions[3], positions[4], second, 'withme');
					}, 500);
				});
			},
			growToWithme : function() {
				var _this = this;
				$("#withme").addClass('animated lightSpeedIn').one(animationProperty, function(e) {
					$(this).fadeTo('slow', 1);
					setTimeout(function () {
						_this.growToSenior();
						move(positions[4], positions[5], second, 'senior');
					}, 500);
				});
			},
			growToSenior : function() {
				var _this = this;
				$("#senior").addClass('animated fadeInUpBig').one(animationProperty, function(e) {
					$(this).fadeTo('slow', 1);
					setTimeout(function () {
						_this.growToCollege();
						move(positions[5], positions[6], second, 'college');
					}, 500);
				});
			},
			growToCollege : function() {
				var _this = this;
				$("#college").addClass('animated fadeInDownBig').one(animationProperty, function(e) {
					$(this).fadeTo('slow', 1);
					setTimeout(function () {
						_this.growToRecent();
						move(positions[6], positions[7], second, 'recent');
					}, 500);
				});
			},
			growToRecent : function() {
				var _this = this;
				$("#recent").addClass('animated rotateIn').one(animationProperty, function(e) {
					$(this).fadeTo('slow', 1);
					_this.blessing();
				});
			},
			blessing : function() {
				var start_link = $('#start-link'),
					start_header = $('#start-header'),
					start_header_li = start_header.find("li"),
					i = 0,
					_this = this;
				var s = setInterval( function() {
					start_header_li[i].style.display = 'inline-block';
					if (++i == start_header_li.length) {
						clearInterval(s);
						$("#main-content").fadeOut(4000);
						$("#second-content").fadeIn(1000);
						_this.sweet();
					}
				}, 700);
			},
			sweet : function() {
				var _this = this;
				setTimeout(function() {
					$("#sweet").css('display', 'block');
					_this.showSweet();
				}, 4000);
			},
			showSweet : function() {
				var i = 0,
				words_text = '哈哈哈哈哈哈';

				var ss = setInterval(function() {
					console.log(words_text[i]);
					var new_span = $('<span />').html(words_text[i]).css('display', 'inline-block').width(20);
					$(new_span).addClass('animated slideInRight');
					$("#sweet").find("p").append(new_span);
					if (++i == words_text.length) {
						clearInterval(ss);
					}
				}, 700);
			}
		}
	})();
	$("#start-link").click(function() {
		$(this).fadeOut('slow', 0);
		card.init();
	});
})();