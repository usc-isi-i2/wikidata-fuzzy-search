# Building the backend's Docker image

Change your directory to a directory containing both wikidata-fuzzy-search and data-label-augmentation  and run

    docker build -t isi/wikidata-backend . -f wikidata-fuzzy-search/deployment/Backend/Dockerfile 

To run:

    docker run -p 8082:80 isi/wikidata-backend

(obviously you can use whatever tag you want)