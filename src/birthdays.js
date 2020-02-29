const $ = require('jquery');
import 'slick-carousel';

$(document).ready(function(){
    $('#birthday-slider').slick({
        infinite: true,
        arrows: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000
    });
});