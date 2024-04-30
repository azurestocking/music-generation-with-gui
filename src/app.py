from flask import Flask, request, jsonify, render_template, send_file
import torch
import numpy as np
import os
import datetime
import glob
from models.build_model import build_model
from generate import generate

app = Flask(__name__)

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

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_music():
    data = request.get_json()
    change_points = list(map(int, data['change_points'].split(',')))
    arousal_values = list(map(float, data['arousal_values']))
    gen_len = 3072
    print("Change points:", change_points)
    print("Arousal values:", arousal_values)
    
    # Initialize arousal and valence arrays
    arousal = np.zeros(gen_len)
    valence = np.zeros(gen_len) 
    arousal[:change_points[0]] = arousal_values[0]
    
    # Set up interpolation based on user inputs
    for i, point in enumerate(change_points):
        start_index = point
        end_index = change_points[i + 1] if i + 1 < len(change_points) else gen_len
        end_val = arousal_values[i + 1]
        print(f"Interpolation starts at index {start_index} from value {arousal[start_index - 1]}")
        num_steps = min(64, end_index - start_index)
        arousal[start_index:start_index + num_steps] = np.linspace(arousal[start_index - 1], end_val, num_steps)
        arousal[start_index + num_steps:end_index] = end_val
        print(f"Interpolation finishes at index {start_index + num_steps} with value {end_val}")

    arousal_tensor = torch.tensor(arousal, dtype=torch.float32).view(1, -1).to(device)
    valence_tensor = torch.tensor(valence, dtype=torch.float32).view(1, -1).to(device)
    varying_condition = [valence_tensor, arousal_tensor]
    
    # Call the generate function
    temperatures = [1.2, 1.2]
    penalty_coeff = 0.5
    min_n_instruments = 2
    verbose = True

    generate(
        model=model,
        maps=maps,
        device=device,
        out_dir=output_directory,
        conditioning="continuous_concat",
        varying_condition=varying_condition,
        gen_len=gen_len,
        temperatures=temperatures,
        penalty_coeff=penalty_coeff,
        min_n_instruments=min_n_instruments,
        verbose=verbose
    )
    
    # Define the output filename
    list_of_files = glob.glob(os.path.join(output_directory, '*.mid'))
    latest_file = max(list_of_files, key=os.path.getctime, default=None)
    if latest_file:
        filename = os.path.basename(latest_file)
        return jsonify({"message": "File generated successfully.", "midi_url": f"/midi/{filename}"})
    else:
        return jsonify({"message": "No file generated."}), 404

@app.route('/midi/<filename>')
def serve_midi(filename):
    try:
        file_path = os.path.join(output_directory, filename)
        return send_file(file_path, mimetype='audio/midi')
    except Exception as e:
        return str(e), 404

if __name__ == '__main__':
    app.run(debug=True)