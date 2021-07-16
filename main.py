from sys import meta_path
from flask import Flask, render_template, request, session, redirect, flash, make_response, jsonify
from flask_socketio import SocketIO, join_room
from passlib.hash import sha256_crypt as sha256
from os import urandom
from base64 import urlsafe_b64encode
import sqlite3, json

app = Flask(__name__)
app.config['SECRET_KEY'] = urandom(24)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.context_processor
def inject_user():
    if 'username' in session:
        logged_in = True
        username = session['username']
    else:
        logged_in = False
        username = None
    return dict(logged_in=logged_in, username=username)

with open("settings.json", "r") as settings_file:
    settings = json.load(settings_file)

points = []

def createWhiteboard(whiteboard_id):
    with sqlite3.connect('database.db') as connection:
        cursor = connection.cursor()
        cursor.execute('''INSERT INTO whiteboards (whiteboard_id) VALUES (:whiteboard_id)''', {'whiteboard_id': whiteboard_id})

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

def getNickname(whiteboard_id):
    print(f"getting where whiteboard_id={whiteboard_id}")
    with sqlite3.connect('database.db') as connection:
        cursor = connection.cursor()
        cursor.execute('''SELECT nickname FROM whiteboards WHERE whiteboard_id=:whiteboard_id''', {'whiteboard_id': whiteboard_id})
        res = cursor.fetchone()
    if res is None or res[0] is None:
        return ""
    return res[0]

def setNickname(whiteboard_id, new_nickname):
    with sqlite3.connect('database.db') as connection:
        cursor = connection.cursor()
        cursor.execute('''UPDATE whiteboards SET nickname=:nickname WHERE whiteboard_id=:whiteboard_id''', {'nickname': new_nickname if new_nickname != "" else None, 'whiteboard_id': whiteboard_id})

def resolveNickname(nickname):
    with sqlite3.connect('database.db') as connection:
        cursor = connection.cursor()
        cursor.execute('''SELECT whiteboard_id FROM whiteboards WHERE nickname=:nickname''', {'nickname': nickname})
        res = cursor.fetchone()
    if res is None:
        return res
    return res[0]

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    
    if request.method == 'POST':
        username = request.form.get("username")
        if not username:
            flash("No username provided")
            return make_response(redirect("/login"))
        
        password = request.form.get("password")
        if not password:
            flash("No password provided")
            return make_response(redirect("/login"))
        
        with sqlite3.connect("database.db") as connection:
            cursor = connection.cursor()
            cursor.execute('SELECT username FROM users WHERE username=?', (username,))
            if not cursor.fetchall():
                flash(f"Could not find username '{username}'")
                return make_response(redirect("/login"))
            
            cursor.execute('SELECT password FROM users WHERE username=?', (username,))
            hashed_password = cursor.fetchone()[0]
            if not sha256.verify(password, hashed_password):
                flash("Incorrect username or password")
                return make_response(redirect("/login"))

            session['username'] = username
            res = make_response(redirect("/"))
            return res

@app.route("/logout", methods=["GET"])
def logout():
    session.pop('username', None)
    res = make_response(redirect("/"))
    return res

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == 'GET':
        return render_template('signup.html')
    
    if request.method == 'POST':
        username = request.form.get("username")
        if not username:
            flash("No username provided")
            return make_response(redirect("/signup"))
        
        password = request.form.get("password")
        if not password:
            flash("No password provided")
            return make_response(redirect("/signup"))
        
        confirm_password = request.form.get("confirm-password")
        if not confirm_password:
            flash("No confirmation password provided")
            return make_response(redirect("/signup"))
        
        if password != confirm_password:
            flash("Passwords do not match")
            return make_response(redirect("/signup"))
        
        with sqlite3.connect("database.db") as connection:
            cursor = connection.cursor()
            cursor.execute('SELECT username FROM users WHERE username=?', (username,))
            if cursor.fetchall():
                flash(f"Username '{username}' unavailable")
                return make_response(redirect("/signup"))
            
            hashed_password = sha256.hash(password)
            cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
        
            session['username'] = username
            res = make_response(redirect("/"))
            return res

@app.route('/<nickname>')
def nickname(nickname):
    whiteboard_id = resolveNickname(nickname)
    if whiteboard_id is None:
        return render_template('unknown-nickname.html')
    return redirect(f'/whiteboard?id={whiteboard_id}')

@app.route('/whiteboard', methods=['GET', 'POST'])
def whiteboard():
    if (request.method == 'GET'):
        return render_template('whiteboard.html')
    
    if (request.method == 'POST'):
        whiteboard_id = str(urlsafe_b64encode(urandom(6)))[2:-1]
        session['whiteboard_id'] = whiteboard_id
        createWhiteboard(whiteboard_id)
        return whiteboard_id

@app.route('/api/settings')
def api_settings():
    return settings

@app.route('/api/whiteboard', methods=["GET", "POST"])
def api_whiteboards():
    if 'username' not in session:
        return "403"
    
    if request.method == 'GET':
        username = session['username']
        with sqlite3.connect("database.db") as connection:
            cursor = connection.cursor()
            cursor.execute('''SELECT whiteboard_id, nickname FROM whiteboards WHERE whiteboard_id IN (SELECT whiteboard_id FROM user_whiteboards WHERE user_id=(SELECT user_id FROM users WHERE username = :username))''', {'username': username})
            return jsonify(cursor.fetchall())

    if request.method == 'POST':
        username = session['username']
        whiteboard_id = request.form.get('whiteboard_id')
        saved = request.form.get('saved') == 'true'
        with sqlite3.connect("database.db") as connection:
            cursor = connection.cursor()
            if saved:
                cursor.execute('''INSERT INTO user_whiteboards (user_id, whiteboard_id) VALUES ((SELECT user_id FROM users WHERE username = :username), :whiteboard_id)''', {'username': username, 'whiteboard_id': whiteboard_id})
            else:
                cursor.execute('''DELETE FROM user_whiteboards WHERE whiteboard_id=:whiteboard_id AND user_id=(SELECT user_id FROM users WHERE username = :username)''', {'username': username, 'whiteboard_id': whiteboard_id})
        return "200"

@app.route('/api/nickname', methods=['GET', 'POST'])
def api_nickname():
    if request.method == 'GET':
        whiteboard_id = request.args.get('whiteboard_id')
        nickname = getNickname(whiteboard_id)
        print(f"nickname is {nickname}")
        return nickname
    
    if request.method == 'POST':
        whiteboard_id = request.form.get('whiteboard_id')
        new_nickname = request.form.get('new_nickname')
        try:
            setNickname(whiteboard_id, new_nickname)
            return "200"
        except sqlite3.IntegrityError:
            return "406"
        


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
    socketio.run(app, host=settings.get("flask_host", "0.0.0.0"), port=settings.get("port", 8000), debug=settings.get("debug", False), keyfile=settings.get("keyfile", None), certfile=settings.get("certfile", None))
