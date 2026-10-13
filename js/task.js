const DATABASE_ENDPOINT = 
"https://script.google.com/macros/s/AKfycbwkww2vnxYGICPaIZ-KM6KcCdXUgSVfq-XH4C0R2y2uvKdwa5VgkbpDUodQTy-jcds/exec";

const start_screen = document.getElementById("start-screen");
const stimulus_screen = document.getElementById("stimulus-screen");
const instruction_screen = document.getElementById("instruction");
const msg_screen = document.getElementById("msg-screen");
const upload_screen = document.getElementById("upload-screen");
const upload_msg = upload_screen.querySelector("p");

const letter = stimulus_screen.querySelector(".letter");
const fixation = stimulus_screen.querySelector(".fixation");
const continue_btn = document.getElementById("continue");

const participant_id = sessionStorage.getItem("participant_id");

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
};

const key_map = {
    KeyF: "F",
    KeyJ: "J"
};

const time_limit = 1800;
const gray_duration = 1500;
const results = [];

let response_timestamp = null;
let stimulus_timestamp = null;
let response = null;
let rt = null;

let testing = false;
let correct_response = null;
let answered = false;

function show_elements(elements) {
    elements.forEach((e) => { e.hidden = false; });
}

function hide_elements(elements) {
    elements.forEach((e) => { e.hidden = true; });
}

function wait_until(target_timestamp, action = () => {}) {
    return new Promise((resolve) => {
        function check_time(timestamp) {
            if (timestamp >= target_timestamp) {
                action(timestamp);
                resolve(timestamp);
            } else {
                requestAnimationFrame(check_time);
            }
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

function wait_for_space() {
    return new Promise((resolve) => {
        function on_keydown(event) {
            if (event.code !== "Space" || event.repeat) return;

            event.preventDefault();
            document.removeEventListener("keydown", on_keydown);
            resolve();
        }

        document.addEventListener("keydown", on_keydown);
    });
}

function record_result(n, trial) {
    results.push({
        stimulus_timestamp,
        response_timestamp: response_timestamp ?? "Timeout",
        participant_id,
        trial,
        condition: `${n}-back_Trials`,
        response: response === null
            ? "Timeout"
            : response === "F" ? "Yes" : "No",
        accuracy: answered && response === correct_response ? 1 : 0,
        correct_answer: correct_response === "F" ? "Yes" : "No",
        rt: rt ?? "Timeout"
    });
}

async function upload_results(results) {
    const payload = { results: results };
    const response = await fetch(DATABASE_ENDPOINT, {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=utf-8"},
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
}

async function n_back(n) {
    if (n !== 2 && n !== 3) return;
    const letters = letters_map[n];

    let timestamp = await wait_until(0, () => {
        testing = true;
        correct_response = null;
        answered = false;
        hide_elements([letter, fixation]);
    });

    timestamp = await wait_until(timestamp + 1000, () => {
        show_elements([fixation]);
    });

    timestamp = await wait_until(timestamp + 1000, () => {
        hide_elements([fixation]);
    });

    // 注視點消失後，等待 1000 ms 再顯示第一個字母。
    timestamp = await wait_until(timestamp + 1000);

    for (const [index, l] of letters.entries()) {
        const same = index >= n && l === letters[index - n];
        correct_response = same ? "F" : "J";

        answered = false;
        response = null;
        rt = null;
        response_timestamp = null;
        stimulus_timestamp = timestamp;

        letter.style.color = "";
        letter.textContent = l;
        show_elements([letter]);

        // 最多等待 1800 ms，收到作答就提前結束。
        timestamp = await wait_for_response();

        // 字母已在按鍵事件中變灰，保留到按鍵後 1500 ms。
        if (answered)
            timestamp = await wait_until(
                response_timestamp + gray_duration
            );

        // 每題結束後立即記錄，包含最後一題。
        record_result(n, index + 1);
    }

    testing = false;
    correct_response = null;
    stimulus_timestamp = null;
    hide_elements([letter]);
}

async function main() {
    if (!participant_id) {
        window.location.href = "participant_info.html";
        return;
    }

    show_elements([stimulus_screen]);
    await n_back(2);

    // 在同一頁顯示 3-back 說明，等待空白鍵。
    hide_elements([stimulus_screen]);
    show_elements([instruction_screen]);
    await wait_for_space();

    try {
        if (!document.fullscreenElement && document.fullscreenEnabled)
            await document.documentElement.requestFullscreen();
    } catch (error) {
        console.warn("無法進入全螢幕：", error);
    }

    hide_elements([instruction_screen]);
    show_elements([stimulus_screen]);
    await n_back(3);

    // 此時 results 共包含 50 + 60 = 110 筆結果。
    hide_elements([stimulus_screen]);

    upload_msg.textContent = "測驗已完成，資料上傳中，請勿關閉視窗。"
    show_elements([upload_screen]);

    try {
        await upload_results(results);
        upload_msg.textContent = "資料上傳完成，感謝您的參與！";
    } catch (error) {
        console.error("資料上傳未確認成功：", error);
        upload_msg.textContent =
            "資料上傳未確認成功，請通知實驗人員，並保留此頁面。";
        return;
    } finally { sessionStorage.removeItem("participant_id"); }

    await wait_until(performance.now() + 2000);

    try {
        if (document.fullscreenElement)
            await document.exitFullscreen();
    } catch (error) {
        console.warn("無法離開全螢幕：", error);
    }

    hide_elements([upload_screen]);
    show_elements([msg_screen]);
}

// 統一初始畫面。
show_elements([start_screen]);
hide_elements([
    stimulus_screen,
    instruction_screen,
    msg_screen,
    letter,
    fixation,
    upload_screen
]);

document.addEventListener("keydown", async (event) => {
    if (event.code !== "Space" || event.repeat || start_screen.hidden) return;
    event.preventDefault();

    start_screen.hidden = true;

    try {
        if (!document.fullscreenElement && document.fullscreenEnabled)
            await document.documentElement.requestFullscreen();
    } catch (error) {
        console.warn("無法進入全螢幕：", error);
    }

    await main();
});

document.addEventListener("keydown", (event) => {
    if (!testing || event.repeat) return;
    if (!(event.code in key_map)) return;
    if (letter.hidden || answered || correct_response === null) return;

    event.preventDefault();

    const current_timestamp = performance.now();
    const elapsed = current_timestamp - stimulus_timestamp;

    if (elapsed < 0 || elapsed >= time_limit) return;

    answered = true;
    response = key_map[event.code];
    response_timestamp = current_timestamp;
    rt = elapsed;
    letter.style.color = "gray";
});

continue_btn.addEventListener("click", () => {
    window.location.href =
        "https://pinecone1215.github.io/pal-task-chinese/participant_info.html";
});