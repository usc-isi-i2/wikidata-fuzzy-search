FROM python:3.7-buster

RUN mkdir -p /word2vec

WORKDIR /word2vec
RUN wget -O GoogleNews-vectors-negative300-SLIM.bin.gz https://github.com/eyaler/word2vec-slim/blob/master/GoogleNews-vectors-negative300-SLIM.bin.gz?raw=true 
RUN gunzip GoogleNews-vectors-negative300-SLIM.bin.gz

WORKDIR /
RUN mkdir -p /src
COPY  data-label-augmentation /src/data-label-augmentation
COPY  wikidata-fuzzy-search /src/wikidata-fuzzy-search
RUN ln -s /src/wikidata-fuzzy-search/deployment/Backend/start.sh /start.sh && chmod +x /start.sh

# RUN mkdir -p /src/wikidata-fuzzy-search/backend/local_settings.py
RUN cp /src/wikidata-fuzzy-search/deployment/Backend/docker_settings.py /src/wikidata-fuzzy-search/backend/local_settings.py 
# RUN cat /src/wikidata-fuzzy-search/backend/local_settings.py

WORKDIR /src/data-label-augmentation/src/label_augmenter
RUN pip install -r requirements.txt

WORKDIR /src/wikidata-fuzzy-search/backend
RUN pip install -r requirements.txt

WORKDIR /src
RUN pip install gunicorn

WORKDIR /src/wikidata-fuzzy-search/backend
ENTRYPOINT ["/start.sh"]

