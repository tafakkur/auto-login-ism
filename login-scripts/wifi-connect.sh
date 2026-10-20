#!/bin/bash

# Check if the network is already connected
if ! nmcli -t -f ACTIVE,SSID dev wifi | grep -q '^*.*Sameer_ISM$'; then
    # If not connected, connect to the network
     nmcli con up 'Sameer_ISM'
fi

#cd /home/common/auto-login-ism/

#/home/common/.nvm/versions/node/v24.14.1/bin/node index.js
