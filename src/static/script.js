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
let fileList = [];  // the file list sent all at once
let fileList_rt = []; // the file list sent in real-time

const midiPlayer = document.getElementById('midiPlayer');
var unload = true;
var stoped = false;
var start = false;



// Listen for the 'new_midi_list' event
socket.on('new_midi_list', function(data) {
    console.log("Received new MIDI files list:", data.filename);
    fileList = data.filename;
    currentFileIndex = 0;
    
    fetchAndLoadMidiFile(fileList[0],false);
});

// Listen for individual files sent in real-time
socket.on('new_midi', function(data) {
    console.log("Received new MIDI file:", data.filename);

    fileList_rt.push(data.filename);

    midiPlayer.addEventListener('load', () => { unload = false; });
    midiPlayer.addEventListener('stop', () => { stoped = true; });
    midiPlayer.addEventListener('start', () => { stoped = true; });

    console.log("File list:", fileList_rt);
    
    if (midiPlayer.playing && !unload) {
        console.log('case 1');
    } else if(!midiPlayer.playing && !unload && start){
        console.log('case 2');
    } else if (!midiPlayer.playing && !unload && stoped && !start){
        console.log('case 3');
        const nextFile = fileList_rt.shift();
        fetchAndLoadMidiFile_rt(nextFile, true);
    } else {
        console.log('case 4');
        const nextFile = fileList_rt.shift();
        fetchAndLoadMidiFile_rt(nextFile, false);
    }
});



// load the file list
function loadNextMidiFile() {
    currentFileIndex++;
    if (currentFileIndex < fileList.length) {
        fetchAndLoadMidiFile(fileList[currentFileIndex],true);
    } else {
        console.log('No next file');
    }
}

function loadNextMidiFile_rt() {
    if (fileList_rt.length>0) {
        let nextFile = fileList_rt.shift();
        fetchAndLoadMidiFile_rt(nextFile,true);
    } else {
        console.log('No next file');
    }
}



// fetch the next file
function fetchAndLoadMidiFile(filename, loaded) {
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
        }
    });

    // Listen for 'load' event
    if (loaded) {
        midiPlayer.addEventListener('load', () => {
            if (i===0 && !midiPlayer.playing) {
                midiPlayer.start();
            }
        })
    }

    /*
    const valueSetter = document.getElementById('valueSetter');
    const bsCollapse = new bootstrap.Collapse(valueSetter, {
        toggle: false
    });
    bsCollapse.hide();
    */

    document.getElementById('startButton').classList.add('disabled');
    document.getElementById('startButton').disabled = true;
  
    document.getElementById('setButton').classList.add('disabled');
    document.getElementById('setButton').disabled = true;
  
    document.getElementById('cancelButton').classList.add('disabled');
    document.getElementById('cancelButton').disabled = true;
  
    document.getElementById('reloadButton').classList.remove('disabled');
    document.getElementById('reloadButton').disabled = false;
}

function fetchAndLoadMidiFile_rt(filename, loaded) {
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
            console.log("File list:", fileList_rt);
            console.log("Playback finished. Loading next file...");
            loadNextMidiFile_rt();
        }
    });
    
    // Listen for 'load' event
    if (loaded) {
        midiPlayer.addEventListener('load', () => {
            if (i===0 && !midiPlayer.playing) {
                document.getElementById('loading_spinner').classList.remove('show');
                midiPlayer.start();
            }
        })
    }

    /*
    const valueSetter = document.getElementById('valueSetter');
    const bsCollapse = new bootstrap.Collapse(valueSetter, {
        toggle: false
    });
    bsCollapse.hide();
    */

    document.getElementById('startButton').classList.add('disabled');
    document.getElementById('startButton').disabled = true;
  
    document.getElementById('setButton').classList.remove('disabled');
    document.getElementById('setButton').disabled = false;
  
    document.getElementById('cancelButton').classList.remove('disabled');
    document.getElementById('cancelButton').disabled = false;
  
    document.getElementById('reloadButton').classList.remove('disabled');
    document.getElementById('reloadButton').disabled = false;
}



function reloadPage() {
    window.location.reload(true);
}