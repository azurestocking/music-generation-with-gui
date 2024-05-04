from flask import Flask, request, jsonify, render_template, send_file
from flask_socketio import SocketIO, emit
import threading
import torch
import numpy as np
import os
import datetime
import glob
from models.build_model import build_model
from generate import generate

app = Flask(__name__)
socketio = SocketIO(app)

# Setup paths and device configuration
model_directory = "../output/continuous_concat"
maps_path = f"{model_directory}/mappings.pt"
model_path = f"{model_directory}/model.pt"
config_path = f"{model_directory}/model_config.pt"
output_directory = f"{model_directory}/generations"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

if not os.path.exists(output_directory):
    os.makedirs(output_directory)

# Load mappings, configurations, and instantiate the model
maps = torch.load(maps_path, map_location=device)
model_config = torch.load(config_path, map_location=device)
model, _ = build_model(None, load_config_dict=model_config)
model.load_state_dict(torch.load(model_path, map_location=device))
model = model.to(device)
model.eval()

# Shared variable for conditions
condition_lock = threading.Lock()
gen_len = 3072
arousal = np.zeros(gen_len)
valence = np.zeros(gen_len) 
arousal_tensor = torch.tensor(arousal, dtype=torch.float32).view(1, -1).to(device)
valence_tensor = torch.tensor(valence, dtype=torch.float32).view(1, -1).to(device)
varying_condition = [valence_tensor, arousal_tensor]

gen_thread = None

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

def generate_continuously():
    generate(
        model=model,
        maps=maps,
        device=device,
        out_dir=output_directory,
        conditioning="continuous_concat",
        varying_condition=varying_condition,
        gen_len=gen_len,
        temperatures=[1.2, 1.2],
        penalty_coeff=0.5,
        min_n_instruments=2,
        verbose=True
    )

@socketio.on('arousal_update')
def update_condition(data):
    current_arousal = float(data['arousalValue'])
    current_valence = 0.0
    print(f"Received new arousal value {current_arousal}", end=" ")
    with condition_lock:
        arousal_tensor.fill_(current_arousal)
        valence_tensor.fill_(current_valence)

@socketio.on('start_generation')
def start_generation(data):
    global gen_thread
    print('Received request:', data['message'], end=" ")
    with condition_lock:
        if gen_thread is None or not gen_thread.is_alive():
            gen_thread = threading.Thread(target=generate_continuously)
            gen_thread.daemon = True
            gen_thread.start()

@app.route('/get_midi/<filename>', methods=['GET'])
def get_midi(filename):
    return send_file(os.path.join(output_directory, f'{filename}'), mimetype='audio/midi')

if __name__ == '__main__':
    socketio.run(app, debug=True)