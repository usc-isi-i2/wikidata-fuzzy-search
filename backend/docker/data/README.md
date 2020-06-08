# Running the Storage Databases from Docker
The API uses Postgres and Blazegraph for data storage. To simplify development and deployment, we have set everything up in Docker containers.

The `docker-compose.yml` file in this directory sets up Blazegraph listening on port 9999 and Postgres listening on port 5433.

The docker containers have several directories mounted, all reside in `./data`. You can download the `api-storage-data.7z` file from the Datamart/Postgres Wikidata Google Drive folder, which contains the UAZ data for both Postgres and Blazegraph. Simply extract the file into the `./data` directory. You should have two directories after extracting - `./data/postgres` and `./data/blaze-graph`.

Run `docker-compose up` and you should have everything accessible for the backend.




