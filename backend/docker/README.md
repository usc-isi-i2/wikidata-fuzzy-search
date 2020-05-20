# Setting up all Docker dependencies for the backend

To run the backend properly, you need to run `docker-compose up` in the current directory. This will run BlazeGraph, and have it listening on port 8999.

## Blazegraph Data
We map the Blazegraph data files to ./data/blazegraph
You can place TTL files (for importing into Blazegraph) in the ./data/import directory, which is later accessible as `/import` by Blazegraph.

