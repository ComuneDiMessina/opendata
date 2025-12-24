# Portale dati del Comune di Messina

> [!WARNING]
> Work in progress

Il motore del portale dei dati è CKAN versione 2.10. Si ringrazia @piersoft per il repository https://github.com/piersoft/ckan-docker

Il frontend è scritto in React.

## Instruction

1. Rinomina `.env.example` in `.env`

1. Personalizza il file `.env`. Assicurati, ad esempio, di sostituire gli indirizzi locali `127.0.0.1` con `dati.comune.bugliano.it`

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

Maggiori informazioni nel README di @piersoft https://github.com/piersoft/ckan-docker