requireDatabase().then(() => {
	console.log("TT - Loader");
	if (settings.pages.attack.warn_when_stacking && getSearchParameters().get("ID") === null) displayWarning();
	if (settings.pages.attack.warn_when_attack_timeout) requireElement("div[class^='labelsContainer_'] span[class^='labelTitle_'] span[id^='timeout-value']").then(warnAttackTimeout);
});

function displayWarning() {
	if (userdata.energy.current > userdata.energy.maximum && userdata.chain.current > 0) {
		let rawHTML = `<div class='tt-overlay-div'><span class='tt-overlay-text'>Warning! You have stacked energy. Beware!</span><button class='tt-overlay-button'>OK</button></div>`;
		doc.find("a[href='#skip-to-content']").insertAdjacentHTML("afterEnd", rawHTML);
		doc.find("button.tt-overlay-button").addEventListener("click", (event) => (event.target.parentElement.style.display = "none"));
	}
}

function warnAttackTimeout() {
	let timeoutIntervalId;
	let attackObserver = new MutationObserver(() => {
		let attackTimerParts = doc.find("div[class^='labelsContainer_'] span[class^='labelTitle_'] span[id^='timeout-value']").innerText.split(":");
		let attackTimer = parseInt(attackTimerParts[0]) * 60 + parseInt(attackTimerParts[1]);
		if (attackTimer === 0 || attackTimer > 60 || doc.find("div[class^='dialogButtons_']")) clearInterval(timeoutIntervalId);
		if (timeoutIntervalId) return;
		if (attackTimer !== 0 && attackTimer < 60) timeoutIntervalId = setInterval(() => {
			let audio = new Audio(chrome.runtime.getURL(`/audio/notification${parseInt(settings.notifications_sound) ? settings.notifications_sound : 1}.wav`));
			audio.volume = settings.notifications_volume;
			audio.play();
		}, 1000);
	});
	attackObserver.observe(doc.find("div[class^='labelsContainer_'] span[class^='labelTitle_'] span[id^='timeout-value']"), { characterData: true, childList: true, subtree: true });
}
