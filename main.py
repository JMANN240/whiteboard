from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, join_room
from os import urandom
from base64 import b64encode
import sqlite3, json

app = Flask(__name__)
app.config['SECRET_KEY'] = urandom(24)
socketio = SocketIO(app, cors_allowed_origins='*')

points = []

def loadStrokes(whiteboard_id):
    with sqlite3.connect('database.db') as connection:
        cursor = connection.cursor()
        cursor.execute('''SELECT points, color FROM strokes WHERE whiteboard_id=:whiteboard_id''', {'whiteboard_id': whiteboard_id})
        strokes = [[json.loads(row[0]), row[1]] for row in cursor.fetchall()]
    return strokes

def addStroke(whiteboard_id, points, color):
    with sqlite3.connect('database.db') as connection:
        cursor = connection.cursor()
        cursor.execute('''INSERT INTO strokes (whiteboard_id, points, color) VALUES (:whiteboard_id, :points, :color)''', {'whiteboard_id': whiteboard_id, 'points': json.dumps(points), 'color': color})

def clearStrokes(whiteboard_id):
    with sqlite3.connect('database.db') as connection:
        cursor = connection.cursor()
        cursor.execute('''DELETE FROM strokes WHERE whiteboard_id=:whiteboard_id''', {'whiteboard_id': whiteboard_id})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/whiteboard', methods=['GET', 'POST'])
def whiteboard():
    if (request.method == 'GET'):
        print(request.args.get('id'))
        return render_template('whiteboard.html')
    
    if (request.method == 'POST'):
        uuid = b64encode(urandom(24))
        session['whiteboard_id'] = uuid
        return uuid

@socketio.on("connect")
def connect():
    print('connect')
    whiteboard_id = request.args.get('id')
    session['whiteboard_id'] = whiteboard_id
    join_room(session['whiteboard_id'])
    strokes = loadStrokes(session['whiteboard_id'])
    socketio.emit('strokes', strokes, to=session['whiteboard_id'])

@socketio.on("new-stroke")
def new_stroke(points, color):
    print('new-stroke')
    addStroke(session['whiteboard_id'], points, color)
    strokes = loadStrokes(session['whiteboard_id'])
    socketio.emit('strokes', strokes, to=session['whiteboard_id'], broadcast=True)

@socketio.on("clear")
def clear():
    print('clear')
    clearStrokes(session['whiteboard_id'])
    socketio.emit('strokes', [], to=session['whiteboard_id'], broadcast=True)

if (__name__ == '__main__'):
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
