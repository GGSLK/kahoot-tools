var kahoot = null;
var runningTimer = null;
var proxy = 'http://' + window.location.hostname + ':8080/';

$(function () {
    if (typeof (Storage) !== "undefined") {
        kahoot = new Kahoot(null, null, proxy);
        if (!localStorage.token && !localStorage.tokenExpiration) {
            $('#kahoot-web-login').show();
        } else {
            if (localStorage.tokenExpiration < new Date().getTime()) {
                $('#kahoot-web-login').show();
                localStorage.removeItem('token');
                localStorage.removeItem('tokenExpiration');
            } else {
                kahoot.bearerToken = localStorage.token;
                $('#kahoot-web-login-text').text('Kahoot logged in: ' + localStorage.token);
            }
        }
    } else {
        alert('This website will not work on this browser. If you are in private mode please leave!');
        $('html').html('Please use a more up-to-date browser.');
    }
});

$('#activate-pin').click(function () {
    var originalText = $('#activate-pin').text();
    $('#activate-pin').text('Testing connection...').prop('disabled', function (i, v) {
        return !v;
    });
    let username = $('#kahoot-username').val();
    let password = $('#kahoot-password').val();
    kahoot.pin = $('#pin').val();
    kahoot.name = $('#name').val();
    if (username || password) {
        kahoot.getBearerToken(username, password, function (bearer) {
            if (!bearer.error) {
                localStorage.setItem('token', bearer.bearerToken);
                localStorage.setItem('tokenExpiration', bearer.expiration);
                if (!localStorage.token && !localStorage.tokenExpiration) {
                    $('#kahoot-web-login').show();
                } else {
                    if (localStorage.tokenExpiration < new Date().getTime()) {
                        $('#kahoot-web-login').show();
                        localStorage.removeItem('token');
                        localStorage.removeItem('tokenExpiration');
                    } else {
                        kahoot.bearerToken = localStorage.token;
                        $('#kahoot-web-login').fadeOut();
                    }
                }
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
            } else {
                sendMessage('error', 'Error', bearer.error);
                $('#activate-pin').animation('shake');
                $('#activate-pin').text(originalText).prop('disabled', function (i, v) {
                    return !v;
                });
            }
        });
    } else {
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
    }
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

$('#send-correct-answer-btn').click(function () {
    if (!kahoot.quizName) {
        sendMessage('warning', 'Warning', 'Dont have a quiz name... Did you join after the quiz started?');
    } else {
        if (kahoot.questionNum === null) {
            sendMessage('warning', 'Warning', 'Dont have a question num yet... Did the quiz start?');
        } else {
            if (!kahoot.answers) {
                kahoot.getGameAnswers(kahoot.quizName, function (data) {
                    if (!data.error) {
                        kahoot.sendGameAnswer(data.answers[kahoot.questionNum].answerNum);
                    } else {
                        sendMessage('error', 'Error', data.error);
                    }
                });
            } else {
                kahoot.sendGameAnswer(kahoot.answers[kahoot.questionNum].answerNum);
            }
        }
    }
});

$('#changelog-button').click(function () {
    openModal('changelog.html');
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

function openModal(html) {
    let id = makeId();
    $('body').append('<div class="overlay" style="display: none;" onclick="$(\'#' + id + '\').fadeOut(function(){$(\'#' + id + '\').remove()})" id="' + id + '"></div>');
    $('#' + id).fadeIn();
    $.get(html, function (data) {
        $('#' + id).append(data);
    })
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