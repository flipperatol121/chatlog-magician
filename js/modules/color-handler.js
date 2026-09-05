var colorSwatches = [
    { hex: '#c2a3da', name: 'Action' },
    { hex: '#939799', name: 'Low' },
    { hex: '#5a5a5b', name: 'Lower' },
    { hex: '#c6c4c4', name: 'Normal' },
    { hex: '#f00000', name: 'Error' },
    { hex: '#fbf724', name: 'Yellow' },
    { hex: '#56d64b', name: 'Success' },
    { hex: '#eda841', name: 'Warning' },
    { hex: '#3896f3', name: 'Info' },
    { hex: '#f1f1f1', name: 'Normal' },
    { hex: '#ffec8b', name: 'Radio' },
    { hex: '#a19558', name: 'Radio 2' },
    { hex: '#ccca15', name: 'Radio 3' },
    { hex: '#33c1c9', name: 'Vessel' },
    { hex: '#ff00bc', name: 'To' }
];

var colorPopupVisible = false;
var savedSelection = null;

function createColorPopup() {
    var $popup = $('<div class="color-picker-popup" id="color-popup">' +
        '<div class="color-grid"></div>' +
        '</div>');
    $('body').append($popup);

    var $grid = $popup.find('.color-grid');
    for (var i = 0; i < colorSwatches.length; i++) {
        var swatch = colorSwatches[i];
        var $swatch = $('<div class="color-swatch" style="background-color:' + swatch.hex + ';" data-color="' + swatch.hex + '" title="' + swatch.name + '"></div>');
        $grid.append($swatch);
    }

    $popup.find('.color-swatch').click(function() {
        var color = $(this).data('color');
        applyColorToSelection(color);
        $popup.hide();
        colorPopupVisible = false;
        savedSelection = null;
    });

    return $popup;
}

function positionColorPopup() {
    var $btn = $('#color-picker-btn');
    var offset = $btn.offset();
    $('#color-popup').css({
        top: (offset.top + $btn.outerHeight() + 5) + 'px',
        left: offset.left + 'px',
        display: 'block'
    });
}

function applyColorToSelection(color) {
    if (!savedSelection) {
        alert('No text selected. Please select some text first.');
        return;
    }

    try {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelection);
        
        var range = savedSelection;
        var selectedText = range.toString();
        
        if (!selectedText.trim()) {
            alert('No text selected.');
            return;
        }

        var container = range.commonAncestorContainer;
        var $container = $(container).closest('.generated');
        
        if ($container.length === 0) {
            var parent = $(container).parents('.generated');
            if (parent.length > 0) {
                $container = parent;
            } else {
                var allGenerated = $('.generated');
                for (var i = 0; i < allGenerated.length; i++) {
                    if ($(allGenerated[i]).find(container).length > 0 || $(allGenerated[i]).has(container).length > 0) {
                        $container = $(allGenerated[i]);
                        break;
                    }
                }
            }
        }

        if ($container.length === 0) {
            alert('Could not find the text to color. Please select text within the output area.');
            return;
        }

        var fullText = $container.text();
        var startIndex = fullText.indexOf(selectedText);
        
        if (startIndex === -1) {
            var trimmedFull = fullText.trim();
            var trimmedSelected = selectedText.trim();
            startIndex = trimmedFull.indexOf(trimmedSelected);
            if (startIndex !== -1) {
                var leadingWS = fullText.indexOf(trimmedFull);
                startIndex = leadingWS + startIndex;
            }
        }

        if (startIndex === -1) {
            try {
                var span = document.createElement('span');
                span.style.color = color;
                range.surroundContents(span);
                sel.removeAllRanges();
                return;
            } catch (e) {
                try {
                    var textNode = range.startContainer;
                    var startOffset = range.startOffset;
                    var endOffset = range.endOffset;
                    
                    if (textNode.nodeType === 3) {
                        var parentNode = textNode.parentNode;
                        var text = textNode.textContent;
                        var before = text.substring(0, startOffset);
                        var middle = text.substring(startOffset, endOffset);
                        var after = text.substring(endOffset);
                        
                        var span = document.createElement('span');
                        span.style.color = color;
                        span.textContent = middle;
                        
                        var fragment = document.createDocumentFragment();
                        if (before) fragment.appendChild(document.createTextNode(before));
                        fragment.appendChild(span);
                        if (after) fragment.appendChild(document.createTextNode(after));
                        parentNode.replaceChild(fragment, textNode);
                        sel.removeAllRanges();
                        return;
                    }
                } catch (e2) {
                    alert('Could not apply color. Please try selecting a smaller portion of text.');
                    return;
                }
            }
            return;
        }

        var endIndex = startIndex + selectedText.length;
        var before = fullText.substring(0, startIndex);
        var middle = fullText.substring(startIndex, endIndex);
        var after = fullText.substring(endIndex);

        var coloredHtml = '<span style="color:' + color + ';">' + middle + '</span>';
        var newHtml = before + coloredHtml + after;

        $container.html(newHtml);
        sel.removeAllRanges();
        
    } catch (e) {
        alert('Error applying color: ' + e.message);
    }
}

function initColorPicker() {
    var $colorPopup = createColorPopup();

    $('#color-picker-btn').click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        var selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
            alert('Please select some text first to color it.');
            return;
        }
        
        if (selection.rangeCount > 0) {
            savedSelection = selection.getRangeAt(0).cloneRange();
        } else {
            alert('Please select some text first to color it.');
            return;
        }
        
        colorPopupVisible = !colorPopupVisible;
        if (colorPopupVisible) {
            positionColorPopup();
        } else {
            $colorPopup.hide();
            savedSelection = null;
        }
    });

    $(document).click(function() {
        if (colorPopupVisible) {
            colorPopupVisible = false;
            $colorPopup.hide();
            savedSelection = null;
        }
    });

    $colorPopup.click(function(e) {
        e.stopPropagation();
    });
}