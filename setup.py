import sqlite3

with sqlite3.connect('database.db') as connection:
    cursor = connection.cursor()

    cursor.execute('DROP TABLE IF EXISTS strokes')
    cursor.execute('''
        CREATE TABLE strokes (
            whiteboard_id TEXT,
            points TEXT,
            color TEXT
        )
    ''')