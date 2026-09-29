(function () {
  var still = /[?&]still\b/.test(location.search);
  var n = document.getElementById('n');
  var count = 0;
  document.getElementById('contador').addEventListener('click', function () {
    count += 1;
    n.textContent = String(count);
  });
  if (still) document.documentElement.setAttribute('data-still', '');
})();
