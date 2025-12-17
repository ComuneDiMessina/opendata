FROM nginx:stable-alpine

ENV NGINX_DIR=/etc/nginx

RUN apk update --no-cache && \
    apk upgrade --no-cache && \
    apk add --no-cache openssl gettext

COPY setup/nginx.conf ${NGINX_DIR}/nginx.conf
COPY setup/index.html /usr/share/nginx/html/index.html
COPY setup/default.conf.template ${NGINX_DIR}/templates/

RUN mkdir -p ${NGINX_DIR}/certs

# Copia i certificati SSL reali
COPY setup/ckan-local.crt ${NGINX_DIR}/certs/ckan-local.crt
COPY setup/ckan-local.key ${NGINX_DIR}/certs/ckan-local.key

ENTRYPOINT \
  envsubst '${CKAN_ADMIN_PORT} ${FRONTEND_PUBLIC_PORT}' < ${NGINX_DIR}/templates/default.conf.template > ${NGINX_DIR}/conf.d/default.conf && \
  nginx -g 'daemon off;'