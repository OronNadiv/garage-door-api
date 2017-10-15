# Home Automation - Garage Door API
Back-end server that handles apis for the garage door. Main functions are:
It saves the garage door state (opened or closed).
It sends commands to the [raspberry pi garage door client][garage-door-client-url] to open or close the garage door.
It notifies the users if the garage door is left open.
It will notify the [alarm server api][alarm-url] when the door is opening or closing if the alarm is armed.

[![JavaScript Style Guide][standard-image]][standard-url]
[![Dependencies][dependencies-image]][dependencies-url]
[![DevDependencies][dependencies-dev-image]][dependencies-dev-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

I suggest you first [read][overview-url] about the different components of the home automation application.  
This will help you understand better the general architecture and different functions of the system.

## Installation instructions
Click [here][server-installation-instruction-url] and follow the installation instructions for the server micro-service, before moving to the next step.

## Environment variables (configuration)
__ALARM\_URL__ (optional): url to [alarm system][alarm-url] server.  Default: `none`  
__AUTH\_PUBLIC\_KEY__ (required): content of auth server's publickey.  
__CLOUDAMQP\_URL__ (required): url to amqp server.  The amqp server is used to track cases where the door is left open.  
__DATABASE\_URL__ (required):  url to postgres database.  Default: `postgres://postgres:@localhost/home_automation`  
__KEEP\_HISTORY\_IN\_DAYS__ (required): Number of days to keep history.  Default: `30`  
__LOGIN\_URL__ (required): url to [authentication][auth-url] server. Default: if NODE_ENV = `production` => `none`, otherwise: `http://localhost:3001`  
__NODE\_ENV__ (required): set up the running environment.  Default: `production`.  `production` will enforce encryption using SSL and other security mechanisms.  
__NOTIFICATIONS\_URL__ (required): url to [notifications][notifications-url] server. Default: if NODE_ENV = `production` => `none`, otherwise: `http://localhost:3004`  
__OPEN\_DOOR\_ALERTS\_INTERVAL\_IN\_MINUTES__ (required): Frequency to trigger an alert when garage door is left open.  Default: `15`  
__PORT__ (required): server's port.  default: `3003`  
__PRIVATE\_KEY__ (required): Generated private key.  Public key should be shared with the [authentication][auth-url] server. See [here][private-public-keys-url].  
__POSTGRESPOOLMIN__ (required): postgres pool minimum size.  Default: `2`  
__POSTGRESPOOLMAX__ (required): postgres pool maximum size.  Default: `10`  
__POSTGRESPOOLLOG__ (required): postgres pool log. Values: `true`/`false`. Default: `true`  
__UI\_URL__ (required): url to the [UI][ui-url] server. Default: if NODE_ENV = `production` => `none`, otherwise: `http://localhost:3000`

### License
[AGPL-3.0](https://spdx.org/licenses/AGPL-3.0.html)

### Author
[Oron Nadiv](https://github.com/OronNadiv) ([oron@nadiv.us](mailto:oron@nadiv.us))

[dependencies-image]: https://david-dm.org/OronNadiv/garage-door-api/status.svg
[dependencies-url]: https://david-dm.org/OronNadiv/garage-door-api
[dependencies-dev-image]: https://david-dm.org/OronNadiv/garage-door-api/dev-status.svg
[dependencies-dev-url]: https://david-dm.org/OronNadiv/garage-door-api?type=dev
[travis-image]: http://img.shields.io/travis/OronNadiv/garage-door-api.svg?style=flat-square
[travis-url]: https://travis-ci.org/OronNadiv/garage-door-api
[coveralls-image]: http://img.shields.io/coveralls/OronNadiv/garage-door-api.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/OronNadiv/garage-door-api
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com

[overview-url]: https://oronnadiv.github.io/home-automation
[client-installation-instruction-url]: https://oronnadiv.github.io/home-automation/#installation-instructions-for-the-raspberry-pi-clients
[server-installation-instruction-url]: https://oronnadiv.github.io/home-automation/#installation-instructions-for-the-server-micro-services
[private-public-keys-url]: https://oronnadiv.github.io/home-automation/#generating-private-and-public-keys

[garage-door-client-url]: https://github.com/OronNadiv/garage-door-raspberry-client

[alarm-url]: https://github.com/OronNadiv/alarm-system-api
[auth-url]: https://github.com/OronNadiv/authentication-api
[camera-url]: https://github.com/OronNadiv/camera-api
[garage-url]: https://github.com/OronNadiv/garage-door-api
[notifications-url]: https://github.com/OronNadiv/notifications-api
[storage-url]: https://github.com/OronNadiv/storage-api
[ui-url]: https://github.com/OronNadiv/home-automation-ui
