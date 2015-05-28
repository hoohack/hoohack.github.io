(function() {
	var start_link = $('#start-link'),
		start_header = $('#start-header'),
		start_header_li = start_header.find("li"),
		i = 0;
	var s = setInterval( function() {
		start_header_li[i].style.display = 'inline-block';
		if (++i == start_header_li.length) {
			clearInterval(s);
			start_link.attr("href", './page.html');
		}
	}, 700);
})();