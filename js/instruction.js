const cover = document.querySelector('.cover');
const instruction = document.querySelector('.instruction');
const sections = document.querySelectorAll('.instruction > section');
const navigation = document.querySelector('.navigation');

const start_button = document.getElementById('start-button');
const next_button = document.getElementById('next-button');
const back_button = document.getElementById('back-button');
const page_position = document.getElementById('page-position');

const practice_section = document.getElementById('practice-section');

let position = -1;

function show_page(new_position) {
    position = new_position;
    cover.hidden = position !== -1;
    instruction.hidden = position === -1;
    navigation.hidden = position === -1;
    sections.forEach((section, index) => { section.hidden = index !== position; });

    if (position === -1) return;
    page_position.textContent = `${position + 1}/${sections.length}`;

    const press_space = (position === 2) || (position === 3);
    back_button.disabled = false;
    next_button.disabled = press_space;
    next_button.textContent = press_space ? '請按空白鍵' : '下一頁';
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
    const letters = ["B", "S", "T", "M", "T", "K", "N", "R", "Y", "R", "T"];
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

    for (const [index, l] of letters.entries()) {
        const time = (index === 0) ? 1000 : 2000;
        timestamp = await wait_until(timestamp + time, () => {
            const same = index >= n && l === letters[index - n];

            correct_response = same ? "F" : "J";
            answered = false;

            hide_elements([feedback]);
            letter.textContent = l;
            show_elements([letter]);
        });
    }

    await wait_until(timestamp + 2000, () => {
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
        }
        return;
    };

    if (position === 3 && !practicing) {}
});

document.addEventListener("keydown", (event) => {
    if (!practicing || event.repeat) return;
    if (event.code !== "KeyF" && event.code !== "KeyJ") return;

    const letter = practice_section.querySelector(".letter");
    const feedback = practice_section.querySelector(".feedback");

    if (letter.hidden || answered || correct_response === null) return;

    event.preventDefault();
    answered = true;

    const response = event.code === "KeyF" ? "F" : "J";
    const correct = response === correct_response;

    feedback.textContent = correct ? "答對！" : "答錯！";
    feedback.style.color = correct ? "darkgreen" : "firebrick";
    show_elements([feedback]);
});

show_page(-1);