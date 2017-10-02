var kahoot = null;
var runningTimer = null;
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
                $('#kahoot-web-login-text').text('Kahoot logged in: ' + localStorage.token);
            }
        }
    } else {
        alert('This website will not work on this browser. If you are in private mode please leave!');
        $('html').html('Please use a more up-to-date browser or exit private mode on iOS!');
    }
});

$('#activate-pin').click(function () {
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
                        $('#kahoot-web-login-text').text('Kahoot logged in: ' + localStorage.token);
                        $('#activate-pin').prop('disabled', function (i, v) {
                            return !v;
                        });
                    }
                }
                connect();
            } else {
                sendMessage('error', 'Error', bearer.error);
                $('#activate-pin').animation('shake');
                $('#activate-pin').text(originalText).prop('disabled', function (i, v) {
                    return !v;
                });
            }
        });
    } else {
        connect();
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
    kahoot.sendGameAnswer(0, function (data) {
        if (data.final) {
            if (data.correct) {
                showControlPanel();
            } else {
                resetTwoFactor();
            }
        }
    });
});

$('#answer-1').click(function () {
    kahoot.sendGameAnswer(1, function (data) {
        if (data.final) {
            if (data.correct) {
                showControlPanel();
            } else {
                resetTwoFactor();
            }
        }
    });
});

$('#answer-2').click(function () {
    kahoot.sendGameAnswer(2, function (data) {
        if (data.final) {
            if (data.correct) {
                showControlPanel();
            } else {
                resetTwoFactor();
            }
        }
    });
});

$('#answer-3').click(function () {
    kahoot.sendGameAnswer(3, function (data) {
        if (data.final) {
            if (data.correct) {
                showControlPanel();
            } else {
                resetTwoFactor();
            }
        }
    });
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

function resetTwoFactor() {
    $('.twofactorcard').prop('disabled', false);
}

function addToTwoFactorCode(code) {
    twofactorCode = twofactorCode + code;
    if (twofactorCode.length === 4) {
        kahoot.twoFactorLogin(twofactorCode);
        let waitTillActive = setInterval(function () {
            console.log(kahoot.state)
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

function connect() {
    let originalText = $('#activate-pin').text();
    kahoot.connect(function (response) {
        $('#activate-pin').prop('disabled', function (i, v) {
            return !v;
        });
        if (response.success) {
            let waitTillActive = setInterval(function () {
                if (kahoot.state === 1) {
                    clearInterval(waitTillActive);
                    //kahoot.bruteForceTwoFactor();
                    if (kahoot.twoFactor) {
                        openModal('2fa.html', false, function() {
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
                    sendMessage('warning', 'Error', kahoot.error);
                    $('#activate-pin').animation('shake');
                    $('#activate-pin').text(originalText);
                }
            }, 100)
        } else {
            sendMessage('warning', 'Error', 'Pin incorrect');
            $('#activate-pin').animation('shake');
            $('#activate-pin').text(originalText);
        }
    });
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
    $('.overlay').fadeOut(function(){$('.overlay').remove()});
}

function openModal(html, closable = true, callback) {
    let id = makeId();
    let closeCode = closable ? 'onclick="$(\'#' + id + '\').fadeOut(function(){$(\'#' + id + '\').remove()})"' : '';
    $('body').append('<div class="overlay" style="display: none;" ' + closeCode + ' id="' + id + '"></div>');
    $('#' + id).fadeIn();
    $.get(html, function (data) {
        $('#' + id).append(data);
        if(typeof callback === 'function') {
            callback();
        }
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