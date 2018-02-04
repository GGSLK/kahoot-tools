# Kahoot Tools

A simple website for fucking with kahoot games.

## Installation

To install, just clone this repo and run ```npm i && node main.js``` in the cloned directory, open a web browser and visit your IP with the specified port. Defaults to ```80```. 

#### IMPORTANT: READ BEFORE OPENING AN ISSUE
If you get an EACCESS error while trying to run kahoot-tools, please try to change the server port by setting the ```PORT``` environment variable.


## Usage

The website is pretty self explenatory. 2FA is prompted and connections are done from within the browser.
The only thing the node script does is run a http server and a cors proxy to retrieve a sessionId from kahoot servers.

## Features

Kahoot Tools currently supports:
- Full connection with CometD.
- Single Player / Team Mode / Two Factor Authentication
- Playing a normal kahoot game.
- Crashing a kahoot game using brute force.

## Support

The website works on all browser which support ES6.

## License

MiT
