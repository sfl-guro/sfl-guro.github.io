(function () {
  try {
    var fs = localStorage.getItem("guro_font_scale");
    if (fs === "10" || fs === "20" || fs === "30") document.documentElement.setAttribute("data-fs", fs);
  } catch (e) {}
  try {
    var dark = localStorage.getItem("hl_app_dark_mode") === "1";
    document.body.classList.add(dark ? "app-dark" : "sfl-theme");
    if (localStorage.getItem("hl_farm_panel_id")) {
      var screen = document.getElementById("appLoadingScreen");
      if (screen) screen.remove();
    }
  } catch (e) {}
})();

document.addEventListener("DOMContentLoaded", function () {
  var src = document.querySelector(".app-version-badge");
  var dst = document.getElementById("guroBootVersion");
  if (src && dst) dst.textContent = src.textContent;
});
