class Kahoot {
    constructor(pin, name, proxy = '', url = 'https://www.kahoot.it') {
        this.pin = pin;
        this.name = name;
        this.proxy = proxy;
        this.apiUrl = this.proxy + url;
        this.cometdUrl = 'wss://kahoot.it/cometd';
        this.cometd = null;
        this.questionNum = 0;
        this.state = 0;
        this.solvedChallenge = '';
        this.session = '';
        this.clientId = '';
        this.rawSession = '';
        this.error = '';

        //LISTENERS:
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
        this.testSession(function (existence) {
            if (existence) {
                kahoot.createWebsocket(function () {
                    kahoot.doLogin();
                    callback(true);
                });
            } else {
                callback(false);
            }
        });
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

    //doHandshake - returns (callback) boolean success
    doLogin(callback) {
        this.cometd.publish('/service/controller', {
            gameid: this.pin,
            host: 'kahoot.it',
            name: this.name,
            type: 'login'
        }, function (publishAck) {});
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
                        case 14:
                            _this.state = 1;
                            break;
                        case 53:
                            //TODO - callback two factor req
                            _this.state = 2;
                            break;

                        case 52:
                            //TODO - callback two factor correct
                            _this.state = 1;
                            break;

                        case 51:
                            //TODO - callback two factor incorrect
                            _this.state = 2
                            break;
                    }
                })
                status = _this.cometd.subscribe('/service/status', function (m) {
                    _this.onRawMessageStatus(m);
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