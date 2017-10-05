class Kahoot {
    constructor(pin, name, proxy = '', url = 'https://www.kahoot.it') {
        this.pin = pin;
        this.name = name;
        this.proxy = proxy;
        this.apiUrl = this.proxy + url;
        this.cometdUrl = 'wss://kahoot.it/cometd';
        this.cometd = null;
        this.answers = null;
        this.questionNum = null;
        this.state = 0;
        this.quizName = '';
        this.solvedChallenge = '';
        this.session = '';
        this.clientId = '';
        this.rawSession = '';
        this.bearerToken = '';
        this.error = '';

        //LISTENER CALLBACKS:
        this.onRawMessageController = function (m) {};
        this.onRawMessagePlayer = function (m) {};
        this.onRawMessageStatus = function (m) {};

        this.http = new class HTTP {
            constructor() {

            }

            get(url, args, callback) {
                const xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        callback(this);
                    }
                };
                xhttp.open("GET", url, true);
                if (args) {
                    if (args.headers) {
                        for (let i = 0; i < args.headers.length; i++) {
                            xhttp.setRequestHeader(args.headers[i].split(':')[0], args.headers[i].split(':')[1]);
                        }
                    }
                }
                xhttp.send();
            }

            post(url, args, callback) {
                const xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        callback(this);
                    }
                };
                xhttp.open("POST", url, true);
                if (args) {
                    if (args.headers) {
                        for (let i = 0; i < args.headers.length; i++) {
                            xhttp.setRequestHeader(args.headers[i].split(':')[0], args.headers[i].split(':')[1]);
                        }
                    }
                }
                xhttp.send(args.data);
            }
        }();
    }

    //RUN CONNECT CYCLE
    connect(callback) {
        let _this = this;
        this.testSession(function (existence) {
            if (existence) {
                _this.createWebsocket(function () {
                    _this.doLogin(function () {
                        callback({
                            success: true,
                            error: null,
                            twoFactor: _this.twoFactor
                        });
                    });
                });
            } else {
                callback({
                    success: false,
                    error: 'No Session!',
                    twoFactor: _this.twoFactor
                });
            }
        });
    }

    //OPTIONAL FUN FUNCTIONS

    //getBearerToken - gets bearer token by loggin in to kahoot, returns (callback) object
    getBearerToken(username, password, callback) {
        let _this = this;
        let formData = '';
        let headers = [];
        headers.push('x-kahoot-login-gate:enabled');
        headers.push('Content-Type:application/json');

        formData = {
            username: username,
            password: password,
            grant_type: 'password'
        }
        formData = JSON.stringify(formData);
        this.http.post(this.proxy + 'https://create.kahoot.it/rest/authenticate', {
            data: formData,
            headers: headers
        }, function (data) {
            if (data.status !== 401) {
                let json = JSON.parse(data.response);
                if (typeof callback === 'function') {
                    if (json.access_token) {
                        _this.bearerToken = json.access_token;
                        callback({
                            error: null,
                            bearerToken: json.access_token,
                            expiration: json.expires
                        });
                    } else {
                        callback({
                            error: 'Auth failed, wrong username or password!'
                        });
                    }
                }
            } else {
                if (typeof callback === 'function') {
                    callback({
                        error: 'Auth failed, wrong username or password!'
                    });
                }
            }
        });
    }

    //Get the answers of a kahoot game by name - returns (callback) answers
    getGameAnswers(gameName, callback) {
        let _this = this;
        if (!this.answers) {
            let headers = [];
            headers.push('Authorization: Bearer ' + this.bearerToken);
            this.http.get(this.proxy + 'https://create.kahoot.it/rest/kahoots/search/public?query=' + gameName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'') + '&limit=100' + '&_=' + new Date().getTime(), {
                headers: headers
            }, function (data) {
                let json = JSON.parse(data.response);
                let answers = [];
                let currEntity = 0;
                if (json.totalHits > 0) {
                    for (var e = 0; e < json.entities.length; e++) {
                        if (json.entities[e].title === gameName) {
                            currEntity = e;
                        }
                    }
                    json = json.entities[currEntity];
                    console.log(json)
                    for (var i = 0; i < json.questions.length; i++) {
                        for (var a = 0; a < json.questions[i].choices.length; a++) {
                            if (json.questions[i].choices[a].correct === true) {
                                answers[i] = {
                                    questionNum: i,
                                    question: json.questions[i].question,
                                    answer: json.questions[i].choices[a],
                                    answerNum: a
                                };
                            }
                        }
                    }
                    _this.answers = answers;
                    callback({
                        error: null,
                        answers: answers
                    })
                } else {
                    if (typeof callback === 'function') {
                        callback({
                            error: 'No games found!'
                        });
                    }
                }
            });
        } else {
            callback({
                error: null,
                answers: _this.answers
            });
        }
    }

    //MAIN GAME FUNCTIONS
    sendGameAnswer(answerId) {
        this.cometd.publish('/service/controller', {
            id: 45,
            type: 'message',
            gameid: this.pin,
            host: 'kahoot.it',
            content: "{\"choice\":" + answerId + ",\"meta\":{\"lag\":15,\"device\":{\"userAgent\":\"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/61.0.3163.79 Chrome/61.0.3163.79 Safari/537.36\",\"screen\":{\"width\":1440,\"height\":870}}}}"
        }, function (publishAck) {});
    }


    //MAIN CONNECTION FUNCTIONS

    //bruteForceTwoFactor - tries to bruteforce the two factor auth code. pretty easy because of only 24 possibilities.
    bruteForceTwoFactor() {
        let combinations = ['0123', '0132', '0213', '0231', '0321', '0312', '1023', '1032', '1203', '1230', '1302', '1320', '2013', '2031', '2103', '2130', '2301', '2310', '3012', '3021', '3102', '3120', '3201', '3210']
        for (var i = 0; i < combinations.length; i++) {
            this.twoFactorLogin(combinations[i]);
        }
    }

    //twoFactorLogin - tries to login with two factor code, doesnt return anything. Success is handled at main player loop.
    twoFactorLogin(code) {
        this.cometd.publish('/service/controller', {
            id: 50,
            type: 'message',
            gameid: this.pin,
            host: 'kahoot.it',
            content: '{"sequence": "' + code + '"}'
        }, function (publishAck) {});
    }

    //doLogout - returns (callback) boolean success
    doLogout(callback) {
        this.state = 0;
        this.cometd.disconnect(function () {
            if (typeof callback === 'function') {
                callback(true);
            }
        });
    }

    //doLogin - returns (callback) boolean success
    doLogin(callback) {
        this.cometd.publish('/service/controller', {
            gameid: this.pin,
            host: 'kahoot.it',
            name: this.name,
            type: 'login'
        }, function (publishAck) {
            if (typeof callback === 'function') {
                callback(true);
            }
        });
    }

    //createWebsocket (startSession) - returns (callback) cometD created using session id and token.
    createWebsocket(callback) {
        const _this = this;
        this.cometd = new org.cometd.CometD();
        this.cometd.configure({
            url: this.cometdUrl + '/' + this.pin + '/' + this.session
        });
        this.cometd.websocketEnabled = true;
        this.cometd.handshake(function (h) {
            if (h.successful) {
                let controller = _this.cometd.subscribe('/service/controller', function (m) {})
                let player = _this.cometd.subscribe('/service/player', function (m) {})
                let status = _this.cometd.subscribe('/service/status', function (m) {})
                _this.cometd.unsubscribe(controller, function (m) {})
                _this.cometd.unsubscribe(player, function (m) {})
                _this.cometd.unsubscribe(status, function (m) {})
                controller = _this.cometd.subscribe('/service/controller', function (m) {
                    _this.onRawMessageController(m);
                    if (m.data.error) {
                        _this.state = 3;
                        _this.error = m.data.description;
                    }
                })
                player = _this.cometd.subscribe('/service/player', function (m) {
                    _this.onRawMessagePlayer(m);
                    switch (m.data.id) {
                        case 1:
                            var tempJson = JSON.parse(m.data.content);
                            _this.questionNum = tempJson.questionIndex;
                            break;

                        case 9:
                            var tempJson = JSON.parse(m.data.content);
                            _this.quizName = tempJson.quizName;
                            break;

                        case 53:
                            _this.state = 2;
                            break;

                        case 52:
                            _this.state = 1;
                            break;

                        case 51:
                            _this.state = 2
                            break;
                    }
                })
                status = _this.cometd.subscribe('/service/status', function (m) {
                    _this.onRawMessageStatus(m);
                    if (m.data.status === 'ACTIVE') {
                        _this.state = 1;
                    }
                })
                callback();
            }
        });
    }

    //testSession - returns (callback) boolean depending on existence of session.
    testSession(callback) {
        const _this = this;
        this.http.get(this.apiUrl + '/reserve/session/' + this.pin + '/?' + this.getTC(), null, function (xhr) {
            if (xhr.status !== 404) {
                _this.rawSession = xhr.getResponseHeader('x-kahoot-session-token');
                _this.solvedChallenge = _this.solveChallenge(JSON.parse(xhr.responseText).challenge);
                _this.twoFactor = JSON.parse(xhr.responseText).twoFactorAuth;
                _this.session = _this.shiftBits();
                callback(true);
            } else {
                callback(false);
            }
        });
    }


    //HELPER FUNCTIONS
    getTC() {
        return new Date().getTime();
    }

    shiftBits() {
        const sessionBytes = this.convertDataToBinary(atob(this.rawSession));
        const challengeBytes = this.convertDataToBinary(this.solvedChallenge);
        const bytesList = [];
        for (let i = 0; i < sessionBytes.length; i++) {
            bytesList.push(String.fromCharCode(sessionBytes[i] ^ challengeBytes[i % challengeBytes.length]));
        }
        return bytesList.join('');
    }

    convertDataToBinary(raw) {
        const rawLength = raw.length;
        const tempArray = new Uint8Array(new ArrayBuffer(rawLength));

        for (let i = 0; i < rawLength; i++) {
            tempArray[i] = raw.charCodeAt(i);
        }
        return tempArray;
    }

    solveChallenge(challenge) {
        return eval(challenge.split('this.angular').join('angular'));
    }

    waitForSocketConnection(socket, callback) {
        setTimeout(
            function () {
                if (socket.readyState === 1) {
                    if (typeof callback === 'function') {
                        callback();
                    }
                    return;

                } else {
                    waitForSocketConnection(socket, callback);
                }

            }, 5);
    }

}