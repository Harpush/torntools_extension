// #region Skill Level Star

const skillLevelStarConfig = {
	0: {
		start: 1,
		end: 1,
	},
	1: {
		start: 2,
		end: 24,
	},
	2: {
		start: 25,
		end: 49,
	},
	3: {
		start: 50,
		end: 74,
	},
	4: {
		start: 75,
		end: 99,
	},
	5: {
		start: 100,
		end: 100,
	},
};
const skillLevelStartBgInitial = -10;
const skillLevelStartBgJumps = -35;

function createSkillLevelStarIcon(skillLevel) {
	const group = Object.keys(skillLevelStarConfig).find((key) => {
		const config = skillLevelStarConfig[key];

		return skillLevel >= config.start && skillLevel <= config.end;
	});
	const row = skillLevel - skillLevelStarConfig[group].start;
	const groupBackgroundPositionX = skillLevelStartBgInitial + skillLevelStartBgJumps * group;
	const rowBackgroundPositionY = skillLevelStartBgInitial + skillLevelStartBgJumps * row;

	return document.newElement({
		type: "div",
		class: "tt-crimes-uniques-star",
		attributes: { title: `Required skill level ${skillLevel}` },
		children: [
			document.newElement({
				type: "div",
				class: "tt-crimes-uniques-star-icon",
				style: {
					backgroundPosition: `${groupBackgroundPositionX}px center`,
				},
			}),
			document.newElement({
				type: "div",
				class: "tt-crimes-uniques-star-level",
				style: {
					backgroundPosition: `${groupBackgroundPositionX}px ${rowBackgroundPositionY}px`,
				},
			}),
		],
	});
}

// #endregion

function createUniqueItem(children, subscriptionData) {
	function createSubscriptionElement(isSubscribed) {
		return document.newElement({
			type: "div",
			class: ["fa", "fa-bell", "tt-crimes-uniques-notification-icon", ...(isSubscribed ? ["subscribed"] : [])],
			attributes: {
				title: isSubscribed ? "Click to unsubscribe" : "Click to subscribe",
			},
			events: {
				click: () => {
					subscriptionData.subscribeChangeFn(!isSubscribed);
					subscriptionElement.replaceWith((subscriptionElement = createSubscriptionElement(!isSubscribed)));
				},
			},
		});
	}

	let subscriptionElement;

	return document.newElement({
		type: "div",
		class: "tt-crimes-uniques-unique-item",
		children: [...children, ...(subscriptionData ? [(subscriptionElement = createSubscriptionElement(subscriptionData.isSubscribed))] : [])],
	});
}

function createUniquesSection(crimeId, subCrime, buildUniqueItemChildrenFn, subscriptionData) {
	return document.newElement({
		type: "div",
		children: [
			document.newElement({
				type: "div",
				text: subCrime.name,
				class: "tt-crimes-uniques-section-title",
			}),
			document.newElement({
				type: "div",
				class: "tt-crimes-uniques-section-content",
				children: subCrime.unique_outcomes.map((uniqueOutcomeInfo) =>
					createUniqueItem(buildUniqueItemChildrenFn(uniqueOutcomeInfo), {
						isSubscribed: subscriptionData.subscriptionsMap[uniqueOutcomeInfo.id],
						subscribeChangeFn: (isSubscribed) =>
							subscriptionData.subscribeChangeFn({ isSubscribed, crimeId, subCrimeId: subCrime.id, uniqueId: uniqueOutcomeInfo.id }),
					})
				),
			}),
		],
	});
}

async function createCrimesUniquesContainer(root, crimeId, buildUniqueItemChildrenFn, subscriptionData) {
	const { content, container } = createContainer("Uniques", { parentElement: root, spacer: true });

	showLoadingPlaceholder(content, true);

	const response = await ttCache.getOrAdd({
		section: "uniqueCrimes",
		ttl: 1 * 24 * 60 * 60 * 1000,
		fn: async () => await fetchData("torn_report", { section: "crimes" }),
	});

	showLoadingPlaceholder(content, false);

	const uniquesInfo = response.crimes.find((crime) => crime.id === crimeId);

	for (const subCrime of uniquesInfo.subcrimes) {
		content.appendChild(createUniquesSection(crimeId, subCrime, buildUniqueItemChildrenFn, subscriptionData));
	}

	function dispose() {
		container.remove();
	}

	return { dispose };
}
