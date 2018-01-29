# Kahoot Tools

A simple website for fucking with kahoot games.

## Installation

To install, just clone this repo and run ```npm i && node main.js``` in the cloned directory. 
Open a web browser and visit your ip with the specified port. You can also visit [sorry down rn](http://dviide.xyz) for an already hosted version of Kahoot Tools. Server costs are low because all the heavy lifting is done from the browser unlike some other web alternatives... *Cough* *cough* *kahootspam* *cough...*

## Usage

The website is pretty self explenatory. 2FA is prompted and connections are done from the browser (cometd.) 
The only thing the node script does is run a http server and a cors proxy to retrieve a sessionId from kahoot servers.

## Features

Kahoot Tools currently supports:
- Full connection with CometD 
- Single Player / Team Mode / Two Factor Authentication
- Playing a normal kahoot game
- Crashing a kahoot game using brute force

## Support

The website works on all browser which support ES6.

## Credits

Thanks to @imperavi for creating the incredible Kube framework which is used in this project!

## License

MIT
