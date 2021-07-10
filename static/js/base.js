const touch = matchMedia('(hover: none)').matches;

const hasModal = $('#modal-options > *').length != 0;

const modal = document.querySelector('.modal');

$('body').css('height', `${window.innerHeight}px`);

$(document).on("keypress", (e) => {
    if (e.code == "Space" && hasModal) {
        e.preventDefault();
        $('.modal').addClass('visible');
    }
});

$(document).on('click', (e) => {
    if (e.target == modal) {
        $('.modal').removeClass('visible');
    }
});

document.addEventListener('tap', (e) => {
    if (e.detail.fingeredness == 2 && e.detail.multiplicity == 1) {
        $('.modal').addClass('visible');
    } else if (e.detail.fingeredness == 1 && e.detail.target == modal) {
        $('.modal').removeClass('visible');
    }
});