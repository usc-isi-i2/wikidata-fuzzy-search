# Building the frontend's Docker image

Change your directory to the wikidata-fuzzy-search root folder and run

    docker build -t isi/wikidata-frontend . -f deployment/Frontend/Dockerfile 

To run:

    docker run -p 8080:80 isi/wikidata-frontend

(obviously you can use whatever tag you want)