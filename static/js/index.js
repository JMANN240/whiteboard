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

    var show_previews = () => {
        $.ajax({
            type: 'GET',
            url: '/api/whiteboard',
            success: (res) => {
                $('#saved-whiteboards').empty();
                for (var [whiteboard_id, nickname] of res) {
                    $('#saved-whiteboards').append(`
                        <div class='preview-whiteboard' id='preview-${whiteboard_id}'>
                            <button class='${nickname ? 'nickname' : 'whiteboard_id'}'>${nickname ?? whiteboard_id}</button>
                            <canvas id='canvas-${whiteboard_id}' width='${window.innerWidth*0.1}' height='${window.innerHeight*0.1}'></canvas>
                        </div>
                    `)
                    $.ajax({
                        type: 'GET',
                        url: '/api/strokes',
                        data: {
                            whiteboard_id: whiteboard_id
                        },
                        success: (res) => {
                            var ctx = document.querySelector(`#canvas-${res.whiteboard_id}`).getContext('2d')
                            drawStrokes(ctx, res.strokes, [0,0], 0.1)
                        }
                    })
                }
            }
        })
    }

    show_previews();
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
    context.strokeStyle = (color == '#ffffff' || color == '#000000') ? getComputedStyle(document.documentElement).getPropertyValue('--sec') : color;;
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