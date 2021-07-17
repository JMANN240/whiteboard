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
            width INTEGER,
            CONSTRAINT fk_whiteboard_id
                FOREIGN KEY (whiteboard_id)
                REFERENCES whiteboards (whiteboard_id)
        )
    ''')

    cursor.execute('''DROP TABLE IF EXISTS users''')
    cursor.execute('''
        CREATE TABLE users (
            user_id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')

    cursor.execute('DROP TABLE IF EXISTS user_whiteboards')
    cursor.execute('''
        CREATE TABLE user_whiteboards (
            user_id INTEGER NOT NULL,
            whiteboard_id TEXT NOT NULL,
            CONSTRAINT fk_user_id
                FOREIGN KEY (user_id)
                REFERENCES users (user_id),
            CONSTRAINT fk_whiteboard_id
                FOREIGN KEY (whiteboard_id)
                REFERENCES users (whiteboard_id)
        )
    ''')