var kahoot = null;
var runningTimers = [];
var twofactorCode = '';
var proxy = 'http://' + window.location.hostname + ':8080/';

$(function () {
    if (typeof (Storage) !== "undefined" && doesWebStorageWork()) {
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
                $('#kahoot-username').remove();
                $('#kahoot-password').remove();
                $('#kahoot-web-login-text').text('Kahoot logged in: ' + localStorage.token);
            }
        }
    } else {
        alert('This website will not work on this browser. If you are in private mode please leave!');
        $('html').html('Please use a more up-to-date browser or exit private mode on iOS!');
    }
});

$('#activate-pin').click(function () {
    let originalText = $('#activate-pin').text();
    let username = $('#kahoot-username').val();
    let password = $('#kahoot-password').val();
    kahoot.pin = $('#pin').val();
    kahoot.name = $('#name').val();
    if (username || password) {
        $('#activate-pin').text('Testing connection...').prop('disabled', function (i, v) {
            return !v;
        });
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
                        $('#kahoot-web-login-text').text('Kahoot logged in: ' + localStorage.token);
                        $('#activate-pin').prop('disabled', function (i, v) {
                            return !v;
                        });
                    }
                }
                $('#activate-pin').text(originalText).prop('disabled', function (i, v) {
                    return !v;
                });
                connect();
            } else {
                sendMessage('kahoot-color-0', 'Error', bearer.error);
                $('#activate-pin').animation('shake');
                $('#activate-pin').text(originalText).prop('disabled', function (i, v) {
                    return !v;
                });
            }
        });
    } else {
        if (kahoot.pin && kahoot.name) {
            connect();
        } else {
            $('#activate-pin').text(originalText).prop('disabled', function (i, v) {
                return !v;
            });
            sendMessage('kahoot-color-0', 'Error', 'No pin or name supplied!');
        }
    }
});


function connect() {
    let originalText = $('#activate-pin').text();
    $('#activate-pin').text('Testing connection...').prop('disabled', true);
    kahoot.connect(function (response) {
        if (response.success) {
            let waitTillActive = setInterval(function () {
                if (kahoot.state === 1) {
                    clearInterval(waitTillActive);
                    //kahoot.bruteForceTwoFactor();
                    if (kahoot.twoFactor) {
                        openModal('2fa.html', false, function () {
                            $('#twofactor-btn-0').click(function () {
                                $('#twofactor-btn-0').prop('disabled', true);
                                addToTwoFactorCode(0);
                            });

                            $('#twofactor-btn-1').click(function () {
                                $('#twofactor-btn-1').prop('disabled', true);
                                addToTwoFactorCode(1);
                            });

                            $('#twofactor-btn-2').click(function () {
                                $('#twofactor-btn-2').prop('disabled', true);
                                addToTwoFactorCode(2);
                            });

                            $('#twofactor-btn-3').click(function () {
                                $('#twofactor-btn-3').prop('disabled', true);
                                addToTwoFactorCode(3);
                            });
                        });
                    } else {
                        showControlPanel();
                    }
                } else if (kahoot.state === 3 && kahoot.error) {
                    clearInterval(waitTillActive);
                    sendMessage('kahoot-color-0', 'Error', kahoot.error);
                    $('#activate-pin').animation('shake');
                    $('#activate-pin').text(originalText).prop('disabled', function (i, v) {
                        return !v;
                    });
                }
            }, 100)
        } else {
            sendMessage('kahoot-color-0', 'Error', 'Pin incorrect');
            $('#activate-pin').animation('shake');
            $('#activate-pin').text(originalText).prop('disabled', function (i, v) {
                return !v;
            });
        }
    });
}

$('#crash-btn').click(function () {
    if (runningTimers.length >= 1) {
        for (var i = 0; i < runningTimers.length; i++) {
            clearInterval(runningTimers[i])
        }
        runningTimers = [];
    } else {
        for (var i = 0; i < 10; i++) {
            runningTimers.push(setInterval(function () {
                kahoot.sendGameAnswer(1)
            }, 0.00001));
        }
    }
});

$('#answer-0').click(function () {
    kahoot.sendGameAnswer(0, function (data) {

    });
});

$('#answer-1').click(function () {
    kahoot.sendGameAnswer(1, function (data) {

    });
});

$('#answer-2').click(function () {
    kahoot.sendGameAnswer(2, function (data) {

    });
});

$('#answer-3').click(function () {
    kahoot.sendGameAnswer(3, function (data) {

    });
});

$('#send-correct-answer-btn').click(function () {
    if (!kahoot.quizName) {
        sendMessage('kahoot-color-2', 'Warning', 'Dont have a quiz name... Did you join after the quiz started?');
    } else {
        if (kahoot.questionNum === null) {
            sendMessage('kahoot-color-2', 'Warning', 'Dont have a question num yet... Did the quiz start?');
        } else {
            if (!kahoot.answers) {
                kahoot.getGameAnswers(kahoot.quizName, function (data) {
                    if (!data.error) {
                        kahoot.sendGameAnswer(data.answers[kahoot.questionNum].answerNum);
                    } else {
                        sendMessage('kahoot-color-1', 'Error', data.error);
                    }
                });
            } else {
                kahoot.sendGameAnswer(kahoot.answers[kahoot.questionNum].answerNum);
            }
        }
    }
});

$('#flood-btn').click(function () {
    let bots = $('#bot-amount').val();
    let name = $('#bot-name-prefix').val();
    if (bots) {
        for (var i = 0; i <= bots; i++) {
            new Kahoot(kahoot.pin, name + i, proxy).connect(function () {

            });
        }
        sendMessage("kahoot-color-3", "Success", "Successfully sent " + bots + " bots!");
    } else {
        sendMessage("kahoot-color-2", "Error", "No bot amount specified")
    }
});

$('#changelog-button').click(function () {
    openModal('changelog.html');
});

function resetTwoFactor() {
    $('.twofactorcard').prop('disabled', false);
}

function addToTwoFactorCode(code) {
    twofactorCode = twofactorCode + code;
    if (twofactorCode.length === 4) {
        kahoot.twoFactorLogin(twofactorCode);
        let waitTillActive = setInterval(function () {
            if (kahoot.state === 1) {
                clearInterval(waitTillActive);
                showControlPanel();
                closeAllModals();

            } else if (kahoot.state === 2) {
                clearInterval(waitTillActive);
                kahoot.state = 0;
                twofactorCode = '';
                resetTwoFactor();
            }
        }, 100)
    } else {
        if (typeof callback === 'function') {
            callback({
                final: false,
                correct: false
            });
        }
    }
}

function showControlPanel() {
    $('#login-panel').fadeOut(500, function () {
        updateSessionText();
        $('#control-panel').fadeIn(500);
    });
}

function doesWebStorageWork() {
    try {
        let id = makeId();
        localStorage.setItem('check-' + id, '1');
        localStorage.removeItem('check-' + id);
        return true;
    } catch (e) {
        return false;
    }
}

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

function closeAllModals() {
    $('.overlay').fadeOut(function () {
        $('.overlay').remove()
    });
}

function openModal(html, closable = true, callback) {
    let id = makeId();
    let closeCode = closable ? 'onclick="$(\'#' + id + '\').fadeOut(function(){$(\'#' + id + '\').remove()})"' : '';
    $('body').prepend('<div class="overlay" style="display: none;" ' + closeCode + ' id="' + id + '"></div>');
    $('#' + id).fadeIn();
    $.get(html, function (data) {
        $('#' + id).append(data);
        if (typeof callback === 'function') {
            callback();
        }
    })
}

function sendMessage(color = 'indigo darken-1', title, content, closeTime = 2500) {
    let id = makeId();
    var msg = '<div id="' + id + '" class="card ' + color + '"><div class="card-content white-text"><span class="card-title">' + title + '</span><p>' + content + '</p></div></div>';
    $('#message-container').prepend(msg);
    $('#message-container #' + id).slideUp(0).slideDown().click(function () {
        $('#message-container #' + id).slideUp(function () {
            $('#message-container #' + id).remove();
        });
    })

    setTimeout(function () {
        $('#message-container #' + id).slideUp(function () {
            $('#message-container #' + id).remove();
        });
    }, closeTime);
    return $('#message-container #' + id);
}