const cover = document.querySelector('.cover');
const instruction = document.querySelector('.instruction');
const sections = document.querySelectorAll('.instruction > section');
const navigation = document.querySelector('.navigation');

const start_button = document.getElementById('start-button');
const next_button = document.getElementById('next-button');
const back_button = document.getElementById('back-button');
const page_position = document.getElementById('page-position');

const practice_1 = document.getElementById('practice-1');

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

function wait_until(target_timestamp) {
    return new Promise((resolve) => {
        function check_time(timestamp) {
            if (timestamp >= target_timestamp) {
                resolve(timestamp);
            }else { requestAnimationFrame(check_time); }
        }
        requestAnimationFrame(check_time);
    });
}

function show_elements(elements) {
    return new Promise((resolve) => {
        requestAnimationFrame((timestamp) => {
            elements.forEach((e) => { e.hidden = false; });
            resolve(timestamp);
        });
    });
}

function hide_elements(elements) {
    return new Promise((resolve) => {
        requestAnimationFrame((timestamp) => {
            elements.forEach((e) => { e.hidden = true; });
            resolve(timestamp);
        });
    });
}

async function practice(section, n) {
    const letters = ["B", "S", "T", "M", "T", "K", "N", "R", "Y", "R", "T",];
    const letter = section.querySelector(".letter");
    const fixation = section.querySelector(".fixation");
    const msg = section.querySelector(".msg");

    let timestamp = await hide_elements([letter, fixation, msg]);
    await wait_until(timestamp + 1000);

    timestamp = await show_elements([fixation]);
    await wait_until(timestamp + 1000);

    timestamp = await hide_elements([fixation]);
    await wait_until(timestamp + 1000);

    for(const l of letters) {
        letter.textContent = l;
        timestamp = await show_elements([letter]);
        await wait_until(timestamp + 1000);
    }

    await hide_elements([letter]);
    await show_elements([msg]);
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
            await practice(practice_1, 2);
        } finally {
            practicing = false;
            show_page(3);
        }
        return;
    };

    if (position === 3 && !practicing) {}
});

show_page(-1);