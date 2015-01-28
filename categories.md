---
layout: page
head: "分类"
permalink: /categories/
---

<ul class="categories-box">
    {% if site.posts != empty %}
        {% for cat in site.categories %}
            <a href="#{{ cat[0] }}" title="{{ cat[0] }}" rel="{{ cat[1].size }}">{{ cat[0] | join: "/"}}<span class="article-size"> ({{ cat[1].size }})</span></a>
        {% endfor %}
</ul>

<ul class="categories-box">
    {% for cat in site.categories %}
        <li id="{{ cat[0] }}"><h3>{{ cat[0]}}</h3></li>
        {% for post in cat[1] %}
            <time datetime="{{ post.date | date:"%Y-%m-%d" }}">{{ post.date | date:"%Y-%m-%d" }}</time> &raquo;
            <a href="{{ site.url }}{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a><br />
        {% endfor %}
    {% endfor %}
    {% else %}
    <span>暂时没有文章</span>
    {% endif %}
</ul>