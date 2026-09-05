function useRegex(input) {
    var regex = /([01]\d|2[0-3]):[0-5]\d:[0-5]\d/;
    return regex.test(input);
}

// Main render function
function renderChatlog() {
    $(".generated").remove();
    $(".clear").remove();
    $(".generated-wrapper").remove();

    var bgColor = localStorage.getItem('chatlog-bg-color') || '#000000';
    var showBg = localStorage.getItem('chatlog-show-bg') !== 'false';
    var bgStyle = showBg ? bgColor : 'transparent';

    var $wrapper = $('<div class="generated-wrapper" style="display:inline-block;padding:0px;line-height:0;max-width:none;overflow:visible;"></div>');
    $(".output").append($wrapper);

    var inputLines = $("textarea").val().replace("<script>", "").replace("</script>", "").split("\n");
    var wrapWidth = parseInt($("#line-break").val()) || 70;
    var highlightedChars = getHighlightedChars();

    function hasHexColors(text) {
        return /!\{#[A-Fa-f0-9]{6}\}/.test(text);
    }

    function stripHexCodes(text) {
        return text.replace(/!\{#[A-Fa-f0-9]{6}\}/g, '');
    }

    var allWrappedLines = [];
    for (var t = 0; t < inputLines.length; t++) {
        var lineText = inputLines[t];
        var strippedText = lineText;

        if (lineText.trim() === '') {
            allWrappedLines.push({
                text: '',
                originalIndex: t,
                wrapIndex: 0,
                isFirst: true,
                isLast: true,
                isHighlighted: false,
                isEmpty: true,
                originalText: '',
                hasHex: false
            });
            continue;
        }

        if (useRegex(lineText)) strippedText = lineText.slice(10);

        var wrappedLines = wrapAndSplit(strippedText, wrapWidth);
        var isHighlighted = isHighlightedLine(strippedText, highlightedChars);
        var hasHex = hasHexColors(strippedText);
        var textForDetection = hasHex ? stripHexCodes(strippedText) : strippedText;

        for (var w = 0; w < wrappedLines.length; w++) {
            allWrappedLines.push({
                text: wrappedLines[w],
                originalIndex: t,
                wrapIndex: w,
                isFirst: (w === 0),
                isLast: (w === wrappedLines.length - 1),
                isHighlighted: isHighlighted,
                isEmpty: false,
                originalText: strippedText,
                textForDetection: textForDetection,
                hasHex: hasHex
            });
        }
    }

    if (allWrappedLines.length === 0) {
        allWrappedLines.push({
            text: '',
            originalIndex: 0,
            wrapIndex: 0,
            isFirst: true,
            isLast: true,
            isHighlighted: false,
            isEmpty: true,
            originalText: '',
            textForDetection: '',
            hasHex: false
        });
    }

    var lineColorClass = {};
    for (var g = 0; g < allWrappedLines.length; g++) {
        var item = allWrappedLines[g];
        if (item.isEmpty) {
            lineColorClass[g] = 'empty';
            continue;
        }
        
        var detectionText = item.textForDetection || item.originalText || item.text;
        var trimmedText = detectionText.trim();
        
        if (!trimmedText) {
            lineColorClass[g] = 'empty';
            continue;
        }
        
        var colorClass = detectColorClass(trimmedText, item.isHighlighted);
        lineColorClass[g] = colorClass;
    }

    var tempDivs = [];
    var maxWidth = 0;

    for (var g = 0; g < allWrappedLines.length; g++) {
        var item = allWrappedLines[g];

        if (item.isEmpty) {
            var emptyDiv = $('<div class="generated empty-line" style="display:inline-block;line-height:1.3;padding:0px 5px 1px 5px;min-height:1.3em;background-color:' + bgStyle + ';overflow:visible;white-space:pre-line;">&nbsp;</div>');

            emptyDiv.data('originalIndex', item.originalIndex);
            emptyDiv.data('wrapIndex', 0);
            emptyDiv.data('isEmpty', true);
            $wrapper.append(emptyDiv);
            tempDivs.push(emptyDiv);
            if (g < allWrappedLines.length - 1) {
                if (item.isLast) {
                    $wrapper.append('<br>');
                } else {
                    $wrapper.append(' ');
                }
            }
            continue;
        }

        var displayText = parseColorCodes(item.text);
        displayText = applyCensorship(displayText);
        
        var colorClass = lineColorClass[g] || 'default';
        var detectionText = item.textForDetection || item.originalText || item.text;
        var trimmedDetection = detectionText.trim();
        
        if (trimmedDetection) {
            if (item.hasHex) {
                var hasCustomColors = /<span style="color:#[A-Fa-f0-9]{6};"/.test(displayText);
                if (!hasCustomColors) {
                    var coloredText = applyColorClass(displayText, colorClass);
                    displayText = coloredText;
                } else {
                    var tempDiv = $('<div>' + displayText + '</div>');
                    var hasClassSpan = tempDiv.find('span[class]').length > 0;
                    if (!hasClassSpan) {
                        var classMap = {
                            'death': 'death',
                            'me': 'me',
                            'whisper': 'whisper',
                            'carwhisper': 'carwhisper',
                            'ooc': 'ooc',
                            'grey': 'grey',
                            'darkgrey': 'darkgrey',
                            'lightgrey': 'lightgrey',
                            'white': 'white',
                            'radio': 'radio',
                            'radio2': 'radio2',
                            'dep': 'dep',
                            'toyou': 'toyou',
                            'yellow': 'yellow',
                            'blue': 'blue',
                            'megafon': 'megafon',
                            'news': 'news',
                            'money': 'money',
                            'green': 'green',
                            'orange': 'orange',
                            'vessel': 'vessel'
                        };
                        if (classMap[colorClass]) {
                            displayText = '<span class="' + classMap[colorClass] + '">' + displayText + '</span>';
                        }
                    }
                }
            } else {
                var coloredText = applyColorClass(displayText, colorClass);
                displayText = coloredText;
            }
        }

        var div = $('<div class="generated" style="display:inline-block;line-height:1.3;padding:0px 5px 1px 5px;background-color:' + bgStyle + ';overflow:visible;white-space:pre-line;">' + displayText.trim() + '</div>');
        div.data('originalIndex', item.originalIndex);
        div.data('wrapIndex', item.wrapIndex);
        div.data('isFirst', item.isFirst);
        div.data('isLast', item.isLast);
        div.data('isHighlighted', item.isHighlighted);
        div.data('rawText', item.text);
        div.data('isEmpty', false);
        div.data('hasHex', item.hasHex);
        $wrapper.append(div);
        tempDivs.push(div);
        if (g < allWrappedLines.length - 1) {
            if (item.isLast) {
                $wrapper.append('<br>');
            } else {
                $wrapper.append('');
            }
        }
    }

    $(".generated").each(function() {
        var html = $(this).html();
        html = html.replace(/!\{#[A-Fa-f0-9]{6}\}/g, '');
        $(this).html(html);
    });

    $(".generated").each(function() {
        var width = $(this).outerWidth(true);
        if (width > maxWidth) {
            maxWidth = width;
        }
    });

    $(".generated.empty-line").each(function() {
        var width = $(this).outerWidth(true);
        if (width > maxWidth) {
            maxWidth = width;
        }
    });

    if (maxWidth > 0) {
        $wrapper.css('width', (maxWidth) + 'px');
    }

    $wrapper.css('padding-bottom', '0px');
    $wrapper.css('padding-top', '0px');
}

function detectColorClass(text, isHighlighted) {
    var trimmedText = text.trim();
    var isInfo = /\[INFO\]/.test(trimmedText);
    var isError = /\[ERROR\]/.test(trimmedText);
    var isSuccess = /\[SUCCESS\]/.test(trimmedText);
    var isDelivery = /\[Delivery\]/.test(trimmedText);
    var isAFKCheck = /\[AFK CHECK\]/.test(trimmedText);
    var isAdminBan = /Admin.*banned/.test(trimmedText) || /has been permanently Rockstar banned/.test(trimmedText) || /Rockstar banned/.test(trimmedText);
    var isPM = /PM from|PM to/.test(trimmedText);
    var isCommandNotFound = /Command not found/.test(trimmedText);
    var isPlayerNotFound = /No player\(s\) found/.test(trimmedText);
    var isFactionMembers = /Faction Members (Online|On-Duty):/.test(trimmedText);
    var isKick = /was kicked for/.test(trimmedText);
    var isOnlineFactionMembers = /^Online faction members:$/.test(trimmedText);
    var isFriendLogin = /\[FRIEND\]/.test(trimmedText);
    var isGlobalOOC = /Global OOC/.test(trimmedText);
    var isTV = /\[TV\]/.test(trimmedText);
    var isUsage = /\[USAGE\]/.test(trimmedText);
    var isXMRadio = /\[XM Radio\]/.test(trimmedText);
    var isSmartTP = /\[SMART-TP\]/.test(trimmedText);
    var isWarning = /^Warning:/.test(trimmedText);
    var isInfoColon = /^\[INFO\]:/.test(trimmedText);
    var isMakeSure = /Make sure to always use/.test(trimmedText);
    var isIfYouWant = /If you want to associate/.test(trimmedText);
    var isInfoLine = /^Info:/.test(trimmedText);
    var isNoSignal = /^No signal detected/.test(trimmedText);
    var isScanComplete = /A scan is complete when you hear a beep/.test(trimmedText);
    var isMainPhoneSet = /Main phone set to/.test(trimmedText);
    var isPattributes = /\/pattributes/.test(trimmedText) || /\/stashinfo/.test(trimmedText);
    var isStopAnim = /\.stop/.test(trimmedText) || /\/anim stop/.test(trimmedText);
    var isInvex = /\/invex/.test(trimmedText);
    var isHonorSystem = /Honor System/.test(trimmedText);
    var isOrderedReceivedLine = /ordered and received/.test(trimmedText);
    var isBusinessIsOpen = /Business is:/.test(trimmedText);
    var isSupportResets = /support resets on/.test(trimmedText);
    var isBusinessWarning = /This command must only be used by roleplay businesses/.test(trimmedText);
    var isCursor = /Use F3 to activate the cursor/.test(trimmedText);
    var isPayphone = /\[Payphone\]/.test(trimmedText);
    var isATM = /ATM:/.test(trimmedText);
    var isStoreOpen = /Press Y to open store/.test(trimmedText);
    var isOvercarry = /\[OVERCARRY\]/.test(trimmedText);
    var isBlip = /We've placed a blip/.test(trimmedText);
    var isVGet = /\/vget/.test(trimmedText);
    var isFixvehWarning = /\/FIXVEH/.test(trimmedText);
    var isPhoneCommands = /^Commands:/.test(trimmedText) && /payphonecall/.test(trimmedText);
    var isPricePerKWh = /Price per kWh/.test(trimmedText);
    var isRecharge = /\/recharge/.test(trimmedText);
    var isRoutingNumber = /business routing number/.test(trimmedText);
    var isExpectedRoleplay = /expected to roleplay work/.test(trimmedText);
    var isPaidIn = /paid in \d+ minutes/.test(trimmedText);
    var isFactionCount = /^Faction Members (Online|On-Duty): \d+$/.test(trimmedText);
    var isFactionMemberList = /^[A-Z][a-z]+ [A-Z][a-z]+( \(AFK\))?( \(\(\/togf\)\))?$/.test(trimmedText);
    var isDescriptionHeader = /^___ Description of /.test(trimmedText) || /^___Description of /.test(trimmedText);
    var isDescription = /___Description of .*___/.test(trimmedText);
    var isTattooDescription = /___Tattoos description of .*___/.test(trimmedText);

    var isWhisper = /whispers:/i.test(trimmedText) && !/\[low\]/.test(trimmedText) && !/\[lower\]/.test(trimmedText);
    var isCarWhisper = /\(car\).*whispers:/i.test(trimmedText);
    var isLow = /\[low\]/i.test(trimmedText);
    var isLower = /\[lower\]/i.test(trimmedText);
    var isSays = /says:/i.test(trimmedText) && !isWhisper && !isLow && !isLower;
    var isShout = /shouts:/i.test(trimmedText);
    var isCellphone = /\(cellphone\)/i.test(trimmedText);
    var isEmote = /^\s*\*/.test(trimmedText);
    var isAttempt = /attempt has (failed|succeeded)/i.test(trimmedText);
    var isRadio = /^\*\* \[S: \d+ \| CH: \d+\]/.test(trimmedText);
    var isRadioEmote = /^\*\* \[S: \d+ \| CH: \d+\] \*/.test(trimmedText);
    var isMegaphone = /\[Megaphone\]/i.test(trimmedText);
    var isIntercom = /Intercom\]/i.test(trimmedText);
    var isDoorNoise = /\(\(\[Door\]\)\)/.test(trimmedText);
    var isIncomingCall = /Incoming call from/.test(trimmedText);
    var isPhonePickup = /Your call has been picked up/.test(trimmedText);
    var isPhoneHangup = /You have hung up the call/.test(trimmedText);

    var isDoorLocked = /the door is locked/i.test(trimmedText);
    var isDoorUnlocked = /you unlocked the property door/i.test(trimmedText);
    var isDoorLockedByPlayer = /you locked the property door/i.test(trimmedText);
    var isItemDisplay = /Item .* is (no longer|now) displayed/.test(trimmedText);
    var isReceivedItem = trimmedText.indexOf('You received ') === 0;
    var isGaveItem = trimmedText.indexOf('You gave ') === 0;
    var isPlacingItem = trimmedText.indexOf('You placed ') === 0;
    var isTakingItem = trimmedText.indexOf('You took ') === 0;
    var isShowingItem = /has shown you their/i.test(trimmedText);
    var isWeaponEquip = /\|------ .* Equipped Weapons ------/.test(trimmedText);
    var isAttachment = /^\u2800\u2800\u279D/.test(trimmedText);
    var isAttachmentsFound = /Attachments found/.test(trimmedText);
    var isUnlockedSafe = /unlocked your safe/.test(trimmedText);
    var isLockStatus = /changed the lock status/.test(trimmedText);
    var isUnequipped = /unequipped your weapon/.test(trimmedText);

    var isWithdrawn = /You have withdrawn/.test(trimmedText);
    var isDeposited = /You have deposited/.test(trimmedText);
    var isToppedUp = /You have topped up/.test(trimmedText);
    var isBought = /You bought a total of/.test(trimmedText);
    var isUsedItem = /You've used/.test(trimmedText) && !isUsedPanda;
    var isGettingMoney = /paid you \$/i.test(trimmedText);
    var isReceivingMoneyBank = /received \$.* from .* on your bank account/i.test(trimmedText);
    var isTakingMoneyContainer = /^Info: You took \$/.test(trimmedText);
    var isGiftedPanda = /gifted \d+ Panda Points/.test(trimmedText);
    var isUsedPanda = /used \d+ Panda Points/.test(trimmedText);

    var isPayment = /^You paid \$/.test(trimmedText) || /^You received \$/.test(trimmedText);

    var isPhones = /^Phones:/.test(trimmedText);
    var isPhoneList = /^\[\d+\]/.test(trimmedText);
    var isPhoneMessage = /^\(Main\)/.test(trimmedText) || /^\(iFruit/.test(trimmedText);
    var isPhoneRinging = /\[PHONE\].*ringing/i.test(trimmedText);
    var isNumber = /^Number:/.test(trimmedText);
    var isCosts = /^Costs:/.test(trimmedText);
    var isMenuLink = /Menu link:/.test(trimmedText);
    var isViewMenu = /\/viewmenu/.test(trimmedText);
    var isContacts = /^Contacts:/.test(trimmedText);
    var isContactEntry = / - (Online|Offline)$/.test(trimmedText);
    var isNumberShareRequest = /has sent you a request to share their main phone number/i.test(trimmedText);
    var isSharedContact = /shared their contact called/i.test(trimmedText);
    var isSendRequestShare = /You sent a request to share your main phone number/i.test(trimmedText);
    var isYouSharedContact = /You've shared your contact called/i.test(trimmedText);

    var isSendingLocation = /successfully sent your current location/i.test(trimmedText);
    var isReceivedLocation = /received a location from #/i.test(trimmedText);
    var isAtLocation = /You are at:/.test(trimmedText);

    var isBusinessClosed = /business is now closed/.test(trimmedText);
    var isBusinessOpened = /business is now opened/.test(trimmedText);
    var isShiftStart = /started your shift/.test(trimmedText);
    var isShiftEnd = /stopped your shift/.test(trimmedText);
    var isLeftArea = /left your business area/.test(trimmedText);
    var isCharacterChanged = /changed their character/.test(trimmedText);
    var isPleaseWait = /Please wait while/.test(trimmedText);
    var isItemsHeader = /\|-------- .* items --------\|/.test(trimmedText);
    var isItemLine = /^\d+:/.test(trimmedText);
    var isTotalWeight = /Total weight:/i.test(trimmedText);
    var isCharacterKill = /\[Character kill\]/i.test(trimmedText);
    var isDrugLab = /\[DRUG LAB\]/i.test(trimmedText);
    var isVehicleParked = /Vehicle parked/.test(trimmedText);

    var isStats = /^Stats for /.test(trimmedText);
    var isWallet = /Wallet:/.test(trimmedText);
    var isHealth = /^Health \|/.test(trimmedText);
    var isOrganization = /^Organization:/.test(trimmedText);
    var isBankRouting = /Bank Account Routing:/.test(trimmedText);
    var isBusiness = /^Business \d+:/ .test(trimmedText);
    var isCurrentJob = /^Current job:/.test(trimmedText);
    var isTime = /^Time \|/.test(trimmedText);
    var isTimeOnShift = /^Time on shift:/.test(trimmedText);
    var isTruckingRank = /^Trucking rank:/.test(trimmedText);
    var isProperties = /^Properties:/.test(trimmedText);
    var isRentTotal = /^Rent total:/.test(trimmedText);
    var isCustomNumber = /^Custom Number:/.test(trimmedText);
    var isPremium = /^Premium:/.test(trimmedText);
    var isWorldPoints = /^World Points:/.test(trimmedText);
    var isPandaPoints = /^Panda Points:/.test(trimmedText);
    var isCurrentTime = /^Current Time:/.test(trimmedText);
    var isIllegalSupplier = /^Illegal Supplier-Status:/.test(trimmedText);
    var isSeparator = /^=+$/.test(trimmedText);
    var isTimeSpent = /^Time spent online/.test(trimmedText);

    var isWeather = /Weather forecast:/.test(trimmedText);
    var isTemperature = /Temperature:/.test(trimmedText);
    var isWind = /Wind:/.test(trimmedText);
    var isWelcome = /Welcome to GTA World/.test(trimmedText);
    var isID = /The ID of/.test(trimmedText);

    var isOOC = false;
    var isFactionOOC = false;

    if (/\(\(.*:.*\)\)/.test(trimmedText) && !isInfo) {
        var match = trimmedText.match(/\(\( (.*?):/);
        if (match) {
            var beforeColon = match[1].trim();
            var cleanBeforeColon = beforeColon.replace(/^\(\d+\)\s*/, '');
            var words = cleanBeforeColon.split(/\s+/);
            if (words.length >= 3) {
                isFactionOOC = true;
                isOOC = false;
            } else if (words.length >= 1) {
                isOOC = true;
                isFactionOOC = false;
            } else {
                isOOC = false;
            }
        }
    }

    var isHealthFull = /Your health is already full/.test(trimmedText);
    var isToYou = /^\[!\]/.test(trimmedText);

    if (isHighlighted && !isInfo && !isError && !isAdminBan && !isAFKCheck && !isFactionMembers && !isOnlineFactionMembers && !isFactionMemberList && !isFactionCount) {
        return 'highlighted';
    } else if (isPayment) {
        return 'payment';
    } else if (isInfoColon) return 'infoColon';
    else if (isInfo) return 'info';
    else if (isError) return 'error';
    else if (isAdminBan) return 'adminBan';
    else if (isFriendLogin) return 'friendLogin';
    else if (isGlobalOOC) return 'globalOOC';
    else if (isTV) return 'tv';
    else if (isUsage) return 'usage';
    else if (isXMRadio) return 'xmRadio';
    else if (isAFKCheck) return 'afkCheck';
    else if (isDelivery) return 'delivery';
    else if (isSuccess) return 'success';
    else if (isKick) return 'kick';
    else if (isDoorLocked || isDoorLockedByPlayer) return 'doorLocked';
    else if (isDoorUnlocked) return 'doorUnlocked';
    else if (isCommandNotFound || isPlayerNotFound) return 'commandNotFound';
    else if (isFactionMembers && !isFactionCount) return 'factionMembers';
    else if (isOnlineFactionMembers) return 'onlineFactionMembers';
    else if (isFactionMemberList && !isFactionMembers) return 'factionMemberList';
    else if (isFactionCount) return 'factionCount';
    else if (isBusinessWarning || /^Any abuse will lead/.test(trimmedText) || /^The business already received/.test(trimmedText)) return 'businessWarning';
    else if (/You can get new support on:/.test(trimmedText)) return 'businessSupport';
    else if (isCursor) return 'cursor';
    else if (isPayphone) return 'payphone';
    else if (isNumber) return 'number';
    else if (isCosts) return 'costs';
    else if (isPhoneCommands) return 'phoneCommands';
    else if (isATM) return 'atm';
    else if (isStoreOpen) return 'storeOpen';
    else if (isWithdrawn || isDeposited || isToppedUp || isBought || isUsedItem) return 'withdrawn';
    else if (isHealthFull) return 'healthFull';
    else if (isOvercarry) return 'overcarry';
    else if (isBlip) return 'blip';
    else if (isVGet) return 'vget';
    else if (isFixvehWarning) return 'fixvehWarning';
    else if (isItemDisplay) return 'itemDisplay';
    else if (isMakeSure) return 'makeSure';
    else if (isIfYouWant) return 'ifYouWant';
    else if (isShiftStart || isShiftEnd) return 'shiftStart';
    else if (isLeftArea) return 'leftArea';
    else if (isWarning) return 'warning';
    else if (isSmartTP) return 'smartTP';
    else if (isWeaponEquip) return 'weaponEquip';
    else if (isAttachment) return 'attachment';
    else if (isAttachmentsFound) return 'attachmentsFound';
    else if (isUnlockedSafe) return 'unlockedSafe';
    else if (isLockStatus) return 'lockStatus';
    else if (isPricePerKWh) return 'pricePerKWh';
    else if (isRecharge) return 'recharge';
    else if (isRoutingNumber) return 'routingNumber';
    else if (isExpectedRoleplay) return 'expectedRoleplay';
    else if (isPaidIn) return 'paidIn';
    else if (isNoSignal) return 'noSignal';
    else if (isInfoLine) return 'infoLine';
    else if (isDescriptionHeader) return 'descriptionHeader';
    else if (isRadio || isRadioEmote) return 'radio';
    else if (/^\(Radio\)/.test(trimmedText)) return 'radioNonStar';
    else if (isStats) return 'stats';
    else if (isWallet) return 'wallet';
    else if (isHealth) return 'health';
    else if (isOrganization) return 'organization';
    else if (isBankRouting) return 'bankRouting';
    else if (isBusiness) return 'business';
    else if (isCurrentJob) return 'currentJob';
    else if (isTime) return 'time';
    else if (isTimeOnShift) return 'timeOnShift';
    else if (isTruckingRank) return 'truckingRank';
    else if (isProperties) return 'properties';
    else if (isRentTotal) return 'rentTotal';
    else if (isCustomNumber) return 'customNumber';
    else if (isPremium) return 'premium';
    else if (isWorldPoints) return 'worldPoints';
    else if (isPandaPoints) return 'pandaPoints';
    else if (isCurrentTime) return 'currentTime';
    else if (isIllegalSupplier) return 'illegalSupplier';
    else if (isTimeSpent) return 'timeSpent';
    else if (isSeparator) return 'separator';
    else if (isTemperature && !isStats) return 'temperature';
    else if (isWind && !isStats) return 'wind';
    else if (isWeather && !isStats) return 'weather';
    else if (isWelcome && !isStats) return 'welcome';
    else if (isOOC) return 'ooc';
    else if (isPM) return 'pm';
    else if (isEmote && !isOOC && !isFactionOOC && !isAttempt && !isRadio) return 'emote';
    else if (isAttempt) return 'attempt';
    else if (isDoorNoise) return 'doorNoise';
    else if (isToYou) return 'toYou';
    else if (isWhisper && !isCarWhisper) return 'whisper';
    else if (isCarWhisper) return 'carWhisper';
    else if (isSays && !isWhisper && !isLow && !isLower && !isCellphone) return 'says';
    else if (isShout) return 'shout';
    else if (isCellphone) return 'cellphone';
    else if (isLow) return 'low';
    else if (isLower) return 'lower';
    else if (isPhones) return 'phones';
    else if (isPhoneList) return 'phoneList';
    else if (/^Use \/smp/.test(trimmedText)) return 'useSmp';
    else if (isIncomingCall) return 'incomingCall';
    else if (isContacts) return 'contacts';
    else if (isContactEntry) return 'contactEntry';
    else if (isPhoneMessage) return 'phoneMessage';
    else if (isPhonePickup) return 'phonePickup';
    else if (isPhoneHangup) return 'phoneHangup';
    else if (/says \(phone\)/.test(trimmedText)) return 'phoneSays';
    else if (isMegaphone) return 'megaphone';
    else if (isIntercom) return 'intercom';
    else if (isReceivedItem || isGaveItem) return 'receivedItem';
    else if (isPlacingItem) return 'placingItem';
    else if (isTakingItem) return 'takingItem';
    else if (isUsedPanda || isGiftedPanda) return 'usedPanda';
    else if (/\(\(You've gifted/.test(trimmedText)) return 'giftedPandaOOC';
    else if (isBusinessClosed) return 'businessClosed';
    else if (isBusinessOpened) return 'businessOpened';
    else if (isSupportResets && !isInfo) return 'supportResets';
    else if (isAtLocation && !isInfo) return 'atLocation';
    else if (isCharacterChanged) return 'characterChanged';
    else if (isPleaseWait) return 'pleaseWait';
    else if (isMenuLink) return 'menuLink';
    else if (isViewMenu) return 'viewMenu';
    else if (isID) return 'id';
    else if (isVehicleParked) return 'vehicleParked';
    else if (isUnequipped) return 'unequipped';
    else if (isGettingMoney) return 'gettingMoney';
    else if (isDescription || isTattooDescription) return 'description';
    else if (isReceivingMoneyBank) return 'receivingMoneyBank';
    else if (isTakingMoneyContainer) return 'takingMoneyContainer';
    else if (isItemsHeader) return 'itemsHeader';
    else if (isItemLine) return 'itemLine';
    else if (isTotalWeight) return 'totalWeight';
    else if (isShowingItem) return 'showingItem';
    else if (isCharacterKill) return 'characterKill';
    else if (isDrugLab) return 'drugLab';
    else if (isNumberShareRequest) return 'numberShareRequest';
    else if (isSharedContact) return 'sharedContact';
    else if (isSendRequestShare) return 'sendRequestShare';
    else if (isYouSharedContact) return 'youSharedContact';
    else if (isPhoneRinging) return 'phoneRinging';
    else if (isSendingLocation) return 'sendingLocation';
    else if (isReceivedLocation) return 'receivedLocation';

    return 'default';
}

function applyColorClass(text, colorClass) {
    var temp = text;
    var isInfo = /\[INFO\]/.test(text);
    var isMainPhoneSet = /Main phone set to/.test(text);
    var isPattributes = /\/pattributes/.test(text) || /\/stashinfo/.test(text);
    var isStopAnim = /\.stop/.test(text) || /\/anim stop/.test(text);
    var isInvex = /\/invex/.test(text);
    var isScanComplete = /A scan is complete when you hear a beep/.test(text);
    var isBusinessIsOpen = /Business is:/.test(text);
    var isAtLocation = /You are at:/.test(text);
    var isSupportResets = /support resets on/.test(text);
    var isHonorSystem = /Honor System/.test(text);
    var isOrderedReceivedLine = /ordered and received/.test(text);
    var isItemDisplay = /Item .* is (no longer|now) displayed/.test(text);
    var isRadioEmote = /^\*\* \[S: \d+ \| CH: \d+\] \*/.test(text);
    var isAttempt = /attempt has (failed|succeeded)/i.test(text);
    var isPhoneList = /^\[\d+\]/.test(text);
    var isStats = /^Stats for /.test(text);
    var isTemperature = /Temperature:/.test(text);
    var isWind = /Wind:/.test(text);
    var isWeather = /Weather forecast:/.test(text);
    var isWelcome = /Welcome to GTA World/.test(text);
    var isPM = /PM from|PM to/.test(text);
    var isEmote = /^\s*\*/.test(text);
    var isWhisper = /whispers:/i.test(text) && !/\[low\]/.test(text) && !/\[lower\]/.test(text);
    var isCarWhisper = /\(car\).*whispers:/i.test(text);
    var isLow = /\[low\]/i.test(text);
    var isLower = /\[lower\]/i.test(text);
    var isSays = /says:/i.test(text) && !isWhisper && !isLow && !isLower;
    var isShout = /shouts:/i.test(text);
    var isCellphone = /\(cellphone\)/i.test(text);
    var isPhones = /^Phones:/.test(text);
    var isIncomingCall = /Incoming call from/.test(text);
    var isContacts = /^Contacts:/.test(text);
    var isContactEntry = / - (Online|Offline)$/.test(text);
    var isPhoneMessage = /^\(Main\)/.test(text) || /^\(iFruit/.test(text);
    var isPhonePickup = /Your call has been picked up/.test(text);
    var isPhoneHangup = /You have hung up the call/.test(text);
    var isMegaphone = /\[Megaphone\]/i.test(text);
    var isIntercom = /Intercom\]/i.test(text);
    var isReceivedItem = text.indexOf('You received ') === 0;
    var isGaveItem = text.indexOf('You gave ') === 0;
    var isPlacingItem = text.indexOf('You placed ') === 0;
    var isTakingItem = text.indexOf('You took ') === 0;
    var isUsedPanda = /used \d+ Panda Points/.test(text);
    var isGiftedPanda = /gifted \d+ Panda Points/.test(text);
    var isBusinessClosed = /business is now closed/.test(text);
    var isBusinessOpened = /business is now opened/.test(text);
    var isCharacterChanged = /changed their character/.test(text);
    var isPleaseWait = /Please wait while/.test(text);
    var isToYou = /^\[!\]/.test(text);
    var isMenuLink = /Menu link:/.test(text);
    var isViewMenu = /\/viewmenu/.test(text);
    var isID = /The ID of/.test(text);
    var isVehicleParked = /Vehicle parked/.test(text);
    var isUnequipped = /unequipped your weapon/.test(text);
    var isGettingMoney = /paid you \$/i.test(text);
    var isDescription = /___Description of .*___/.test(text);
    var isTattooDescription = /___Tattoos description of .*___/.test(text);
    var isReceivingMoneyBank = /received \$.* from .* on your bank account/i.test(text);
    var isTakingMoneyContainer = /^Info: You took \$/.test(text);
    var isItemsHeader = /\|-------- .* items --------\|/.test(text);
    var isItemLine = /^\d+:/.test(text);
    var isTotalWeight = /Total weight:/i.test(text);
    var isShowingItem = /has shown you their/i.test(text);
    var isCharacterKill = /\[Character kill\]/i.test(text);
    var isDrugLab = /\[DRUG LAB\]/i.test(text);
    var isNumberShareRequest = /has sent you a request to share their main phone number/i.test(text);
    var isSharedContact = /shared their contact called/i.test(text);
    var isSendRequestShare = /You sent a request to share your main phone number/i.test(text);
    var isYouSharedContact = /You've shared your contact called/i.test(text);
    var isPhoneRinging = /\[PHONE\].*ringing/i.test(text);
    var isSendingLocation = /successfully sent your current location/i.test(text);
    var isReceivedLocation = /received a location from #/i.test(text);
    var isTimeSpent = /^Time spent online/.test(text);
    var isWallet = /Wallet:/.test(text);
    var isHealth = /^Health \|/.test(text);
    var isOrganization = /^Organization:/.test(text);
    var isBankRouting = /Bank Account Routing:/.test(text);
    var isBusiness = /^Business \d+:/ .test(text);
    var isCurrentJob = /^Current job:/.test(text);
    var isTime = /^Time \|/.test(text);
    var isTimeOnShift = /^Time on shift:/.test(text);
    var isTruckingRank = /^Trucking rank:/.test(text);
    var isProperties = /^Properties:/.test(text);
    var isRentTotal = /^Rent total:/.test(text);
    var isCustomNumber = /^Custom Number:/.test(text);
    var isPremium = /^Premium:/.test(text);
    var isWorldPoints = /^World Points:/.test(text);
    var isPandaPoints = /^Panda Points:/.test(text);
    var isCurrentTime = /^Current Time:/.test(text);
    var isIllegalSupplier = /^Illegal Supplier-Status:/.test(text);
    var isSeparator = /^=+$/.test(text);

    switch (colorClass) {
        case 'highlighted':
            return '<span class="white">' + temp + '</span>';
        case 'payment':
            return '<span class="money">' + temp + '</span>';
        case 'infoColon':
            temp = temp.replace(/^\[INFO\]\:/g, '<span class="blue">[INFO]:</span>');
            temp = temp.replace(/\[\d{2}\/[A-Z]{3}\/\d{4}\]/g, '<span class="orange">$&</span>');
            if (isScanComplete) {
                temp = temp.replace(/K/g, '<span class="blue">K</span>');
                temp = temp.replace(/\/stopscan/g, '<span class="blue">/stopscan</span>');
            }
            return '<span class="white">' + temp + '</span>';
        case 'info':
            if (isMainPhoneSet) {
                temp = temp.replace(/\[INFO\]/g, '<span class="green">[INFO]</span>');
            } else {
                temp = temp.replace(/\[INFO\]/g, '<span class="blue">[INFO]</span>');
            }
            temp = temp.replace(/\[INFO\]\:/g, '<span class="blue">[INFO]:</span>');
            temp = temp.replace(/\[\d{2}\/[A-Z]{3}\/\d{4}\]/g, '<span class="orange">$&</span>');
            if (isPattributes) {
                temp = temp.replace(/\/pattributes/g, '<span class="yellow">/pattributes</span>');
                temp = temp.replace(/\/stashinfo/g, '<span class="yellow">/stashinfo</span>');
            }
            if (isStopAnim) {
                temp = temp.replace(/\.stop/g, '<span class="orange">.stop</span>');
                temp = temp.replace(/\/anim stop/g, '<span class="orange">/anim stop</span>');
            }
            if (isInvex) {
                temp = temp.replace(/\/invex/g, '<span class="yellow">/invex</span>');
            }
            if (isScanComplete) {
                temp = temp.replace(/K/g, '<span class="blue">K</span>');
                temp = temp.replace(/\/stopscan/g, '<span class="blue">/stopscan</span>');
            }
            if (isBusinessIsOpen) {
                temp = temp.replace(/Open/g, '<span class="green">Open</span>');
                temp = temp.replace(/Closed/g, '<span class="death">Closed</span>');
            }
            if (isAtLocation) {
                temp = temp.replace(/\$0\/\d+/g, '<span class="money">$&</span>');
            }
            if (isSupportResets) {
                temp = temp.replace(/(\d{2}\/[A-Z]{3}\/\d{4} - \d{2}:\d{2}:\d{2})/g, '<span class="blue">$1</span>');
            }
            if (isHonorSystem) {
                temp = temp.replace(/\$50/g, '<span class="money">$50</span>');
                temp = temp.replace(/\(\(/g, '<span class="grey">((</span>');
                temp = temp.replace(/\)\)/g, '<span class="grey">))</span>');
            }
            if (isOrderedReceivedLine) {
                temp = temp.replace(/\/invex/g, '<span class="yellow">/invex</span>');
                temp = temp.replace(/\(\/invex\)\s+(\d+)/g, '(<span class="yellow">/invex</span>) <span class="yellow">$1</span>');
            }
            return '<span class="white">' + temp + '</span>';
        case 'error':
            temp = temp.replace(/\[ERROR\]/g, '<span class="death">[ERROR]</span>');
            temp = temp.replace(/\/searchcmd/g, '<span class="yellow">/searchcmd</span>');
            return '<span class="white">' + temp + '</span>';
        case 'adminBan':
            return '<span class="death">' + temp + '</span>';
        case 'friendLogin':
            var friendMatch = text.match(/^\[FRIEND\]\s+(.*?)\s+has\s+(logged in\.?)/);
            if (friendMatch) {
                var namePart = friendMatch[1];
                var actionPart = friendMatch[2];
                return '<span class="blue">[FRIEND]</span> ' +
                    '<span class="white">' + namePart + '</span> ' +
                    '<span class="green">has ' + actionPart + '</span>';
            }
            temp = temp.replace(/\[FRIEND\]/g, '<span class="blue">[FRIEND]</span>');
            return '<span class="white">' + temp + '</span>';
        case 'globalOOC':
            return '<span class="grey">' + temp + '</span>';
        case 'tv':
            temp = temp.replace(/\[TV\]/g, '<span class="blue">[TV]</span>');
            temp = temp.replace(/\/fixtv/g, '<span class="yellow">/fixtv</span>');
            temp = temp.replace(/\/tvv/g, '<span class="yellow">/tvv</span>');
            return '<span class="white">' + temp + '</span>';
        case 'usage':
            temp = temp.replace(/\[USAGE\]/g, '<span class="blue">[USAGE]</span>');
            return '<span class="white">' + temp + '</span>';
        case 'xmRadio':
            temp = temp.replace(/\[XM Radio\]/g, '<span class="blue">[XM Radio]</span>');
            temp = temp.replace(/\/radioshow/g, '<span class="yellow">/radioshow</span>');
            return '<span class="white">' + temp + '</span>';
        case 'afkCheck':
            temp = temp.replace(/\[AFK CHECK\]/g, '<span class="death">[AFK CHECK]</span>');
            temp = temp.replace(/\/notafk/g, '<span class="blue">/notafk</span>');
            return '<span class="white">' + temp + '</span>';
        case 'delivery':
            temp = temp.replace(/\[Delivery\]/g, '<span class="blue">[Delivery]</span>');
            return '<span class="white">' + temp + '</span>';
        case 'success':
            temp = temp.replace(/\[SUCCESS\]/g, '<span class="green">[SUCCESS]</span>');
            return '<span class="white">' + temp + '</span>';
        case 'kick':
        case 'doorLocked':
        case 'commandNotFound':
        case 'businessWarning':
        case 'fixvehWarning':
        case 'makeSure':
        case 'leftArea':
        case 'warning':
        case 'smartTP':
        case 'expectedRoleplay':
        case 'noSignal':
        case 'takingItem':
        case 'businessClosed':
        case 'characterKill':
            return '<span class="death">' + temp + '</span>';
        case 'doorUnlocked':
        case 'withdrawn':
            return '<span class="green">' + temp + '</span>';
        case 'factionMembers':
        case 'onlineFactionMembers':
        case 'payphone':
        case 'number':
        case 'costs':
        case 'phoneCommands':
        case 'atm':
        case 'storeOpen':
        case 'vget':
        case 'recharge':
        case 'infoLine':
        case 'descriptionHeader':
        case 'intercom':
        case 'contacts':
        case 'useSmp':
            return '<span class="blue">' + temp + '</span>';
        case 'factionMemberList':
            return '<span class="grey">' + temp + '</span>';
        case 'factionCount':
        case 'ifYouWant':
        case 'routingNumber':
        case 'characterChanged':
        case 'pleaseWait':
        case 'id':
        case 'unequipped':
        case 'says':
        case 'shout':
        case 'phoneHangup':
        case 'default':
            return '<span class="white">' + temp + '</span>';
        case 'cursor':
        case 'blip':
        case 'viewMenu':
            return '<span class="yellow">' + temp + '</span>';
        case 'businessSupport':
            temp = temp.replace(/(You can get new support on:)/g, '<span class="white">$1</span>');
            temp = temp.replace(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/g, '<span class="blue">$1</span>');
            return temp;
        case 'itemDisplay':
            var itemMatch = text.match(/^Item (.*?) is (no longer|now) displayed(.*)/);
            if (itemMatch) {
                var itemName = itemMatch[1];
                var status = itemMatch[2];
                var rest = itemMatch[3] || '';
                return '<span class="blue">Item</span> ' +
                    '<span class="white">' + itemName + '</span> ' +
                    '<span class="blue">is ' + status + ' displayed' + rest + '</span>';
            }
            temp = temp.replace(/Item/g, '<span class="blue">Item</span>');
            return '<span class="white">' + temp + '</span>';
        case 'shiftStart':
        case 'paidIn':
            temp = temp.replace(/\[INFO\]/g, '<span class="blue">[INFO]</span>');
            return '<span class="white">' + temp + '</span>';
        case 'overcarry':
            temp = temp.replace(/\[OVERCARRY\]/g, '<span class="death">[OVERCARRY]</span>');
            return '<span class="white">' + temp + '</span>';
        case 'unlockedSafe':
            temp = temp.replace(/unlocked/g, '<span class="green">unlocked</span>');
            return '<span class="white">' + temp + '</span>';
        case 'lockStatus':
            temp = temp.replace(/LOCKED/g, '<span class="death">LOCKED</span>');
            return '<span class="white">' + temp + '</span>';
        case 'pricePerKWh':
            temp = temp.replace(/Price per kWh:/g, '<span class="blue">Price per kWh:</span>');
            temp = temp.replace(/\$[\d.]+/g, '<span class="money">$&</span>');
            return '<span class="white">' + temp + '</span>';
        case 'weaponEquip':
        case 'itemsHeader':
        case 'totalWeight':
            return '<span class="money">' + temp + '</span>';
        case 'attachment':
            return '<span class="white">' + temp + '</span>';
        case 'itemLine':
            temp = temp.replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g, '<span class="money">$$$1</span>');
            return '<span class="yellow">' + temp + '</span>';
        case 'attachmentsFound':
            temp = temp.replace(/\/detach/g, '<span class="yellow">/detach</span>');
            return '<span class="white">' + temp + '</span>';
        case 'radio':
            if (isRadioEmote) {
                temp = temp.replace(/^\*\* \[S: \d+ \| CH: \d+\]/, function(match) {
                    return '<span class="radio">' + match + '</span>';
                });
                temp = temp.replace(/\s+\* .*$/, function(match) {
                    return '<span class="me">' + match + '</span>';
                });
            } else {
                temp = '<span class="radio">' + temp + '</span>';
            }
            return temp;
        case 'radioNonStar':
            return '<span class="lightgrey">' + temp + '</span>';
        case 'stats':
            temp = temp.replace(/Stats for/g, '<span class="yellow">Stats for</span>');
            return '<span class="white">' + temp + '</span>';
        case 'wallet':
            temp = temp.replace(/Wallet:/g, '<span class="yellow">Wallet:</span>');
            temp = temp.replace(/Bank:/g, '<span class="yellow">Bank:</span>');
            temp = temp.replace(/Total Assets:/g, '<span class="yellow">Total Assets:</span>');
            temp = temp.replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g, '<span class="money">$$$1</span>');
            return '<span class="white">' + temp + '</span>';
        case 'health':
            temp = temp.replace(/Health/g, '<span class="yellow">Health</span>');
            return '<span class="white">' + temp + '</span>';
        case 'organization':
        case 'bankRouting':
        case 'business':
        case 'currentJob':
        case 'time':
        case 'timeOnShift':
        case 'truckingRank':
        case 'rentTotal':
        case 'customNumber':
        case 'illegalSupplier':
            temp = temp.replace(/^[^:]+:/g, function(match) {
                return '<span class="yellow">' + match + '</span>';
            });
            return '<span class="white">' + temp + '</span>';
        case 'properties':
            temp = temp.replace(/Properties:/g, '<span class="yellow">Properties:</span>');
            temp = temp.replace(/Owned:/g, '<span class="blue">Owned:</span>');
            temp = temp.replace(/Rented:/g, '<span class="blue">Rented:</span>');
            return '<span class="white">' + temp + '</span>';
        case 'premium':
            temp = temp.replace(/Premium:/g, '<span class="yellow">Premium:</span>');
            temp = temp.replace(/Furniture slots:/g, '<span class="yellow">Furniture slots:</span>');
            temp = temp.replace(/Wardrobe slots:/g, '<span class="yellow">Wardrobe slots:</span>');
            return '<span class="white">' + temp + '</span>';
        case 'worldPoints':
        case 'pandaPoints':
        case 'currentTime':
            temp = temp.replace(/^[^:]+:/g, '<span class="yellow">$&</span>');
            return '<span class="white">' + temp + '</span>';
        case 'timeSpent':
            var timeMatch = text.match(/^(Time spent online the past 30 days \(< 3 hour\(s\) = immediate property removal\): )(\d+ hours\.?)/);
            if (timeMatch) {
                var labelPart = timeMatch[1];
                var hoursPart = timeMatch[2];
                return '<span class="yellow">' + labelPart + '</span>' +
                    '<span class="white">' + hoursPart + '</span>';
            }
            temp = temp.replace(/(\d+ hours?)/g, '<span class="white">$1</span>');
            return '<span class="yellow">' + temp + '</span>';
        case 'separator':
            return '<span class="white">' + temp + '</span>';
        case 'temperature':
            temp = temp.replace(/(\d+\.?\d*°C)/g, '<span class="money">$1</span>');
            temp = temp.replace(/(\([\d.]+F\))/g, '<span class="money">$1</span>');
            temp = temp.replace(/(Sunny|Clear|Cloudy|Rainy|Stormy|Foggy)/g, '<span class="green">$1</span>');
            return '<span class="white">' + temp + '</span>';
        case 'wind':
            temp = temp.replace(/(\d+\.?\d* km\/h)/g, '<span class="money">$1</span>');
            temp = temp.replace(/(\([\d.]+ mph\))/g, '<span class="money">$1</span>');
            temp = temp.replace(/(\d+%)/g, '<span class="money">$1</span>');
            temp = temp.replace(/(\d+ mm)/g, '<span class="money">$1</span>');
            return '<span class="white">' + temp + '</span>';
        case 'weather':
            return '<span class="blue">' + temp + '</span>';
        case 'welcome':
            temp = temp.replace(/GTA World/g, '<span class="yellow">GTA World</span>');
            return '<span class="white">' + temp + '</span>';
        case 'ooc':
        case 'giftedPandaOOC':
            return '<span class="ooc">' + temp + '</span>';
        case 'pm':
            return '<span class="yellow">' + temp + '</span>';
        case 'emote':
        case 'attempt':
        case 'doorNoise':
            if (isAttempt) {
                var attemptMatch = text.match(/(.*?)(attempt has (failed|succeeded))((.*))/i);
                if (attemptMatch) {
                    var before = attemptMatch[1] || '';
                    var keyword = attemptMatch[2] || '';
                    var status = attemptMatch[3] || '';
                    var after = attemptMatch[4] || '';
                    var color = status.toLowerCase() === 'failed' ? 'death' : 'green';
                    return '<span class="me">' + before + '</span>' +
                        '<span class="' + color + '">' + keyword + '</span>' +
                        '<span class="me">' + after + '</span>';
                }
            }
            return '<span class="me">' + temp + '</span>';
        case 'whisper':
            return '<span class="whisper">' + temp + '</span>';
        case 'carWhisper':
            return '<span class="carwhisper">' + temp + '</span>';
        case 'low':
            return '<span class="grey">' + temp + '</span>';
        case 'lower':
            return '<span class="darkgrey">' + temp + '</span>';
        case 'phones':
            temp = temp.replace(/Phones:/g, '<span class="blue">Phones:</span>');
            return '<span class="white">' + temp + '</span>';
        case 'phoneList':
            var phoneIndex = '';
            var phoneRest = '';
            var indexMatch = text.match(/^(\[\d+\])\s*/);
            if (indexMatch) {
                phoneIndex = indexMatch[1];
                phoneRest = text.substring(indexMatch[0].length);
            } else {
                phoneIndex = text;
                phoneRest = '';
            }
            var result = '';
            result += '<span class="blue">' + phoneIndex + '</span> ';
            var parts = phoneRest.split(/(\(ON\))/g);
            var finalParts = [];
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] === '(ON)') {
                    finalParts.push('<span class="green">(ON)</span>');
                } else {
                    var subParts = parts[i].split(/(\(Main\))/g);
                    for (var j = 0; j < subParts.length; j++) {
                        if (subParts[j] === '(Main)') {
                            finalParts.push('<span class="green">(Main)</span>');
                        } else if (subParts[j]) {
                            finalParts.push('<span class="white">' + subParts[j] + '</span>');
                        }
                    }
                }
            }
            result += finalParts.join('');
            return result;
        case 'incomingCall':
            var phoneMatch = temp.match(/^\(([^)]+)\)/);
            if (phoneMatch) {
                temp = temp.replace(/^\(([^)]+)\)/, '<span class="yellow">($1)</span>');
            }
            
            var callerMatch = temp.match(/Incoming call from\s+([A-Za-z][A-Za-z\s]+?)(?=\s*\.\s*Use|\.\s*$|$)/);
            if (callerMatch) {
                var callerName = callerMatch[1].trim();
                temp = temp.replace('Incoming call from ' + callerName, 'Incoming call from <span class="yellow">' + callerName + '</span>');
            }
            
            temp = temp.replace(/Incoming call from/g, '<span class="white">Incoming call from</span>');
            temp = temp.replace(/\. Use/g, '<span class="white">. Use</span>');
            temp = temp.replace(/\((\/p)ickup\)/g, '<span class="white">(<span class="yellow">/p</span>ickup)</span>');
            temp = temp.replace(/\((\/h)angup\)/g, '<span class="white">(<span class="yellow">/h</span>angup)</span>');
            temp = temp.replace(/to answer or/g, '<span class="white">to answer or</span>');
            temp = temp.replace(/to decline\./g, '<span class="white">to decline.</span>');
            
            return temp;
        case 'cellphone':
        case 'phoneSays':
        case 'phonePickup':
            return '<span class="yellow">' + temp + '</span>';
        case 'contactEntry':
            temp = temp.replace(/ - Online/g, '<span class="green"> - Online</span>');
            temp = temp.replace(/ - Offline/g, '<span class="death"> - Offline</span>');
            return '<span class="white">' + temp + '</span>';
        case 'phoneMessage':
            return '<span class="orange">' + temp + '</span>';
        case 'megaphone':
            return '<span class="megafon">' + temp + '</span>';
        case 'receivedItem':
        case 'placingItem':
        case 'gettingMoney':
            return '<span class="money">' + temp + '</span>';
        case 'usedPanda':
            temp = temp.replace(/\d+ Panda Points/g, '<span class="money">$&</span>');
            return '<span class="white">' + temp + '</span>';
        case 'businessOpened':
            temp = temp.replace(/opened/g, '<span class="green">opened</span>');
            return '<span class="white">' + temp + '</span>';
        case 'supportResets':
            temp = temp.replace(/\d{2}\/[A-Z]{3}\/\d{4} - \d{2}:\d{2}:\d{2}/g, '<span class="blue">$&</span>');
            return '<span class="white">' + temp + '</span>';
        case 'atLocation':
            temp = temp.replace(/\$0\/\d+/g, '<span class="money">$&</span>');
            return '<span class="white">' + temp + '</span>';
        case 'toYou':
            if (/\[low\]/.test(temp)) {
                temp = temp.replace(/\[!\]/g, '<span class="toyou">[!]</span>');
                return '<span class="grey">' + temp + '</span>';
            } else if (/\[lower\]/.test(temp)) {
                temp = temp.replace(/\[!\]/g, '<span class="toyou">[!]</span>');
                return '<span class="darkgrey">' + temp + '</span>';
            } else if (/shouts:/i.test(temp)) {
                temp = temp.replace(/\[!\]/g, '<span class="toyou">[!]</span>');
                return '<span class="white">' + temp + '</span>';
            } else {
                temp = temp.replace(/\[!\]/g, '<span class="toyou">[!]</span>');
                return '<span class="white">' + temp + '</span>';
            }
        case 'menuLink':
            temp = temp.replace(/Menu link:/g, '<span class="yellow">Menu link:</span>');
            temp = temp.replace(/(https?:\/\/[^\s]+)/g, '<span class="blue">$1</span>');
            return '<span class="white">' + temp + '</span>';
        case 'vehicleParked':
            return '<span class="green">' + temp + '</span>';
        case 'description':
            return '<span class="blue">' + temp + '</span>';
        case 'receivingMoneyBank':
        case 'takingMoneyContainer':
            temp = temp.replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g, '<span class="money">$$$1</span>');
            return '<span class="white">' + temp + '</span>';
        case 'showingItem':
            temp = temp.replace(/(has shown you their)/i, '<span class="money">$1</span>');
            return '<span class="white">' + temp + '</span>';
        case 'drugLab':
            temp = temp.replace(/\[DRUG LAB\]/i, '<span class="orange">[DRUG LAB]</span>');
            return '<span class="white">' + temp + '</span>';
        case 'numberShareRequest':
        case 'sharedContact':
        case 'sendRequestShare':
        case 'youSharedContact':
            temp = temp.replace(/\[INFO\]/g, '<span class="blue">[INFO]</span>');
            temp = temp.replace(/(#\d+)/g, '<span class="money">$1</span>');
            temp = temp.replace(/\/acceptnumber/g, '<span class="blue">/acceptnumber</span>');
            temp = temp.replace(/\/declinenumber/g, '<span class="blue">/declinenumber</span>');
            temp = temp.replace(/\/acceptcontact/g, '<span class="yellow">/acceptcontact</span>');
            temp = temp.replace(/\/declinecontact/g, '<span class="yellow">/declinecontact</span>');
            var nameMatch = temp.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
            if (nameMatch) {
                temp = temp.replace(nameMatch[1], '<span class="yellow">' + nameMatch[1] + '</span>');
            }
            return '<span class="white">' + temp + '</span>';
        case 'phoneRinging':
            temp = temp.replace(/(PHONE NAME HERE|Your PHONE NAME HERE)/g, '<span class="yellow">$1</span>');
            temp = temp.replace(/\/pickup/g, '<span class="yellow">/pickup</span>');
            temp = temp.replace(/\/hangup/g, '<span class="yellow">/hangup</span>');
            temp = temp.replace(/\/phonecursor/g, '<span class="yellow">/phonecursor</span>');
            temp = temp.replace(/\/pc/g, '<span class="yellow">/pc</span>');
            return '<span class="white">' + temp + '</span>';
        case 'sendingLocation':
            return '<span class="money">' + temp + '</span>';
        case 'receivedLocation':
            temp = temp.replace(/#\d+/g, '<span class="orange">$&</span>');
            temp = temp.replace(/\/removelocation/g, '<span class="death">/removelocation</span>');
            return '<span class="money">' + temp + '</span>';
        default:
            return '<span class="white">' + temp + '</span>';
    }
}

$(document).ready(function() {
    window.renderChatlog = renderChatlog;

    initColorPicker();
    initHighlightSystem();
    initBackgroundControls();
    initCensorSystem();

    var charName = $("#name").val().toLowerCase();
    var t = $.jStorage.get("lastCharName") || "";
    $("#name").val(t);
    $("#name").bind("input propertychange", function() {
        var name = $("#name").val().toLowerCase();
        $.jStorage.set("lastCharName", name);
        renderChatlog();
    });

    var fontSize = $.jStorage.get("lastFontSize") || 12;
    $(".output").css("font-size", fontSize + "px");
    $("#font-label").text("font size (" + fontSize + "px):");

    $("input[name='font-label']").bind("input propertychange", function() {
        var newSize = parseInt($(this).val());
        if (newSize >= 10 && newSize <= 64) {
            $(".output").css("font-size", newSize + "px");
            $("#font-label").text("font size (" + newSize + "px):");
            $.jStorage.set("lastFontSize", newSize);
        }
    });

    var lineWrap = $.jStorage.get("lastLineWrap") || 70;
    $("#line-break").val(lineWrap);

    $("#line-break").bind("input propertychange", function() {
        var newWrap = parseInt($(this).val()) || 70;
        if (newWrap >= 20 && newWrap <= 200) {
            $.jStorage.set("lastLineWrap", newWrap);
            renderChatlog();
        }
    });

    $("textarea").bind("input propertychange", function() {
        renderChatlog();
    });

    renderChatlog();
});