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
    3: '請按 F/J 鍵'
};

const key_map = {
    KeyF: "F",
    KeyJ: "J"
};

const time_limit = 1800;
const feedback_duration = 1500;

let stimulus_timestamp = null;
let response_timestamp = null;
let correct_response = null;
let answered = false;

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

function wait_for_response() {
    return new Promise((resolve) => {
        function check_time(timestamp) {
            if (answered || timestamp >= stimulus_timestamp + time_limit) {
                resolve(timestamp);
            } else {
                requestAnimationFrame(check_time);
            }
        }

        requestAnimationFrame(check_time);
    });
}

function show_elements(elements) { elements.forEach((e) => { e.hidden = false; }); }
function hide_elements(elements) { elements.forEach((e) => { e.hidden = true; }); }

async function practice(section, n) {
    const letters_practice = [
        "B", "S", "B", "T", "M", "T",
        "K", "N", "R", "Y", "R", "T"
    ];

    const letter = section.querySelector(".letter");
    const fixation = section.querySelector(".fixation");
    const feedback = section.querySelector(".feedback");
    const msg = section.querySelector(".msg");

    let timestamp = await wait_until(0, () => {
        correct_response = null;
        answered = false;
        stimulus_timestamp = null;
        response_timestamp = null;

        hide_elements([letter, fixation, msg, feedback]);
    });

    timestamp = await wait_until(timestamp + 1000, () => {
        show_elements([fixation]);
    });

    timestamp = await wait_until(timestamp + 1000, () => {
        hide_elements([fixation]);
    });

    // 注視點消失後，等待 1000 ms。
    timestamp = await wait_until(timestamp + 1000);

    for (const [index, l] of letters_practice.entries()) {
        timestamp = await wait_until(0, (frame_timestamp) => {
            const same =
                index >= n && l === letters_practice[index - n];

            answered = false;
            response_timestamp = null;
            correct_response = same ? "F" : "J";

            letter.textContent = l;
            letter.style.removeProperty("color");

            hide_elements([feedback]);
            show_elements([letter]);

            stimulus_timestamp = frame_timestamp;
        });

        // 字母最多顯示 1800 ms，收到作答就提前結束等待。
        timestamp = await wait_for_response();

        // 有作答時，灰色字母及正誤回饋保留至按鍵後 1500 ms。
        if (answered) {
            timestamp = await wait_until(
                response_timestamp + feedback_duration
            );
        }

        correct_response = null;
        hide_elements([letter, feedback]);
    }

    // 全部練習完成後，才顯示結束訊息。
    show_elements([msg]);
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

    const now = performance.now();

    // 超過作答期限，不接受這次按鍵。
    if (now >= stimulus_timestamp + time_limit) return;

    response_timestamp = now;
    answered = true;

    const response = key_map[event.code];
    const correct = response === correct_response;

    letter.style.color = "gray";

    feedback.textContent = correct ? "答對！" : "答錯！";
    feedback.style.color = correct ? "darkgreen" : "firebrick";
    show_elements([feedback]);
});

show_page(-1);