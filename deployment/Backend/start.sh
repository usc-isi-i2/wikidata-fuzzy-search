#! /bin/bash

python cache.py
gunicorn -w 3 -b 0.0.0.0:80 app:app
