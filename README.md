# Music Generator v2

## Progress

Capabilities:

* Allows clipping and queuing of music segments from a full-length generated piece.
* Plays the queued clips automatically in the frontend once generation is completed.

TODOs:

* Plays the queued clips on the fly.

## Prerequisite

* Python 3.8
* Node.js 14.21.3

## Installation

To setup the environment: 

```
npm install -g http-server
```

```
pip install -r requirements.txt
```

## Usage

To create the Lakh-Spotify dataset:

- Go to the ```src/create_dataset``` folder

- Download the datasets:
  - [Lakh pianoroll 5 full dataset](https://ucsdcloud-my.sharepoint.com/personal/h3dong_ucsd_edu/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fh3dong%5Fucsd%5Fedu%2FDocuments%2Fdata%2Flpd%2Flpd%5F5%2Flpd%5F5%5Ffull%2Etar%2Egz&parent=%2Fpersonal%2Fh3dong%5Fucsd%5Fedu%2FDocuments%2Fdata%2Flpd%2Flpd%5F5&ga=1)
  - MSD summary file
    http://labrosa.ee.columbia.edu/millionsong/sites/default/files/AdditionalFiles/msd_summary_file.h5
  - Echonest mapping dataset
    ```ftp://ftp.acousticbrainz.org/pub/acousticbrainz/acousticbrainz-labs/download/msdrosetta/millionsongdataset_echonest.tar.bz2``` or https://drive.google.com/file/d/1AZctGV7WysvsAaDCPWM1GVBvgaFz2Dys/view?usp=sharing
  - Lakh-MSD matching scores file
    http://hog.ee.columbia.edu/craffel/lmd/match_scores.json
  
- Extract when necessary, and place all inside folder ```./data_files```

- Get Spotify client ID and client secret:
https://developer.spotify.com/dashboard/applications
Then, fill in the variables "client_id" and "client_secret" in ```src/create_dataset/utils.py```

- Run ```run.py```

To preprocess and create the training dataset:

- Go to the ```src/data``` folder and run ```preprocess_pianorolls.py```

To train:

- Go to ```src``` folder and run ```train.py``` with appropriate arguments. e.g:
```python train.py --conditioning continuous_concat```

To generate MIDI using pretrained models without style interpolation:

- Download model(s) from the following link:
https://drive.google.com/drive/folders/1R5-HaXmNzXBAhGq1idrDF-YEKkZm5C8C?usp=sharing

- Extract into the folder ```output```

- Go to ```src``` folder and run ```generate.py``` with appropriate arguments. e.g:
  ```python generate.py --model_dir continuous_concat --conditioning continuous_concat --valence -0.8 -0.8 0.8 0.8 --arousal -0.8 -0.8 0.8 0.8```
  - There are 4 different conditioning modes:
      - ```none```: no conditioning, vanilla model
      - ```discrete_token```: conditioning using discrete tokens, i.e. control tokens
      - ```continuous_token```: conditioning using continuous values embedded as vectors, then prepended to the other embedded tokens in sequence dimension
      - ```continuous_concat```: conditioning using continuous values embedded as vectors, then concatenated to all other embedded tokens in channel dimension

  - See ```config.py``` for all options

To generate MIDI using pretrained models with style interpolation:

* Replicate the previous steps
* Go to ```src``` folder and modify `vary.py`
* Run `vary.py`

To generate MIDI using pretrained models with style interpolation on user interface:

* Replicate the previous steps
* Go to ```src``` folder and run `flask run` 
* Designate the change points and arousal values for each point in the browser

## Reference

* Sulun, Serkan, Matthew E. P. Davies, and Paula Viana. 2022. “Symbolic Music Generation Conditioned on Continuous-Valued Emotions.” IEEE Access 10: 44617–26. https://doi.org/10.1109/ACCESS.2022.3169744.
