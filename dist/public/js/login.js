var sign_in_btn = document.querySelector("#sign-in-btn");
var sign_up_btn = document.querySelector("#sign-up-btn");
var container = document.querySelector(".containers");
sign_up_btn.addEventListener("click", function () {
    container.classList.add("sign-up-mode");
});
sign_in_btn.addEventListener("click", function () {
    container.classList.remove("sign-up-mode");
});
var el = document.getElementById('close');
closeIt = function () {
    el.remove();
};
