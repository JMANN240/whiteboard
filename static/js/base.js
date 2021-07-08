const touch = matchMedia('(hover: none)').matches;

const hasModal = $('#modal-options > *').length != 0;

$('body').css('height', `${window.innerHeight}px`);

$(document).on("keypress", (e) => {
    if (e.code == "Space" && hasModal) {
        e.preventDefault();
        $('.modal').addClass('visible');
    }
});

$(document).on('click', (e) => {
    if (e.target == $('.modal')[0]) {
        $('.modal').removeClass('visible');
    }
});

var tap_hold_timeout;
var max_touches = 0;
var current_touches = 0;

document.addEventListener('touchstart', (e) => {
    max_touches = Math.max(max_touches, e.targetTouches.length);
    current_touches = e.targetTouches.length
    clearTimeout(tap_hold_timeout)
    tap_hold_timeout = setTimeout(() => {
        if (max_touches == 2 && current_touches == 0 && hasModal) {
            $('.modal').addClass('visible');
        }
        if (max_touches == 1 && current_touches == 0 && e.changedTouches[0].target == $('.modal')[0]) {
            $('.modal').removeClass('visible');
        }
        max_touches = 0;
    }, 100)
}, {passive: false});

document.addEventListener('touchmove', (e) => {
    clearTimeout(tap_hold_timeout);

    e.preventDefault();
}, {passive: false});

document.addEventListener('touchend', (e) => {
    current_touches = e.targetTouches.length
}, {passive: false});