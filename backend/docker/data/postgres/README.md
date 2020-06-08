This directory is mounted into /import on the Postgres container, so you can run the bulk_copy import script on files in it.
The file uaz.sql is also mounted into the Postgres initdb script directory, so it is restored automatically when the container is first started.
