#!/bin/bash
podman stop $(podman ps -a -q)
podman rm $(podman ps -a -q)

podman run --name nodejs-redis -d redis
node src/app.js