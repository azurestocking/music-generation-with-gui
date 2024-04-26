import torch
import numpy as np
from models.build_model import build_model
from utils import get_n_instruments
from data.data_processing_reverse import ind_tensor_to_mid, ind_tensor_to_str

model_directory = "../output/continuous_concat"
maps_path = f"{model_directory}/mappings.pt"
model_path = f"{model_directory}/model.pt"
config_path = f"{model_directory}/model_config.pt"

# Device configuration
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

# Define the type of conditioning being used (mimicking command line)
conditioning_type = "continuous_concat"

# Number of timesteps for interpolation
num_timesteps = 100
gen_len = 2048

# Create varying conditions for valence and arousal
valence = np.linspace(-1, 1, num_timesteps)
arousal = np.linspace(-1, 1, num_timesteps)

# Extend valence and arousal to match gen_len if necessary
repeat_factor = (gen_len // num_timesteps) + 1
extended_valence = np.tile(valence, repeat_factor)[:gen_len]
extended_arousal = np.tile(arousal, repeat_factor)[:gen_len]

# Convert to tensors and format them correctly
valence_tensor = torch.tensor(extended_valence, dtype=torch.float32).view(1, -1).to(device)
arousal_tensor = torch.tensor(extended_arousal, dtype=torch.float32).view(1, -1).to(device)
varying_condition = [valence_tensor, arousal_tensor]

# Prepare other required parameters for the generate function based on your script
temperatures = [1.2, 1.2]
penalty_coeff = 0.5
min_n_instruments = 2
verbose = True

# Call the generate function with the necessary arguments
from generate import generate
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