# Building the backend's Docker image

Change your directory to a directory containing both wikidata-fuzzy-search and data-label-augmentation  and run

    docker build -t isi/wikidata-backend . -f wikidata-fuzzy-search/deployment/Backend/Dockerfile 

To run:

    docker run -p 8082:80 isi/wikidata-backend

(obviously you can use whatever tag you want)

## Using DOCKER_BUILDKIT
For speedier builds, you will want to turn the Docker BuildKit on.

Before building run in Powershell

    $env:DOCKER_BUILDKIT=1

or in bash

    export DOCKER_BUILDKIT=1