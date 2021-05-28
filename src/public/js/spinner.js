setTimeout(function() {
    const spinner = document.querySelector('.spinner');
    const wapper = document.querySelector('#wapper');
    spinner.style.display = 'none';
    wapper.style.display = 'block';
}, 100);
// ShowToastMessage("hello world", "second")

function ShowToastMessage(message, color) {
    var x = document.getElementById("snackbar");
    x.textContent = message;
    x.className = `${color} show`;
    setTimeout(function() { x.className = x.className.replace("show", ""); }, 3000);
}