$('#options-hint').html(touch ? "Two-finger Tap for options." : "Space for options.")

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

$.ajax({
    type: 'GET',
    url: '/api/whiteboard',
    success: (res) => {
        for (var [whiteboard_id, nickname] of res) {
            console.log(nickname);
            $('#saved-whiteboards').append(`<button class='${nickname ? 'nickname' : 'whiteboard_id'}'>${nickname ?? whiteboard_id}</button>`)
        }
    }
})

$(document).on("click", '.nickname', (e) => {
    console.log($(e.target).html());
    window.location.href = `/${$(e.target).html()}`;
});

$(document).on("click", '.whiteboard_id', (e) => {
    console.log($(e.target).html());
    window.location.href = `/whiteboard?id=${$(e.target).html()}`;
});