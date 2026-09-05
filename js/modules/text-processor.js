function parseColorCodes(text) {
    var colorRegex = /!\{#([A-Fa-f0-9]{6})\}/g;
    var parts = [];
    var lastIndex = 0;
    var match;
    var hasColors = false;

    colorRegex.lastIndex = 0;

    while ((match = colorRegex.exec(text)) !== null) {
        hasColors = true;
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index), color: null });
        }
        parts.push({ text: '', color: '#' + match[1] });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex), color: null });
    }

    var colorMap = {
        '~y~': '#fbf724',   
        '~r~': '#f00000',
        '~b~': '#3896f3', 
        '~g~': '#56d64b',  
        '~p~': '#c2a3da',   
        '~o~': '#eda841',   
        '~w~': '#f1f1f1',  
        '~c~': '#33c1c9', 
        '~m~': '#ff00bc',    
        '~n~': '',
        '~u~': '#3896f3',
        '~s~': '#cdd6f4'    
    };

    var gtacolorRegex = /~[yrbgpocmnus]~/g;
    var gtacolorRegexGlobal = /~[yrbgpocmnus]~/g;
    var hasGtaColors = gtacolorRegex.test(text);
    
    gtacolorRegexGlobal.lastIndex = 0;

    if (hasGtaColors && !hasColors) {
        var gtaParts = [];
        var lastGtaIndex = 0;
        var gtaMatch;

        while ((gtaMatch = gtacolorRegexGlobal.exec(text)) !== null) {
            if (gtaMatch.index > lastGtaIndex) {
                gtaParts.push({ text: text.substring(lastGtaIndex, gtaMatch.index), color: null });
            }
            var colorCode = gtaMatch[0];
            var hexColor = colorMap[colorCode] || null;
            if (hexColor) {
                gtaParts.push({ text: '', color: hexColor });
            } else {
                gtaParts.push({ text: '', color: null });
            }
            lastGtaIndex = gtaMatch.index + gtaMatch[0].length;
        }

        if (lastGtaIndex < text.length) {
            gtaParts.push({ text: text.substring(lastGtaIndex), color: null });
        }

        var result = '';
        var currentColor = null;

        for (var i = 0; i < gtaParts.length; i++) {
            var part = gtaParts[i];
            if (part.color !== null) {
                if (currentColor !== null) result += '</span>';
                currentColor = part.color;
                result += '<span style="color:' + currentColor + ';">';
            } else if (part.text) {
                result += part.text;
            }
        }

        if (currentColor !== null) result += '</span>';
        return result;
    }

    if (!hasColors) return text;

    var result = '';
    var currentColor = null;

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part.color !== null) {
            if (currentColor !== null) result += '</span>';
            currentColor = part.color;
            result += '<span style="color:' + currentColor + ';">';
        } else if (part.text) {
            if (/~[yrbgpocmnus]~/.test(part.text)) {
                result += parseColorCodes(part.text);
            } else {
                result += part.text;
            }
        }
    }

    if (currentColor !== null) result += '</span>';
    return result;
}

function buildLineFromWordData(wordDataArray, tokens) {
    var result = '';

    for (var i = 0; i < wordDataArray.length; i++) {
        var wd = wordDataArray[i];
        var tokenIdx = wd.tokenIndex;
        var word = wd.word;

        var colorForWord = null;
        for (var j = tokenIdx; j >= 0; j--) {
            if (tokens[j].type === 'color') {
                colorForWord = tokens[j].content;
                break;
            }
        }

        if (colorForWord) {
            result += colorForWord + word;
        } else {
            result += word;
        }

        if (i < wordDataArray.length - 1) {
            result += ' ';
        }
    }

    return result.trim();
}

function wrapAndSplit(text, width) {
    if (!width || width < 1) return [text];

    var colorRegex = /!\{#([A-Fa-f0-9]{6})\}/g;
    var tokens = [];
    var lastIndex = 0;
    var match;
    var plainText = '';

    colorRegex.lastIndex = 0;

    while ((match = colorRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            var textBefore = text.substring(lastIndex, match.index);
            tokens.push({ type: 'text', content: textBefore });
            plainText += textBefore;
        }
        tokens.push({ type: 'color', content: '!{#' + match[1] + '}' });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        var remaining = text.substring(lastIndex);
        tokens.push({ type: 'text', content: remaining });
        plainText += remaining;
    }

    if (tokens.length === 0 || tokens.every(function(t) { return t.type === 'text'; })) {
        var words = text.split(' ');
        var lines = [];
        var currentLine = '';
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            if (word.length > width) {
                if (currentLine) {
                    lines.push(currentLine.trim());
                    currentLine = '';
                }
                for (var j = 0; j < word.length; j += Math.floor(width * 0.8)) {
                    var chunk = word.substring(j, Math.min(j + Math.floor(width * 0.8), word.length));
                    if (chunk) {
                        lines.push(chunk.trim());
                    }
                }
            } else if (currentLine.length + word.length + 1 <= width) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) lines.push(currentLine.trim());
                currentLine = word;
            }
        }
        if (currentLine) lines.push(currentLine.trim());
        return lines;
    }

    var wordPositions = [];
    var pos = 0;
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].type === 'text') {
            var textWords = tokens[i].content.split(' ');
            for (var j = 0; j < textWords.length; j++) {
                if (textWords[j]) {
                    wordPositions.push({
                        tokenIndex: i,
                        word: textWords[j],
                        startPos: pos,
                        endPos: pos + textWords[j].length
                    });
                    pos += textWords[j].length + 1;
                }
            }
        }
    }

    var currentLineWords = [];
    var currentLineLength = 0;
    var lines = [];

    for (var i = 0; i < wordPositions.length; i++) {
        var wordData = wordPositions[i];
        var word = wordData.word;
        var wordLength = word.length;

        if (wordLength > width) {
            if (currentLineWords.length > 0) {
                var lineText = buildLineFromWordData(currentLineWords, tokens);
                lineText = lineText.replace(/\s+$/, '');
                lines.push(lineText);
                currentLineWords = [];
                currentLineLength = 0;
            }
            
            var chars = word.split('');
            var currentWordChunk = '';
            for (var j = 0; j < chars.length; j++) {
                currentWordChunk += chars[j];
                if (currentWordChunk.length >= Math.floor(width * 0.8) || j === chars.length - 1) {
                    var chunkData = {
                        tokenIndex: wordData.tokenIndex,
                        word: currentWordChunk,
                        startPos: wordData.startPos + (j - currentWordChunk.length + 1),
                        endPos: wordData.startPos + j + 1
                    };
                    
                    if (currentLineLength + currentWordChunk.length + (currentLineWords.length > 0 ? 1 : 0) <= width) {
                        currentLineWords.push(chunkData);
                        currentLineLength += currentWordChunk.length + (currentLineWords.length > 1 ? 1 : 0);
                    } else {
                        if (currentLineWords.length > 0) {
                            var lineText = buildLineFromWordData(currentLineWords, tokens);
                            lineText = lineText.replace(/\s+$/, '');
                            lines.push(lineText);
                            currentLineWords = [];
                            currentLineLength = 0;
                        }
                        currentLineWords.push(chunkData);
                        currentLineLength = currentWordChunk.length;
                    }
                    currentWordChunk = '';
                }
            }
            continue;
        }

        if (currentLineLength + wordLength + (currentLineWords.length > 0 ? 1 : 0) <= width) {
            currentLineWords.push(wordData);
            currentLineLength += wordLength + (currentLineWords.length > 1 ? 1 : 0);
        } else {
            if (currentLineWords.length > 0) {
                var lineText = buildLineFromWordData(currentLineWords, tokens);
                lineText = lineText.replace(/\s+$/, '');
                lines.push(lineText);
            }
            currentLineWords = [wordData];
            currentLineLength = wordLength;
        }
    }

    if (currentLineWords.length > 0) {
        var lineText = buildLineFromWordData(currentLineWords, tokens);
        lineText = lineText.replace(/\s+$/, '');
        lines.push(lineText);
    }

    return lines;
}