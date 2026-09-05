function getCensorMode() {
    return 'remove';
}

function setCensorMode(mode) {

}

function updateCensorButtonText() {
    $('#censor-toggle-btn').text('Censor: Remove');
}

function applyCensorship(text) {
    var parts = text.split('÷');
    var result = '';

    for (var i = 0; i < parts.length; i++) {
        if (i % 2 === 1) {
            result += '<span class="censor-removed">' + parts[i] + '</span>';
        } else {
            result += parts[i];
        }
    }

    return result;
}

function initCensorSystem() {
    $('#censor-insert-btn').click(function() {
        var symbol = '÷';
        navigator.clipboard.writeText(symbol).then(function() {
            var $btn = $('#censor-insert-btn');
            var originalText = $btn.text();
            $btn.text('✓').css('color', '#56d64b');
            setTimeout(function() {
                $btn.text(originalText).css('color', '');
            }, 1500);
        }).catch(function(err) {
            var textarea = document.createElement('textarea');
            textarea.value = symbol;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            var $btn = $('#censor-insert-btn');
            var originalText = $btn.text();
            $btn.text('✓').css('color', '#56d64b');
            setTimeout(function() {
                $btn.text(originalText).css('color', '');
            }, 1500);
        });
    });

    $('#censor-toggle-btn').hide();
    updateCensorButtonText();
}