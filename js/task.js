const start_screen = document.getElementById("start-screen");
const start_button = document.getElementById("start-task-button");
const stimulus_screen = document.getElementById("stimulus-screen");

async function main() {

}

start_button.addEventListener("click", async () => {
    start_button.disabled = true;
    start_screen.hidden = true;
    try {
        if (!document.fullscreenElement && document.fullscreenEnabled)
            await document.documentElement.requestFullscreen();
    } catch (error) { console.warn("無法進入全螢幕：", error); }
    await main();
}, { once: true });