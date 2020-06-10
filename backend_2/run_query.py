import sqlalchemy as db
from sqlalchemy import create_engine

# db_config = json.load(open('sql_db_config.json'))
db_config = {
    "user_name": "postgres",
    "password": "postgres",
    "server": "localhost",
    "port": 5433,
    "database": "wikidata"
}


class SQLQuery(object):
    def __init__(self):
        self.engine = create_engine('postgres+psycopg2://{}:{}@{}:{}/{}'.format(
            db_config['user_name'],
            db_config['password'],
            db_config['server'],
            db_config['port'],
            db_config['database'],
        ))
        self.connection = self.engine.connect()
        self.metadata = db.MetaData()

    def run_sql_query(self, query_string):
        result_proxy = self.connection.execute(db.text(query_string))
        result_set = result_proxy.fetchall()
        return {'result': [dict(row) for row in result_set]}
