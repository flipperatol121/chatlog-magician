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
        
        var selectedNodes = [];
        var node = range.startContainer;
        
        if (range.startContainer === range.endContainer && range.startContainer.nodeType === 3) {
            selectedNodes.push({
                node: range.startContainer,
                startOffset: range.startOffset,
                endOffset: range.endOffset
            });
        } else {
            var walker = document.createTreeWalker(
                range.commonAncestorContainer,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        if (node === range.startContainer) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        if (node === range.endContainer) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        if (range.intersectsNode && range.intersectsNode(node)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        var nodeRange = document.createRange();
                        nodeRange.selectNode(node);
                        var startCompare = nodeRange.compareBoundaryPoints(Range.START_TO_START, range);
                        var endCompare = nodeRange.compareBoundaryPoints(Range.END_TO_END, range);
                        if (startCompare >= 0 && endCompare <= 0) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_REJECT;
                    }
                },
                false
            );
            
            var currentNode;
            while (currentNode = walker.nextNode()) {
                var startOffset = 0;
                var endOffset = currentNode.textContent.length;
                if (currentNode === range.startContainer) {
                    startOffset = range.startOffset;
                }
                if (currentNode === range.endContainer) {
                    endOffset = range.endOffset;
                }
                selectedNodes.push({
                    node: currentNode,
                    startOffset: startOffset,
                    endOffset: endOffset
                });
            }
        }

        if (selectedNodes.length === 0) {
            alert('No text selected. Please select some text first.');
            return;
        }

        for (var i = 0; i < selectedNodes.length; i++) {
            var data = selectedNodes[i];
            var node = data.node;
            var text = node.textContent;
            var startOffset = data.startOffset;
            var endOffset = data.endOffset;
            
            if (startOffset === endOffset) continue;
            
            var fragment = document.createDocumentFragment();
            
            if (startOffset > 0) {
                fragment.appendChild(document.createTextNode(text.substring(0, startOffset)));
            }
            
            var span = document.createElement('span');
            span.style.color = color;
            span.textContent = text.substring(startOffset, endOffset);
            fragment.appendChild(span);
            
            if (endOffset < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(endOffset)));
            }
            
            node.parentNode.replaceChild(fragment, node);
        }
        
        sel.removeAllRanges();
        savedSelection = null;
        
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