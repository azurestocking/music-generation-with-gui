let arousalValues = [];
let changePoints = [];

let lastPosition = 0;
let savedPosition = [];
let isStartingValueSet = false;

window.onload = function() {
    setupSlider();
    document.getElementById('valueSetterBtn').addEventListener('click', toggleValueSetter);
    setupModal();
};

function setupSlider() {
    const slider = document.getElementById('mainSlider');
    slider.addEventListener('input', function() {
        // Prevent slider from moving backwards
        if (parseInt(slider.value, 10) <= lastPosition) {
            slider.value = lastPosition;
        } else {
            collapseValueSetter();
        }

        // Check if the user moves the slider from position 0 without specifying any value
        if (slider.value !== '0' && !isStartingValueSet) {
            showModal("Please set an arousal value for position 0 before moving the slider.");
            slider.value = '0';
        }

        console.log("All backdrops in DOM:", document.querySelectorAll('.modal-backdrop'));
    });
}

function toggleValueSetter() {
    const valueSetter = document.getElementById('valueSetter');
    new bootstrap.Collapse(valueSetter, {toggle: true}).toggle();
}

function collapseValueSetter() {
    const valueSetter = document.getElementById('valueSetter');
    if (new bootstrap.Collapse(valueSetter, {toggle: false})._isShown()) {
        new bootstrap.Collapse(valueSetter).hide();
    }
}

function appendArousal() {
    const slider = document.getElementById('mainSlider');
    const position = slider.value;

    // Check if any value has already been specified for this position
    if (savedPosition.includes(position)) {
        showModal("Arousal value for this position has already been set. Please choose a different position.");
        return;
    }

    // Mark starting values specifically
    if (position === '0') {
        isStartingValueSet = true;
    }

    // Add this position to the existing position list with specified values
    savedPosition.push(position);
    lastPosition = parseInt(position, 10);
    slider.value = lastPosition;
    changePoints = [...savedPosition];

    // Retrieve the values specified by users from the range sliders
    const value1 = parseFloat(document.getElementById('slider1').value);
    const value2 = parseFloat(document.getElementById('slider2').value);
    const value3 = parseFloat(document.getElementById('slider3').value);
    const average = (value1 + value2 + value3) / 3;
    arousalValues.push(average.toFixed(2));

    // Display the values specified by users
    updateIndicators();
}

function updateIndicators() {
    const arousalListContainer = document.getElementById('arousal_list');

    arousalListContainer.innerHTML = '';

    changePoints.forEach((point, index) => {
        const arousalValueIndicator = document.createElement('div');
        arousalValueIndicator.className = 'indicator';
        arousalValueIndicator.style.left = (point / 3072 * 100) + '%';
        arousalValueIndicator.innerText = arousalValues[index];
        arousalListContainer.appendChild(arousalValueIndicator);
    });
}

function submitForm() {
    collapseValueSetter();
    showModal('Values submitted successfully.');

    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'block';

    fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            change_points: changePoints,
            arousal_values: arousalValues
        })
    }).then(response => response.json())
    .then(data => {
        spinner.style.display = 'none';
        showModal(data.message);

        if (data.midi_url) {
            const player = document.getElementById('midiPlayer');
            player.src = data.midi_url;
            player.reload();
        }
    }).catch(error => {
        console.error('Error:', error);
        spinner.style.display = 'none';
        showModal('Failed to generate music, please try again.');
    });
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

function reloadPage() {
    window.location.reload(true);
}