/* SmartFlow Systems — Mobile Nav Toggle */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      links.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!links.contains(e.target) && e.target !== toggle) {
        links.classList.remove('open');
      }
    });
  });
})();
