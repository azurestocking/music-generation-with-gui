const socket = io();

window.onload = function() {
    setupModal();

    document.getElementById('startButton').classList.remove('disabled');
    document.getElementById('startButton').disabled = false;
  
    document.getElementById('setButton').classList.add('disabled');
    document.getElementById('setButton').disabled = true;
  
    document.getElementById('cancelButton').classList.add('disabled');
    document.getElementById('cancelButton').disabled = true;
  
    document.getElementById('reloadButton').classList.add('disabled');
    document.getElementById('reloadButton').disabled = true;
};

function appendArousal() {
    document.getElementById('loading_spinner').classList.add('show');

    // Retrieve the values specified by users from the range sliders
    const value1 = parseFloat(document.getElementById('slider1').value);
    const value2 = parseFloat(document.getElementById('slider2').value);
    const value3 = parseFloat(document.getElementById('slider3').value);
    const average = (value1 + value2 + value3) / 3;

    // Emit the averaged arousal value immediately
    socket.emit('arousal_update', { arousalValue: average.toFixed(2) });
}

function setupModal() {
    const modalElement = document.querySelector('.modal');

    window.showModal = function(message) {
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());

        modalElement.querySelector('.modal-body').textContent = message;
        const modalInstance = new bootstrap.Modal(modalElement);

        modalInstance.show();
        document.body.style.overflow = 'hidden';

        modalElement.addEventListener('hidden.bs.modal', function onModalHidden() {
            modalInstance.dispose();
            document.body.style.overflow = 'auto';
            modalElement.removeEventListener('hidden.bs.modal', onModalHidden);
        });
    }
}

function cancelGeneration() {
    socket.emit('stop_generation');

    document.getElementById('loading_spinner').classList.remove('show');

    const valueSetter = document.getElementById('valueSetter');
    const bsCollapse = new bootstrap.Collapse(valueSetter, {
        toggle: false
    });
    bsCollapse.hide();

    document.getElementById('startButton').classList.add('disabled');
    document.getElementById('startButton').disabled = true;

    document.getElementById('setButton').classList.add('disabled');
    document.getElementById('setButton').disabled = true;

    document.getElementById('cancelButton').classList.add('disabled');
    document.getElementById('cancelButton').disabled = true;

    document.getElementById('reloadButton').classList.remove('disabled');
    document.getElementById('reloadButton').disabled = false;
}

function startGeneration() {
    socket.emit('start_generation', { message: 'Start the generation process' });

    document.getElementById('loading_spinner').classList.add('show');

    document.getElementById('startButton').classList.add('disabled');
    document.getElementById('startButton').disabled = true;
  
    document.getElementById('setButton').classList.remove('disabled');
    document.getElementById('setButton').disabled = false;
  
    document.getElementById('cancelButton').classList.remove('disabled');
    document.getElementById('cancelButton').disabled = false;
  
    document.getElementById('reloadButton').classList.add('disabled');
    document.getElementById('reloadButton').disabled = true;
}



let currentFileIndex = 0;  // the file index currently being played
let fileList = [];  // the file list sent from backend

// Listen for the 'new_midi' event from backend
socket.on('new_midi', function(data) {
    document.getElementById('loading_spinner').style.display = 'none';
    console.log("Received new MIDI file:", data.filename);

    fetchAndLoadMidiFile(data.filename,false);
});

// Listen for the 'new_midi_list' event from backend
socket.on('new_midi_list', function(data) {
    document.getElementById('loading_spinner').style.display = 'none';
    console.log("Received new MIDI files list:", data.filename);
    fileList = data.filename;
    currentFileIndex = 0;
    
    fetchAndLoadMidiFile(fileList[0],false);
});



// Load the next file
function loadNextMidiFile() {
    currentFileIndex++;
    if (currentFileIndex < fileList.length) {
        fetchAndLoadMidiFile(fileList[currentFileIndex],true);
    } else {
        console.log('No next file');
        return;
    }
}



// Fetch and load files
function fetchAndLoadMidiFile(filename,loaded) {
    let i = 0;
    console.log('Current file index: ', currentFileIndex);

    const midiPlayer = document.getElementById('midiPlayer');
    const midiVisualizer = document.getElementById('midiVisualizer');
    const midiFileUrl = `/get_midi/${filename}`;

    midiPlayer.src = midiFileUrl;
    midiVisualizer.src = midiFileUrl;
    
    midiPlayer.reload();
   
    // Move to the next segment
    midiPlayer.addEventListener('stop', () => {
        if (midiPlayer.currentTime >= midiPlayer.duration - 0.001 && i===0) {
            i++;
            console.log("Playback finished. Loading next file...");
            loadNextMidiFile();
        } else {
            console.log("Exit accidentally because the current time does not reach the exact duration.");
        }
    });

    // Listen for 'load' event
    if(loaded){
        midiPlayer.addEventListener('load', () => {
            if(i===0 && !midiPlayer.playing){
                midiPlayer.start();
            }
        })
    }

    const valueSetter = document.getElementById('valueSetter');
    const bsCollapse = new bootstrap.Collapse(valueSetter, {
        toggle: false
    });
    bsCollapse.hide();

    document.getElementById('startButton').classList.add('disabled');
    document.getElementById('startButton').disabled = true;
  
    document.getElementById('setButton').classList.add('disabled');
    document.getElementById('setButton').disabled = true;
  
    document.getElementById('cancelButton').classList.add('disabled');
    document.getElementById('cancelButton').disabled = true;
  
    document.getElementById('reloadButton').classList.remove('disabled');
    document.getElementById('reloadButton').disabled = false;
}



function reloadPage() {
    window.location.reload(true);
}