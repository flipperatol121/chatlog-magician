function initBackgroundControls() {
    var bgColor = localStorage.getItem('chatlog-bg-color') || '#000000';
    var showBg = localStorage.getItem('chatlog-show-bg') !== 'false';

    $('#bg-color-picker').val(bgColor);

    applyBackground(bgColor, showBg);

    $('#bg-toggle-btn').text(showBg ? 'Hide BG' : 'Show BG');

    $('#bg-color-picker').on('input', function() {
        var color = $(this).val();
        localStorage.setItem('chatlog-bg-color', color);
        var show = localStorage.getItem('chatlog-show-bg') !== 'false';
        applyBackground(color, show);
        renderChatlog();
    });

    $('#bg-toggle-btn').click(function() {
        var currentShow = localStorage.getItem('chatlog-show-bg') !== 'false';
        var newShow = !currentShow;
        localStorage.setItem('chatlog-show-bg', String(newShow));
        var color = localStorage.getItem('chatlog-bg-color') || '#000000';
        applyBackground(color, newShow);
        $(this).text(newShow ? 'Hide BG' : 'Show BG');
        renderChatlog();
    });
}

function applyBackground(color, show) {
    localStorage.setItem('chatlog-bg-color', color);
    localStorage.setItem('chatlog-show-bg', String(show));
}