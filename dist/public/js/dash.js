//MenuToggle
var toggle = document.querySelector(".toggle");
var navigation = document.querySelector(".navigation");
var main = document.querySelector(".main");
var news = document.querySelector(".btn-n");
var reg = document.querySelector(".regform");
var icon = document.querySelector(".btn-n");
var estado = document.querySelector(".status");
news.onclick = function () {
    icon.classList.toggle("active");
    reg.classList.toggle("active");
};
toggle.onclick = function () {
    navigation.classList.toggle("active");
    main.classList.toggle("active");
};
var someElement = document.querySelectorAll("#myElement");
someElement.forEach(function (hola) {
    hola.classList.add(hola.textContent.toLowerCase().trim());
});
//add hovered class in selected list item
var list = document.querySelectorAll(".navigation li");
function activeLink() {
    list.forEach(function (item) { return item.classList.remove("hovered"); });
    this.classList.add("hovered");
}
list.forEach(function (item) { return item.addEventListener("mouseover", activeLink); });
$(document).ready(function () {
    $("#myInput").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#myTable tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
});
filterInput = function (req) {
    $("#myInput").val(req).keyup();
};
var el = document.getElementById('close');
closeIt = function () {
    el.remove();
};
var sinResCount = document.getElementById("sinResCount");
