var kahoot = null;
var runningTimer = null;
var proxy = 'http://' + window.location.hostname + ':8080/';
$('#activate-pin').click(function () {
    var originalText = $('#activate-pin').text();
    $('#activate-pin').text('Testing connection...').prop('disabled', function (i, v) {
        return !v;
    });
    kahoot = new Kahoot($('#pin').val(), $('#name').val(), proxy);
    kahoot.connect(function (success) {
        $('#activate-pin').prop('disabled', function (i, v) {
            return !v;
        });
        if (success) {
            let waitTillActive = setInterval(function () {
                if (kahoot.state === 1) {
                    clearInterval(waitTillActive);
                    kahoot.bruteForceTwoFactor();
                    $('#login-panel').fadeOut(500, function () {
                        updateSessionText();
                        $('#control-panel').fadeIn(500);
                    });
                } else if (kahoot.state === 3 && kahoot.error) {
                    sendMessage('warning', 'Error', kahoot.error);
                    $('#activate-pin').animation('shake');
                    $('#activate-pin').text(originalText);
                    clearInterval(waitTillActive);
                }
            }, 100)
        } else {
            sendMessage('warning', 'Error', 'Pin incorrect');
            $('#activate-pin').animation('shake');
            $('#activate-pin').text(originalText);
        }
    });
});

$('#crash-btn').click(function () {
    if (runningTimer) {
        clearInterval(runningTimer);
        runningTimer = null;
    } else {
        runningTimer = setInterval(function () {
            for (var i = 0; i < 2500; i++) {
                if (runningTimer) {
                    kahoot.sendGameAnswer(0);
                }
            }
        }, 1);
    }
});

$('#answer-0').click(function () {
    kahoot.sendGameAnswer(0);
});

$('#answer-1').click(function () {
    kahoot.sendGameAnswer(1);
});

$('#answer-2').click(function () {
    kahoot.sendGameAnswer(2);
});

$('#answer-3').click(function () {
    kahoot.sendGameAnswer(3);
});

$('#changelog-button').click(function() {
    $('body').append('<div class="overlay" style="display: none;" onclick="$(\'#changelog-overlay\').fadeOut(function(){$(\'#changelog-overlay\').remove()})" id="changelog-overlay"></div>');
    $('#changelog-overlay').fadeIn();
    $.get('changelog.html', function(data) {
        $('#changelog-overlay').append(data);
    })
});

function updateSessionText() {
    $('#pin-display').text('Pin: ' + kahoot.pin + ' - Name: ' + kahoot.name);
}

function makeId() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function sendMessage(type, title, content, closeTime = 2500) {
    let inv = type === 'warning' || type === '' ? '' : 'inverted';
    let id = makeId();
    var msg = '<div id="' + id + '" class="message ' + type + '" data-component="message"><h5 class="' + inv + '">' + title + '</h5>' + content + '<span class="close small"></span></div>';
    $('#message-container').prepend(msg);
    $('#message-container #' + id).message({
        animationClose: 'slideUp'
    }).fadeOut(0).fadeIn().on('closed.message', function () {
        this.$element.remove();
    });
    setTimeout(function () {
        $('#message-container #' + id).message('close');
    }, closeTime);
    return $('#message-container #' + id);
}