const cover = document.querySelector('.cover');
const instruction = document.querySelector('.instruction');
const sections = document.querySelectorAll('.instruction > section');
const navigation = document.querySelector('.navigation');
const start_button = document.getElementById('start-button');
const next_button = document.getElementById('next-button');
const back_button = document.getElementById('back-button');
const page_position = document.getElementById('page-position');
const practice_section = document.getElementById('practice-section');

const pos_map = {
    2: '請按空白鍵',
    3: '請按 2/4 鍵'
};

const key_map = {
    Digit2: "2",
    Numpad2: "2",
    Digit4: "4",
    Numpad4: "4"
};

let position = -1;
function show_page(new_position) {
    position = new_position;
    cover.hidden = position !== -1;
    instruction.hidden = position === -1;
    navigation.hidden = position === -1;
    sections.forEach((section, index) => { section.hidden = index !== position; });

    if (position === -1) return;
    page_position.textContent = `${position + 1}/${sections.length}`;

    const keyboard_page = position in pos_map;
    back_button.disabled = false;
    next_button.disabled = keyboard_page;
    next_button.textContent = keyboard_page ? pos_map[position] : '下一頁';
}

function wait_until(target_timestamp, action = () => {}) {
    return new Promise((resolve) => {
        function check_time(timestamp) {
            if (timestamp >= target_timestamp) {
                action(timestamp);
                resolve(timestamp);
            } else { requestAnimationFrame(check_time); }
        }
        requestAnimationFrame(check_time);
    });
}

function show_elements(elements) { elements.forEach((e) => { e.hidden = false; }); }
function hide_elements(elements) { elements.forEach((e) => { e.hidden = true; }); }

let correct_response = null;
let answered = false;
async function practice(section, n) {
    const letters_practice = ["B", "S", "B", "T", "M", "T", "K", "N", "R", "Y", "R", "T"];
    const letter = section.querySelector(".letter");
    const fixation = section.querySelector(".fixation");
    const feedback = section.querySelector(".feedback");
    const msg = section.querySelector(".msg");

    let timestamp = await wait_until(0, () => {
        correct_response = null;
        answered = false;
        hide_elements([letter, fixation, msg, feedback]);
    });

    timestamp = await wait_until(timestamp + 1000, () => { show_elements([fixation]); });
    timestamp = await wait_until(timestamp + 1000, () => { hide_elements([fixation]); });

    for (const [index, l] of letters_practice.entries()) {
        const time = (index === 0) ? 1000 : 1800;
        timestamp = await wait_until(timestamp + time, () => {
            const same = index >= n && l === letters_practice[index - n];

            correct_response = same ? "2" : "4";
            answered = false;

            hide_elements([feedback]);
            letter.textContent = l;
            show_elements([letter]);
        });
    }

    await wait_until(timestamp + 1800, () => {
        correct_response = null;
        hide_elements([letter, feedback]);
        show_elements([msg]);
    });
}

start_button.addEventListener('click', () => { show_page(0); });
back_button.addEventListener('click', () => { if (position >= 0) show_page(position - 1); });
next_button.addEventListener('click', () => { if (position < sections.length - 1) { show_page(position + 1); } });

let practicing = false;
document.addEventListener('keydown', async (event) => {
    if (event.code !== 'Space' || event.repeat) return;
    event.preventDefault();

    if (position === 2) {
        show_page(3);
        back_button.disabled = true;
        next_button.disabled = true;

        try {
            practicing = true;
            await practice(practice_section, 2);
        } finally {
            practicing = false;
            show_page(3);
            next_button.textContent = '請按空白鍵';
        }
        return;
    };

    if (position === 3 && !practicing) {
        window.location.href = `task.html`;
    }
});

document.addEventListener("keydown", (event) => {
    if (!practicing || event.repeat) return;
    if (!(event.code in key_map)) return;

    const letter = practice_section.querySelector(".letter");
    const feedback = practice_section.querySelector(".feedback");

    if (letter.hidden || answered || correct_response === null) return;

    event.preventDefault();
    answered = true;

    const response = key_map[event.code];
    const correct = response === correct_response;

    feedback.textContent = correct ? "答對！" : "答錯！";
    feedback.style.color = correct ? "darkgreen" : "firebrick";
    show_elements([feedback]);
});

show_page(-1);