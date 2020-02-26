FROM node:alpine3.10 AS builder
RUN mkdir -p /src
COPY  frontend src
WORKDIR /src
RUN yarn install && yarn build

FROM nginx:alpine 
# COPY --from=builder nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/build/ /usr/share/nginx/html
# example from https://medium.com/@tiangolo/react-in-docker-with-nginx-built-with-multi-stage-docker-builds-including-testing-8cc49d6ec305
