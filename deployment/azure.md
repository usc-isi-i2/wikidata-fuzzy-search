# Deployment to the Chelem server

Our server is located at wikidata-backend.researchsoftwarehosting.org . Log in with ssh:

    ssh zmbq@researchsoftwarehosting.org -i ~/.ssh/chelem-azure-internal.pem

(you will need the pem file, obviously)

## Initial setup

Install nginx, python3-venv
Create a non-sudo user `webapp` and add to the group `www-data`

    sudo adduser --system --shell /bin/bash --group --disabled-password --home /home/webapp webapp
    sudo usermod -aG www-data webapp

## Set up folders
    sudo su - webapp
    mkdir src
    mkdir web
    mkdir web/run
    mkdir web/logs


## Copy sources
Use the `package-backend.py` script to create a package of the backend, upload it to the server (to `~zmbq/wikidata-package.zip`):

    scp -i ~\.ssh\chelem-azure-internal.pem d:\temp\wikidata-package.zip zmbq@wikidata-backend@researchsoftwarehosting.org:wikidata-package.zip

log into the webapp user and:

    cd ~/src
    unzip ~zmbq/wikidata-package.zip

In subsequent deployemnts you can run the package script with `--no-data`, so that the big machine learning data file is not included again

## Set up the virtual environment

    cd ~/web
    python3 -m venv env
    ln -s env/bin/activate activate
    source activate

Install requirements

    pip install -r ~/src/wikidata-fuzzy-search/requirements.txt
    pip install -r ~/src/data-label-augmentation/src/label_augmenter/requirements.txt
    pip install gunicorn

## Install the gunicorn service

    Copy `~webapp/src/wikidata-fuzzy-search/deployment/gunicorn.service` to `/etc/systemd/system`

    Enable the service

    sudo systemctl enable gunicorn
    sudo systemctl start gunicorn


## Configure nginx

    Copy `~webapp/src/wikidata-fuzzy-search/deployment/wikidata-backend.conf` to `/etc/nginx/sites-available`
    Link the file to `/etc/nginx/sites-enabled`
    Restart nginx
    