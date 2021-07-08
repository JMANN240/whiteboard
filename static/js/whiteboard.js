const whiteboard_id = new URLSearchParams(window.location.search).get('id')

if (!touch) {
    $('#draw-pan').hide();
}

var whiteboard = $('#whiteboard')[0]
var current_stroke = [];
var strokes = [];
var stroke_offset = [0, 0];
whiteboard.width = window.innerWidth;
whiteboard.height = window.innerHeight;

var resize_timeout;
$(window).on('resize', (e) => {
    clearTimeout(resize_timeout)
    resize_timeout = setTimeout(() => {
        drawStrokes(ctx, strokes, stroke_offset)
    }, 200)
});

var ctx = whiteboard.getContext("2d");
ctx.strokeStyle = "#000000";
ctx.lineWidth = 1;

var drawing = false;
var panning = false;

var drawStrokes = (context, strokes, offset) => {
    var prevStrokeStyle = context.strokeStyle;
    whiteboard.width = window.innerWidth;
    whiteboard.height = window.innerHeight;
    for (const stroke of strokes) {
        drawPoints(context, stroke, offset);
    }
    context.strokeStyle = prevStrokeStyle;
}

var drawPoints = (context, stroke, offset) => {
    var [points, color] = stroke;
    context.strokeStyle = color;
    context.beginPath();
    if (points.length > 0) {
        const [x, y] = points[0];
        context.moveTo(x+offset[0], y+offset[1]);
    }
    for (const point of points) {
        const [x, y] = point;
        context.lineTo(x+offset[0], y+offset[1]);
    } 
    context.stroke();
}

var socket = io.connect('192.168.0.7:8000', {query: `id=${whiteboard_id}`});

whiteboard.addEventListener("mousedown", (e) => {
    if (e.button == 0) {
        drawing = true;
        current_stroke.push([e.clientX-stroke_offset[0], e.clientY-stroke_offset[1]]);
        ctx.beginPath();
        ctx.moveTo(e.clientX, e.clientY);
    }
    if (e.button == 1) {
        panning = true;
    }
    
});

whiteboard.addEventListener("mousemove", (e) => {
    if (drawing) {
        current_stroke.push([e.clientX-stroke_offset[0], e.clientY-stroke_offset[1]]);
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
    }
    if (panning) {
        stroke_offset[0] += (e.movementX ?? (e.clientX - prevTouch[0]))
        stroke_offset[1] += (e.movementY ?? (e.clientY - prevTouch[1]))
        drawStrokes(ctx, strokes, stroke_offset);
    }
});

whiteboard.addEventListener("mouseup", (e) => {
    if (e.button == 0) {
        socket.emit('new-stroke', current_stroke, ctx.strokeStyle);
        current_stroke = [];
    }
    drawing = false;
    panning = false;
});

$('#colors-container > button').on("click", (e) => {
    ctx.strokeStyle = $(e.target).css('color');
});

$('#draw-pan').on("click", (e) => {
    touch_button = (touch_button - 1) * -1;
});

socket.on('strokes', (s) => {
    strokes = s
    drawStrokes(ctx, strokes, stroke_offset);
});

var change_nickname_timeout;
$('#nickname-input').on("input", (e) => {
    clearTimeout(change_nickname_timeout);
    change_nickname_timeout = setTimeout(() => {
        $.ajax({
            type: 'POST',
            url: '/api/nickname',
            data: {
                whiteboard_id: whiteboard_id,
                new_nickname: e.target.value
            },
            mimeType: 'json',
            success: (res) => {
                if (res == "200") {
                    $('#nickname-input').addClass('good-flash');
                    setTimeout(() => {
                        $('#nickname-input').removeClass('good-flash');
                    }, 1000);
                } else if (res == "406") {
                    $('#nickname-input').addClass('bad-flash');
                    setTimeout(() => {
                        $('#nickname-input').removeClass('bad-flash');
                    }, 1000);
                }
            }
        })
    }, 1000);
});

$('#center-whiteboard').on("click", (e) => {
    stroke_offset = [0,0];
    drawStrokes(ctx, strokes, stroke_offset);
});

$('#clear-whiteboard').on("click", (e) => {
    socket.emit("clear");
});

touch_button = 0;

whiteboard.addEventListener("touchstart", function (e) {
    var touch = e.touches[0];
    prevTouch = [touch.clientX, touch.clientY]
    var mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: touch_button
    });
    whiteboard.dispatchEvent(mouseEvent);
    e.preventDefault();
}, false);

whiteboard.addEventListener("touchmove", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    whiteboard.dispatchEvent(mouseEvent);
    prevTouch = [touch.clientX, touch.clientY]
    e.preventDefault();
}, false);

whiteboard.addEventListener("touchend", function (e) {
    var mouseEvent = new MouseEvent("mouseup", {
        button: e.touches.length
    });
    whiteboard.dispatchEvent(mouseEvent);
    e.preventDefault();
}, false);

$.ajax({
    type: 'GET',
    url: '/api/nickname',
    data: {whiteboard_id: whiteboard_id},
    success: (res) => {
        $('#nickname-input').val(res);
    }
})