const whiteboard_id = new URLSearchParams(window.location.search).get('id')

var whiteboard = $('#whiteboard')[0];
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
ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--sec');
ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.lineJoin = "round";

var drawing = false;
var panning = false;

var drawStrokes = (context, strokes, offset) => {
    var prevStrokeStyle = context.strokeStyle;
    var prevLineWidth = context.lineWidth;
    whiteboard.width = window.innerWidth;
    whiteboard.height = window.innerHeight;
    for (const stroke of strokes) {
        drawPoints(context, stroke, offset);
    }
    context.strokeStyle = prevStrokeStyle;
    context.lineWidth = prevLineWidth;
}

var drawPoints = (context, stroke, offset) => {
    var [points, color, width] = stroke;
    context.strokeStyle = (color == '#ffffff' || color == '#000000') ? getComputedStyle(document.documentElement).getPropertyValue('--sec') : color;
    context.lineWidth = width;
    context.lineCap = "round";
    ctx.lineJoin = "round";
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

var socket;

$.ajax({
    type: 'GET',
    url: '/api/settings',
    success: (res) => {
        socket = io.connect(res.socketio_host + ':' + res.port, {query: `id=${whiteboard_id}`});

        socket.on('strokes', (s) => {
            strokes = s
            drawStrokes(ctx, strokes, stroke_offset);
        });
    }
});

var start_point;
var prev_point;

console.log(getComputedStyle(document.documentElement).getPropertyValue('--sec'));

if (getComputedStyle(document.documentElement).getPropertyValue('--sec') == '#ffffff') {
    $('#sec-color').html('White');
} else if (getComputedStyle(document.documentElement).getPropertyValue('--sec') == '#000000') {
    $('#sec-color').html('Black');
}


$('#colors-container > button').on("click", (e) => {
    if ($(e.target).attr('id') == 'eraser-color') {
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--prim');
        ctx.lineWidth = 13;
    } else {
        ctx.lineWidth = 3;
        ctx.strokeStyle = $(e.target).css('color');
    }
});

var change_nickname_timeout;
$('#nickname-input').on("input", (e) => {
    $('#nickname-input').val($('#nickname-input').val().replace(/ /g, '_'));
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

$.ajax({
    type: "GET",
    url: "/api/whiteboard",
    success: (res) => {
        for (var [test_whiteboard_id, _] of res) {
            if (test_whiteboard_id == whiteboard_id) {
                $('#saved').prop('checked', true);
                break;
            }
        }
    }
})

$('#saved').on('input', (e) => {
    $.ajax({
        type: "POST",
        url: "/api/whiteboard",
        data: {
            whiteboard_id: whiteboard_id,
            saved: $('#saved').prop('checked')
        },
        success: (res) => {
            console.log(res);
        }
    })
});

$('#center-whiteboard').on("click", (e) => {
    stroke_offset = [0,0];
    drawStrokes(ctx, strokes, stroke_offset);
});

$('#clear-whiteboard').on("click", (e) => {
    socket.emit("clear");
});

$('#home').on("click", (e) => {
    window.location.href = `/`;
});

$.ajax({
    type: 'GET',
    url: '/api/nickname',
    data: {whiteboard_id: whiteboard_id},
    success: (res) => {
        $('#nickname-input').val(res);
    }
})

whiteboard.addEventListener("mousedown", (e) => {
    if (e.button == 0) {
        start_point = [e.clientX-stroke_offset[0], e.clientY-stroke_offset[1]];
    }
    prev_point = [e.clientX, e.clientY]
    
});

whiteboard.addEventListener("mousemove", (e) => {
    if (e.buttons == 1) {
        if (current_stroke.length == 0) {
            ctx.beginPath();
            ctx.moveTo(prev_point[0], prev_point[1]);
            current_stroke.push(start_point);
        }
        if (e.clientX != current_stroke[current_stroke.length-1][0] && e.clientY != current_stroke[current_stroke.length-1][1]) {
            current_stroke.push([e.clientX-stroke_offset[0], e.clientY-stroke_offset[1]]);
        }
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
    }
    if (e.buttons == 4) {
        movementX = e.clientX - prev_point[0];
        movementY = e.clientY - prev_point[1];
        stroke_offset[0] += movementX;
        stroke_offset[1] += movementY;
        drawStrokes(ctx, strokes, stroke_offset);
    }
    prev_point = [e.clientX, e.clientY]
});

whiteboard.addEventListener("mouseup", (e) => {
    if (e.button == 0) {
        if (current_stroke.length > 0) {
            current_stroke.push([e.clientX-stroke_offset[0], e.clientY-stroke_offset[1]]);
            socket.emit('new-stroke', current_stroke, ctx.strokeStyle, ctx.lineWidth);
        }
        current_stroke = [];
    }
});

document.addEventListener("dragstart", function (e) {
    var mouseEvent = new MouseEvent("mousedown", {
        clientX: e.detail.clientX,
        clientY: e.detail.clientY,
        button: e.detail.fingeredness - 1
    });
    whiteboard.dispatchEvent(mouseEvent);
});

document.addEventListener("drag", function (e) {
    var mouseEvent = new MouseEvent("mousemove", {
        clientX: e.detail.clientX,
        clientY: e.detail.clientY,
        buttons: (e.detail.fingeredness == 1 ? 1 : 0) + (e.detail.fingeredness == 2 ? 4 : 0)
    });
    whiteboard.dispatchEvent(mouseEvent);
});

document.addEventListener("dragend", function (e) {
    var mouseEvent = new MouseEvent("mouseup", {
        clientX: e.detail.clientX,
        clientY: e.detail.clientY,
        button: e.detail.fingeredness - 1
    });
    whiteboard.dispatchEvent(mouseEvent);
});