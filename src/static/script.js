const socket = io();

window.onload = function() {
    setupModal();

    document.getElementById('startButton').classList.remove('disabled');
    document.getElementById('startButton').disabled = false;
  
    document.getElementById('setButton').classList.remove('disabled');
    document.getElementById('setButton').disabled = false;
  
    document.getElementById('cancelButton').classList.add('disabled');
    document.getElementById('cancelButton').disabled = true;
  
    document.getElementById('reloadButton').classList.add('disabled');
    document.getElementById('reloadButton').disabled = true;
};

function updateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        if(progress < 100){
            progress += 10; // 假设每次更新增加10%
            document.getElementById('loading_progress_bar').style.width = progress + '%';
            document.getElementById('loading_progress_bar').ariaValueNow = progress;
        } else {
            clearInterval(interval);
        }
    }, 300); // 假设每300ms更新一次
}

function appendArousal() {
    document.getElementById('loading_spinner').style.display = 'block';
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

    document.getElementById('startButton').classList.add('disabled');
    document.getElementById('startButton').disabled = true;
  
    document.getElementById('setButton').classList.remove('disabled');
    document.getElementById('setButton').disabled = false;
  
    document.getElementById('cancelButton').classList.remove('disabled');
    document.getElementById('cancelButton').disabled = false;
  
    document.getElementById('reloadButton').classList.add('disabled');
    document.getElementById('reloadButton').disabled = true;
}

// 监听来自后端的 'new_midi' 事件
socket.on('new_midi', function(data) {
    document.getElementById('loading_spinner').style.display = 'none';
    console.log("Received new MIDI file:", data.filename);
    // 使用接收到的文件名从后端加载 MIDI 文件
    fetchAndLoadMidiFile(data.filename);
});

// Set up Socket.IO client
// 假设从后端接收到的 filename 已正确传递到此函数
function fetchAndLoadMidiFile(filename) {
    const midiPlayer = document.getElementById('midiPlayer');
    const midiVisualizer = document.getElementById('midiVisualizer');
    const midiFileUrl = `/get_midi/${filename}`; // 假设你的服务器能够通过这个URL提供MIDI文件

    console.log(midiFileUrl);
    midiPlayer.src = midiFileUrl;
    midiVisualizer.src = midiFileUrl;

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
    document.getElementById('reloadButton').disabled = true;
}

function reloadPage() {
    window.location.reload(true);
}
