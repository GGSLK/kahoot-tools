class Kahoot {
    constructor(pin, name, proxy = '', url = 'https://www.kahoot.it') {
        this.pin = pin;
        this.name = name;
        this.proxy = proxy;
        this.apiUrl = this.proxy + url;
        this.webSocketUrl = 'wss://kahoot.it/cometd';
        this.websocket = null;
        this.ackCount = 0;
        this.subId = 0;
        this.questionNum = 0;
        this.solvedChallenge = '';
        this.session = '';
        this.clientId = '';
        this.rawSession = '';

        this.http = new class HTTP {
            constructor() {

            }

            get(url, args, callback) {
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        callback(this);
                    }
                };
                xhttp.open("GET", url, true);
                if (args) {
                    if (args.headers) {
                        for (var i = 0; i < args.headers.length; i++) {
                            xhttp.setRequestHeader(args.headers[i].split(':')[0], args.headers[i].split(':')[1]);
                        }
                    }
                }
                xhttp.send();
            }

            post(url, args, callback) {
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        callback(this);
                    }
                };
                xhttp.open("POST", url, true);
                if (args) {
                    if (args.headers) {
                        for (var i = 0; i < args.headers.length; i++) {
                            xhttp.setRequestHeader(args.headers[i].split(':')[0], args.headers[i].split(':')[1]);
                        }
                    }
                }
                xhttp.send(args.data);
            }
        }();
    }

    sendAnswerPayload(answerId, callback) {
        this.send([{
            "channel": "/service/controller",
            "data": {
                "id": 45,
                "type": "message",
                "gameid": this.pin,
                "host": "kahoot.it",
                "content": "{\"choice\":" + answerId + ",\"meta\":{\"lag\":15,\"device\":{\"userAgent\":\"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/61.0.3163.79 Chrome/61.0.3163.79 Safari/537.36\",\"screen\":{\"width\":1440,\"height\":870}}}}"
            },
            "id": "19",
            "clientId": kahoot.clientId
        }], function (data) {
            if (typeof callback === 'function') {
                callback(data);
            }
        })
    }

    connect(callback) {
        var _this = this;
        this.setupSession(function (session) {
            if (!session.error) {
                _this.websocket = new WebSocket(_this.webSocketUrl + '/' + _this.pin + '/' + _this.session);
                _this.websocket.onmessage = function (data) {
                    _this.onWebSocketData(data, _this);
                };
                _this.handshake(function (data) {
                    _this.subscribe(function () {
                        _this.stayConnected();
                        _this.setName();
                        if (typeof callback === 'function') {
                            callback(session);
                        }
                    })
                });
            } else {
                callback(session);
            }
        });
    }

    stayConnected() {
        var _this = this;
        _this.send([{
            "channel": "/meta/connect",
            "connectionType": "websocket",
            "id": _this.getSubId(),
            "clientId": _this.clientId,
            "ext": {
                "ack": _this.getAck(),
                "timesync": {
                    "tc": _this.getTC(),
                    "l": 21,
                    "o": -1
                }
            }
        }], function (data) {
            setTimeout(function () {
                _this.stayConnected();
            }, 5000);
        });
    }

    setName() {
        this.send([{
            "channel": "/service/controller",
            "data": {
                "type": "login",
                "gameid": this.pin,
                "host": "kahoot.it",
                "name": this.name
            },
            "id": this.getSubId(),
            "clientId": this.clientId
        }], function (data) {});
    }

    subscribe(callback) {
        var _this = this;
        var subscribe_order = ["subscribe", "unsubscribe", "subscribe"];
        var subscribe_text = ["controller", "player", "status"];
        for (var x = 0; x < 3; x++) {
            for (var y = 0; y < 3; y++) {
                this.send([{
                    "channel": "/meta/" + subscribe_text[y],
                    "clientId": _this.clientId,
                    "ext": {
                        "timesync": {
                            "l": _this.getL(),
                            "o": _this.getO(),
                            "tc": _this.getTC()
                        }
                    },
                    "id": _this.getSubId(),
                    "subscription": "/service/" + subscribe_order[x]
                }]);
            }
        }
    }

    handshake(callback) {
        var _this = this;
        _this.send([{
            "version": "1.0",
            "minimumVersion": "1.0",
            "channel": "/meta/handshake",
            "supportedConnectionTypes": ["websocket", "long-polling"],
            "advice": {
                "timeout": 60000,
                "interval": 0
            },
            "id": _this.getSubId(),
            "ext": {
                "ack": true,
                "timesync": {
                    "tc": _this.getTC(),
                    "l": _this.getL(),
                    "o": _this.getO()
                }
            }
        }], function () {
            var tempInterval = setInterval(function () {
                if (_this.clientId) {
                    clearInterval(tempInterval);
                    callback();
                }
            }, 300)
        });
    }

    onWebSocketData(data, _this) {
        var dataParsed = JSON.parse(data.data);
        if (dataParsed[0].channel === '/service/player') {
            if (dataParsed[0].id === 51) {
                console.log(data)
            }
            console.log(dataParsed[0])
        } else if (dataParsed[0].channel === '/meta/handshake') {
            if (dataParsed[0].clientId) {
                _this.clientId = dataParsed[0].clientId;
            }
        }
    }

    send(payload, callback) {
        var _this = this;
        this.waitForSocketConnection(this.websocket, function () {
            _this.websocket.send(JSON.stringify(payload));
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    getSubId() {
        this.subId += 1;
        return this.subId;
    }

    getAck() {
        this.ackCount = +1;
        return this.ackCount;
    }

    getTC() {
        return new Date().getTime();
    }

    getO() {
        return -14;
    }

    getL() {
        return 0;
    }

    waitForSocketConnection(socket, callback) {
        var _this = this;
        setTimeout(
            function () {
                if (socket.readyState === 1) {
                    if (callback != null) {
                        callback();
                    }
                    return;

                } else {
                    _this.waitForSocketConnection(socket, callback);
                }

            }, 5);
    }

    setupSession(callback) {
        var _this = this;
        this.http.get(this.apiUrl + '/reserve/session/' + this.pin + '/?' + this.getTC(), null, function (xhr) {
            if (xhr.status !== 404) {
                _this.rawSession = xhr.getResponseHeader('x-kahoot-session-token');
                _this.solvedChallenge = _this.solveChallenge(JSON.parse(xhr.responseText).challenge);
                _this.session = _this.shiftBits();
                callback({
                    error: false,
                    xhr: xhr
                });
            } else {
                callback({
                    error: true,
                    xhr: xhr
                });
            }
        });
    }

    shiftBits() {
        var sessionBytes = this.convertDataToBinary(atob(this.rawSession));
        var challengeBytes = this.convertDataToBinary(this.solvedChallenge);
        var bytes_list = [];
        for (var i = 0; i < sessionBytes.length; i++) {
            bytes_list.push(String.fromCharCode(sessionBytes[i] ^ challengeBytes[i % challengeBytes.length]));
        }
        return bytes_list.join('');
    }

    convertDataToBinary(raw) {
        var rawLength = raw.length;
        var array = new Uint8Array(new ArrayBuffer(rawLength));

        for (var i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
    }

    solveChallenge(str) {
        return eval(str.split('this.angular').join('angular'));
    }
}