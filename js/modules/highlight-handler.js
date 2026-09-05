function getHighlightedChars() {
    return $.jStorage.get("highlightedChars") || [];
}

function saveHighlightedChars(chars) {
    $.jStorage.set("highlightedChars", chars);
}

function isHighlightedLine(text, highlightedChars) {
    if (!highlightedChars || highlightedChars.length === 0) return false;
    var trimmedText = text.trim();
    for (var i = 0; i < highlightedChars.length; i++) {
        var name = highlightedChars[i];
        var patterns = [
            name + " says:",
            name + " says [low]:",
            name + " says [lower]:",
            name + " shouts:",
            name + " says (phone):",
            name + " says [low] (phone):",
            name + " says [lower] (phone):"
        ];
        for (var j = 0; j < patterns.length; j++) {
            if (trimmedText.indexOf(patterns[j]) === 0) return true;
        }
        var regex = new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+says');
        if (regex.test(trimmedText)) return true;
    }
    return false;
}

var dropdownVisible = false;

function ensureDropdownExists() {
    var $dropdown = $('#highlight-dropdown');
    if ($dropdown.length === 0) {
        $dropdown = $('<div id="highlight-dropdown" class="highlight-dropdown"></div>');
        $('body').append($dropdown);
    }
    return $dropdown;
}

function updateHighlightDropdown() {
    var $dropdown = ensureDropdownExists();
    
    var chars = getHighlightedChars();
    if (chars.length === 0) {
        $dropdown.html('<div class="highlight-dropdown-item" style="color: #666; cursor: default;">No characters highlighted</div>');
    } else {
        var html = '';
        for (var i = 0; i < chars.length; i++) {
            html += '<div class="highlight-dropdown-item">' + chars[i] + 
                    '<span class="remove-btn" data-name="' + chars[i] + '">×</span></div>';
        }
        $dropdown.html(html);
        
        $dropdown.find('.remove-btn').click(function(e) {
            e.stopPropagation();
            var name = $(this).data('name');
            var current = getHighlightedChars();
            var newList = [];
            for (var i = 0; i < current.length; i++) {
                if (current[i] !== name) newList.push(current[i]);
            }
            saveHighlightedChars(newList);
            updateHighlightDropdown();
            window.renderChatlog();
        });
    }
    return $dropdown;
}

function positionDropdown($btn, $dropdown) {
    var btnOffset = $btn.offset();
    var top = btnOffset.top + $btn.outerHeight() + 5;
    var left = btnOffset.left - 100;
    
    var windowWidth = $(window).width();
    if (left + 150 > windowWidth) {
        left = windowWidth - 160;
    }
    if (left < 5) {
        left = 5;
    }
    
    $dropdown.css({
        top: top + 'px',
        left: left + 'px',
        display: 'block',
        position: 'fixed',
        zIndex: 9999
    });
}

function initHighlightSystem() {
    var $dropdown = ensureDropdownExists();
    $dropdown.hide();

    $('#highlight-list').click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        var $btn = $(this);
        var $dropdown = ensureDropdownExists();
        
        dropdownVisible = !dropdownVisible;
        
        if (dropdownVisible) {
            updateHighlightDropdown();
            positionDropdown($btn, $dropdown);
        } else {
            $dropdown.hide();
        }
    });

    $(document).click(function(e) {
        var $dropdown = $('#highlight-dropdown');
        var $btn = $('#highlight-list');
        
        if ($dropdown.length > 0 && !$dropdown.is(e.target) && 
            $dropdown.has(e.target).length === 0 && 
            !$btn.is(e.target) && $btn.has(e.target).length === 0) {
            dropdownVisible = false;
            $dropdown.hide();
        }
    });

    $(document).on('click', '#highlight-dropdown', function(e) {
        e.stopPropagation();
    });

    $('#highlight-add').click(function() {
        var name = $('#highlight-name').val().trim();
        if (!name) return;
        
        var current = getHighlightedChars();
        var exists = false;
        for (var i = 0; i < current.length; i++) {
            if (current[i].toLowerCase() === name.toLowerCase()) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            current.push(name);
            saveHighlightedChars(current);
            $('#highlight-name').val('');
            if (dropdownVisible) {
                updateHighlightDropdown();
                var $btn = $('#highlight-list');
                var $dropdown = ensureDropdownExists();
                positionDropdown($btn, $dropdown);
            }
            window.renderChatlog();
        }
    });

    $('#highlight-name').keypress(function(e) {
        if (e.which === 13) $('#highlight-add').click();
    });
}