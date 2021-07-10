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
