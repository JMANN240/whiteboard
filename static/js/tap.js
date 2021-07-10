var fingeredness = 0;
var multiplicity = 0;
var variation = '';

var update_desc = () => {
    fingeredness_word = ['no', 'one', 'two', 'three'][fingeredness]
    multiplicity_word = ['no', 'single', 'double', 'triple'][multiplicity]
    var descriptor = `${multiplicity_word} ${fingeredness_word}-finger ${variation}`
    console.log(descriptor);
    desc.innerHTML = descriptor
    $('#desc').addClass('good-flash');
    setTimeout(() => {
        $('#desc').removeClass('good-flash');
    }, 500);
}

var averagePoint = (touches) => {
    average_point = [0, 0];
    for (const touch of touches) {
        average_point[0] += touch.clientX;
        average_point[1] += touch.clientY;
    }
    average_point[0] /= touches.length;
    average_point[1] /= touches.length;
    return average_point;
}

var dist = (p1, p2) => {
    dx = p1[0] - p2[0];
    dy = p1[1] - p2[1];
    return Math.sqrt(dx*dx + dy*dy);
}

var tap_length = 250;
var hold_length = 250;

var tap_timeout;
var hold_timeout;

var current_fingers = 0;
var reset_multiplicity_fingeredness = () => {
    multiplicity = 0;
    fingeredness = 0;
}

var touch_start_point;

document.addEventListener("touchstart", function (e) {
    //console.log('[START]');

    touch_start_point = averagePoint(e.touches);

    clearTimeout(tap_timeout);
    tap_timeout = setTimeout(() => {
        //console.log('[TAP TIMEOUT]');
        if (current_fingers == 0) {
            variation = 'tap';
            var tapEvent = new CustomEvent("tap", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: touch_start_point[0],
                    clientY: touch_start_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(tapEvent);
            reset_multiplicity_fingeredness();
        }
    }, tap_length);

    clearTimeout(hold_timeout);
    hold_timeout = setTimeout(() => {
        //console.log('[HOLD TIMEOUT]');
        if (current_fingers > 0) {
            variation = 'hold';
            var holdEvent = new CustomEvent("hold", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: touch_start_point[0],
                    clientY: touch_start_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(holdEvent);
        }
    }, hold_length);

    variation = '';
    if (current_fingers == 0) {
        multiplicity++;
    }
    current_fingers = e.touches.length;
    fingeredness = Math.max(e.touches.length, fingeredness);
});

var current_point;
var dragging = false;

document.addEventListener("touchmove", function (e) {
    //console.log('[MOVE]');

    current_point = averagePoint(e.touches);

    if (dist(touch_start_point, current_point) > 10) {
        if (!dragging) {
            var dragStartEvent = new CustomEvent("dragstart", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: touch_start_point[0],
                    clientY: touch_start_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(dragStartEvent);
        }
        dragging = true;
        clearTimeout(tap_timeout);
        clearTimeout(hold_timeout);
        variation = 'drag';
        if (fingeredness == e.touches.length) {
            var dragEvent = new CustomEvent("drag", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: current_point[0],
                    clientY: current_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(dragEvent);
        }
    }

    e.preventDefault();
}, {passive: false});

document.addEventListener("touchend", function (e) {
    //console.log('[END]');

    current_fingers = e.touches.length;

    if (current_fingers == 0) {
        if (variation == 'drag') {
            var dragEndEvent = new CustomEvent("dragend", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: current_point[0],
                    clientY: current_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(dragEndEvent);
            dragging = false;
        }
        if (variation == 'hold' || variation == 'drag') {
            reset_multiplicity_fingeredness();
        }
    }
});

document.addEventListener("tap", (e) => {
    console.log("[TAP]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
    console.log(e);
})

document.addEventListener("hold", (e) => {
    console.log("[HOLD]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
})

document.addEventListener("dragstart", (e) => {
    console.log("[DRAG START]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
})

document.addEventListener("drag", (e) => {
    console.log("[DRAG]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
})

document.addEventListener("dragend", (e) => {
    console.log("[DRAG END]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
})