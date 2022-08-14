//MenuToggle
let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");
let news = document.querySelector(".btn-n");
let reg = document.querySelector(".regform");
let icon = document.querySelector(".btn-n");
let estado = document.querySelector(".status");

news.onclick = () => {
  icon.classList.toggle("active");
  reg.classList.toggle("active");
};

toggle.onclick = function () {
  navigation.classList.toggle("active");
  main.classList.toggle("active");
};

let someElement = document.querySelectorAll("#myElement");

someElement.forEach((hola) => {
  hola.classList.add(hola.textContent.toLowerCase().trim());
});

//add hovered class in selected list item
let list = document.querySelectorAll(".navigation li");

function activeLink() {
  list.forEach((item) => item.classList.remove("hovered"));
  this.classList.add("hovered");
}
list.forEach((item) => item.addEventListener("mouseover", activeLink));

$(document).ready(function () {
  $("#myInput").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    $("#myTable tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });
});

filterInput = (req) => {
  $("#myInput").val(req)
}

var el = document.getElementById('close');
closeIt = () => {
  el.remove()
}
