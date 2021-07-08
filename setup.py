import sqlite3

with sqlite3.connect('database.db') as connection:
    cursor = connection.cursor()

    cursor.execute('DROP TABLE IF EXISTS whiteboards')
    cursor.execute('''
        CREATE TABLE whiteboards (
            whiteboard_id TEXT UNIQUE NOT NULL,
            nickname TEXT UNIQUE
        )
    ''')

    cursor.execute('DROP TABLE IF EXISTS strokes')
    cursor.execute('''
        CREATE TABLE strokes (
            whiteboard_id TEXT,
            points TEXT,
            color TEXT,
            CONSTRAINT fk_whiteboard_id
                FOREIGN KEY (whiteboard_id)
                REFERENCES whiteboards (whiteboard_id)
        )
    ''')