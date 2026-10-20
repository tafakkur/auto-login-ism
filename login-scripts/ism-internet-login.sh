#!/bin/bash

# Connect to WiFi first
/home/common/auto-login-ism/login-scripts/wifi-connect.sh

cd /home/common/auto-login-ism/

/home/common/.nvm/versions/node/v24.14.1/bin/node index.js
