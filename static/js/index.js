const logged_in = $('#login').length == 0;

var switch_theme_button = document.querySelector('#switch-theme');

if (theme == 'light') {
    switch_theme_button.innerHTML = 'Blackboard';
    switch_theme_button.classList.add('blackboard-button');
} else if (theme == 'dark') {
    switch_theme_button.innerHTML = 'Whiteboard';
    switch_theme_button.classList.add('whiteboard-button');
}

$('#options-hint').html(touch ? "Two-finger Tap for options." : "Space for options.")

$('#switch-theme').on('click', (e) => {
    theme = theme == 'light' ? 'dark' : 'light'
    window.localStorage.setItem('theme', theme);
    update_theme();
    show_previews();
});

$('#create-whiteboard').on('click', (e) => {
    $.ajax({
        method: 'POST',
        url: '/whiteboard',
        success: (res) => {
            window.location.href = `/whiteboard?id=${res}`;
        }
    });
});

$('#login').on('click', (e) => {
    window.location.href = `/login`;
});

$('#signup').on('click', (e) => {
    window.location.href = `/signup`;
});

$('#logout').on('click', (e) => {
    window.location.href = `/logout`;
});

if (logged_in) {
    var resize_timeout;
    $(window).on('resize', (e) => {
        clearTimeout(resize_timeout)
        resize_timeout = setTimeout(show_previews, 200)
    });

    var whiteboards = [];
    var strokes = {};

    var get_whiteboards = () => {
        $.ajax({
            type: 'GET',
            url: '/api/whiteboard',
            success: (res) => {
                whiteboards = res;
                get_strokes();
            }
        });
    }

    var get_strokes = () => {
        var deferreds = []
        for (var [whiteboard_id, nickname] of whiteboards) {
            deferreds.push($.ajax({
                type: 'GET',
                url: '/api/strokes',
                data: {
                    whiteboard_id: whiteboard_id
                },
                success: (res) => {
                    strokes[res.whiteboard_id] = res;
                }
            }));
        }
        $.when(...deferreds).then(function() {
            show_previews();
        });
    }

    var show_previews = () => {
        $('#saved-whiteboards').empty();
        for (var [whiteboard_id, nickname] of whiteboards) {
            $('#saved-whiteboards').append(`
                <div class='preview-whiteboard' id='preview-${whiteboard_id}'>
                    <button class='${nickname ? 'nickname' : 'whiteboard_id'}'>${nickname ?? whiteboard_id}</button>
                    <canvas id='canvas-${whiteboard_id}' width='${window.innerWidth*0.1}' height='${window.innerHeight*0.1}'></canvas>
                </div>
            `)
            
            var ctx = document.querySelector(`#canvas-${whiteboard_id}`).getContext('2d');
            drawStrokes(ctx, strokes[whiteboard_id].strokes, [0,0], 0.1);
        }
    }

    get_whiteboards();
}

$(document).on("click", '.nickname', (e) => {
    console.log($(e.target).html());
    window.location.href = `/${$(e.target).html()}`;
});

$(document).on("click", '.whiteboard_id', (e) => {
    console.log($(e.target).html());
    window.location.href = `/whiteboard?id=${$(e.target).html()}`;
});

var drawStrokes = (context, strokes, offset, scale) => {
    for (const stroke of strokes) {
        drawPoints(context, stroke, offset, scale);
    }
}

var drawPoints = (context, stroke, offset, scale) => {
    var [points, color, width] = stroke;
    if (color == '#ffffff' || color == '#000000') {
        context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--sec');
    } else if (color == 'erase') {
        context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--prim');
    } else {
        context.strokeStyle = color;
    }    
    context.lineWidth = 1;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    if (points.length > 0) {
        const [x, y] = points[0];
        context.moveTo((x+offset[0])*scale, (y+offset[1])*scale);
    }
    for (const point of points) {
        const [x, y] = point;
        context.lineTo((x+offset[0])*scale, (y+offset[1])*scale);
    } 
    context.stroke();
}