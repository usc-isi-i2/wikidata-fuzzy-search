# Postgres utilities.
# We are using Psycopg2 for everything
import psycopg2
import settings

def connect_to_postgres():
    conn = psycopg2.connect(**settings.POSTGRES)
    return conn

def query_to_dicts(sql):
    """ Runs an SQL query, return a list of dictionaries - one for each row """
    row_dicts = []
    with connect_to_postgres() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql)
            col_names = [desc[0] for desc in cursor.description] # From here: https://stackoverflow.com/a/10252273/871910
            for row in cursor:
                row_dict = {}
                for idx, field in enumerate(row):
                    row_dict[col_names[idx]] = field
                row_dicts.append(row_dict)

    return row_dicts

