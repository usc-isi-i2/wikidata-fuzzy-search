# Building the backend's Docker image

Change your directory to a directory containing both wikidata-fuzzy-search and data-label-augmentation  and run

    docker build -t isi/wikidata-backend . -f wikidata-fuzzy-search/deployment/Backend/Dockerfile 


(obviously you can use whatever tag you want)

## Using DOCKER_BUILDKIT
For speedier builds, you will want to turn the Docker BuildKit on.

Before building run in Powershell

    $env:DOCKER_BUILDKIT=1

or in bash

    export DOCKER_BUILDKIT=1

# Running

The docker container loads indices and fills internal caches at startup. This is a long process that can take a while.
To save time, you can mount the cache to the host's file system. The cache internal directory inside the image is `/external`

To run use:


    docker run -p 8082:80 -v <path to host cache directory>:/external isi/wikidata-backend