# Building the frontend's Docker image

Change your directory to the wikidata-fuzzy-search root folder and run

    docker build -t isi/wikidata-frontend . -f deployment/Frontend/Dockerfile 

To run:

    docker run -p 8080:80 isi/wikidata-frontend

(obviously you can use whatever tag you want)

## Using DOCKER_BUILDKIT
For speedier builds, you will want to turn the Docker BuildKit on.

Before building run in Powershell

    $env:DOCKER_BUILDKIT=1

or in bash

    export DOCKER_BUILDKIT=1

