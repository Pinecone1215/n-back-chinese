const start_screen = document.getElementById("start-screen");
const stimulus_screen = document.getElementById("stimulus-screen");
const letter = stimulus_screen.querySelector(".letter");
const fixation = stimulus_screen.querySelector(".fixation");

const letters_2_back = [
    "B", "P", "C", "P", "V", "T", "V", "R", "B", "R",
    "C", "D", "C", "Q", "X", "G", "R", "D", "P", "D",
    "Q", "G", "Q", "L", "K", "L", "X", "D", "P", "T",
    "S", "Q", "S", "T", "B", "T", "L", "K", "L", "D",
    "P", "X", "P", "G", "C", "G", "D", "B", "Q", "B"
];

const letters_3_back = [
    "N", "O", "X", "R", "O", "V", "T", "E", "V", "C",
    "N", "P", "R", "V", "P", "R", "M", "B", "C", "Q",
    "B", "N", "V", "B", "T", "M", "H", "T", "O", "H",
    "R", "O", "R", "V", "B", "G", "V", "B", "D", "P",
    "E", "D", "W", "M", "H", "W", "T", "F", "W", "X",
    "D", "H", "X", "P", "C", "M", "P", "O", "B", "X"
];

const letters_map = {
    2: letters_2_back,
    3: letters_3_back
}

function show_elements(elements) { elements.forEach((e) => { e.hidden = false; }); }
function hide_elements(elements) { elements.forEach((e) => { e.hidden = true; }); }
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

let testing = false;
let correct_response = null;
let answered = false;
async function n_back(n) {
    if(n !== 2 && n !== 3) return;
    const letters = letters_map[n];

    let timestamp = await wait_until(0, () => {
        testing = true;
        correct_response = null;
        answered = false;
        hide_elements([letter, fixation]);
    });

    timestamp = await wait_until(timestamp + 1000, () => { show_elements([fixation]); });
    timestamp = await wait_until(timestamp + 1000, () => { hide_elements([fixation]); });

    for (const [index, l] of letters.entries()) {
        const time = (index === 0) ? 1000 : 2000;
        timestamp = await wait_until(timestamp + time, () => {
            const same = index >= n && l === letters[index - n];

            correct_response = same ? "F" : "J";
            answered = false;
            letter.style.color = "";
            letter.textContent = l;
            show_elements([letter]);
        });
    }

    await wait_until(timestamp + 2000, () => {
        testing = false;
        correct_response = null;
        hide_elements([letter]);
    });
}

async function main() {
    stimulus_screen.hidden = false;
    await n_back(2);
}

document.addEventListener('keydown', async (event) => {
    if (event.code !== 'Space' || event.repeat || start_screen.hidden) return;
    event.preventDefault();

    start_screen.hidden = true;

    try {
        if (!document.fullscreenElement && document.fullscreenEnabled)
            await document.documentElement.requestFullscreen();
    } catch (error) { console.warn("無法進入全螢幕：", error); }
    await main();
});

document.addEventListener("keydown", (event) => {
    if (!testing || event.repeat) return;
    if (event.code !== "KeyF" && event.code !== "KeyJ") return;
    if (letter.hidden || answered || correct_response === null) return;

    event.preventDefault();
    letter.style.color = "gray";
    answered = true;

    const response = event.code === "KeyF" ? "F" : "J";
    const correct = response === correct_response;
    console.log("letter: ", letter.textContent);
    console.log("response: ", response);
    console.log("correct: ", correct);
});