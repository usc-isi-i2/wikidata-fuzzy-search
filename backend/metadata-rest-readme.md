
# Running metadata REST service for development

## Installing Blazegraph

Follow the instructions [Blazegraph Quick Start](https://github.com/blazegraph/database/wiki/Quick_Start)
instructions to start Blazegraph.

The Blazegraph Workbench page is here: http://localhost:9999/blazegraph

## Create Blazegraph Namespace

Use a web browser and go to the **NAMESPACES** table of the Blazegraph workbench page.

Create a namespace called **metadata**, and use this namespace.

## Upload variable metadata ttl file

Download the variable metadata ttl file from the Google KGTK shared drive:

/Shared drives/KGTK/datasets/wikidata-20200330/datamart/variable-metadata.ttl.gz

Go to the Blazegraph workbench page.

In the **NAMESPACES** table make sure the **metadata** namespace is **in use**.

Go to the **UPDATE** tab and upload the variable-metadata.ttl file by following the
[Blazegraph Quick Start](https://github.com/blazegraph/database/wiki/Quick_Start) instructions.

The BLAZEGRAPH_QUERY_ENDPOINT is defined in backend/settings.py
