'use strict';

$(document).ready(function () {
    $('#search_form').submit(function (event) {
      event.preventDefault();

      var text = $('#text')[0].value;
      $.post('/query', {'query': text}, function (res) {
        var resultsList = $('#results_list');
        resultsList.html('');
        res.forEach(item => {
            resultsList.append("<li><a href='" + item.url +"'>" + item.title +
             "</a><button class='related_button' id='"+ item.id +"'>Related images:</button></li>");
        });
      });
    });

    $(document).on('click', '.related_button', function () {
        $.post('/images', {'id': this.id}, function (res) {
            $('#related_images').html('');
            res.forEach((url, index) => {
                var html = '<div class="mySlides fade"><div class="numbertext">' +
                (index + 1) + ' / ' + res.length +
                '</div><img src="' + url + '" style="width:100%"><div class="text">Related images</div></div>';
                $('#related_images').append(html);
            });

            $('#related_images').append('<a class="prev" onclick="plusSlides(-1)">&#10094;</a>' +
                '<a class="next" onclick="plusSlides(1)">&#10095;</a>');

            showSlides(1);
        });
    });
});

//image slideshow
var slideIndex = 1;

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    var i;
    var slides = document.getElementsByClassName("mySlides");
    if (n > slides.length) {slideIndex = 1} 
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none"; 
    }
    slides[slideIndex-1].style.display = "block"; 
}