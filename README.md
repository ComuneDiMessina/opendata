# Portale dati del Comune di Messina

> [!WARNING]
> Work in progress

Il motore del portale dei dati è CKAN versione 2.10. Si ringrazia @piersoft per il repository https://github.com/piersoft/ckan-docker

Il frontend è scritto in React.

## Instruction

Seguire le istruzioni di https://github.com/piersoft/ckan-docker

1. Crea il file `.env`

1. To build the images:

	```
	docker compose build
	```

1. To start the containers:

	```
	docker compose up -d
	```

1. IMPORTANT AFTER CKAN IS RUNNING HEALTY (ONLY FIRST TIME):

	```sh
	# Go to into docker
	docker exec -it ckan bash

	cd /docker-entrypoint.d

	sh 03_ckan_groups.end

	exit

	docker restart ckan
	```