from flask import Flask,jsonify,request,render_template
from flask_cors import CORS
from utils import connect_database
from config import connected_cashiers,socketio
import logging as logger
logger.basicConfig(level="DEBUG")
from routes import api_bp
import os
app = Flask(__name__)
CORS(app)

@app.route('/')
def hello():
    return render_template('home.html')


# Enregistrer le blueprint API
app.register_blueprint(api_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=6001,debug=True)
    