import torch
import numpy as np
from models.build_model import build_model
from utils import get_n_instruments
from data.data_processing_reverse import ind_tensor_to_mid, ind_tensor_to_str
from generate import generate

# Setup paths and device configuration
model_directory = "../output/continuous_concat"
maps_path = f"{model_directory}/mappings.pt"
model_path = f"{model_directory}/model.pt"
config_path = f"{model_directory}/model_config.pt"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load mappings, configurations, and instantiate the model
maps = torch.load(maps_path)
model_config = torch.load(config_path)
model, _ = build_model(None, load_config_dict=model_config)
state_dict = torch.load(model_path)
model.load_state_dict(state_dict)
model = model.to(device)
model.eval()

# Setup the output directory for generated files
output_directory = f"{model_directory}/generations"

# Define the type of conditioning being used
conditioning_type = "continuous_concat"

# Specify timesteps for interpolation and generation length
gen_len = 3072
change_points = [1024, 2048]

# Specify arousal values for each segment
arousal_values = [-1.0, 1.0, -1.0]

# Initialize arousal to the right length and set the starting value
arousal = np.zeros(gen_len)

# Define patterns for arousal level
arousal[:change_points[0]] = arousal_values[0]

for i, point in enumerate(change_points):
    start_index = point
    end_index = change_points[i + 1] if i + 1 < len(change_points) else gen_len
    # Set the target value for this segment
    end_val = arousal_values[i + 1]
    print(f"Interpolation starts at index {start_index} from value {arousal[start_index - 1]}")
    # Calculate the number of timesteps to finish interpolation dynamically
    num_steps = min(64, end_index - start_index)
    # Set the linear interpolation
    arousal[start_index:start_index + num_steps] = np.linspace(arousal[start_index - 1], end_val, num_steps)
    # Hold the last value of the interpolation until the next change point
    arousal[start_index + num_steps:end_index] = end_val
    print(f"Interpolation finishes at index {start_index + num_steps} with value {end_val}")

# Set a constant valence level
valence = np.zeros(gen_len)

# Convert to tensors
valence_tensor = torch.tensor(valence, dtype=torch.float32).view(1, -1).to(device)
arousal_tensor = torch.tensor(arousal, dtype=torch.float32).view(1, -1).to(device)
varying_condition = [valence_tensor, arousal_tensor]

# Prepare other parameters for the generate function
temperatures = [1.2, 1.2]
penalty_coeff = 0.5
min_n_instruments = 2
verbose = True

# Call the generate function with the required arguments
generate(
    model=model,
    maps=maps,
    device=device,
    out_dir=output_directory,
    conditioning=conditioning_type,
    varying_condition=varying_condition,
    gen_len=gen_len,
    temperatures=temperatures,
    penalty_coeff=penalty_coeff,
    min_n_instruments=min_n_instruments,
    verbose=verbose
)