"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Crimes Uniques",
		"crimes2",
		() => settings.pages.crimes2.crimesUniques,
		null,
		initialize,
		teardown,
		{
			storage: ["settings.pages.crimes2.crimesUniques"],
		},
		null
	);

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

	// TODO: Check unique ids
	const crimesUniquesConfig = {
		// shoplifting
		4: {
			"Sally's Sweet Shop": [
				{
					id: 12529,
					skillLevel: 20,
					securityMeasure1: {
						type: "cameras",
						amount: 1,
						requirement: "off",
					},
					securityMeasure2: undefined,
				},
				{
					id: 12530,
					skillLevel: 40,
					securityMeasure1: {
						type: "cameras",
						amount: 1,
						requirement: "on",
					},
					securityMeasure2: undefined,
				},
			],
			"Bits 'n' Bobs": [
				{
					id: 12614,
					skillLevel: 1,
					securityMeasure1: {
						type: "cameras",
						amount: 2,
						requirement: "off",
					},
					securityMeasure2: undefined,
				},
			],
		},
	};

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

	function createSecurityMeasureIcon(securityMeasureConfig) {
		const noun =
			securityMeasureConfig.type === "cameras"
				? securityMeasureConfig.amount === 1
					? "Camera"
					: "Cameras"
				: securityMeasureConfig.type === "cameras"
				? securityMeasureConfig.amount === 1
					? "Guard"
					: "Guard"
				: "Checkpoint";
		const state = securityMeasureConfig.requirement === "off" ? "Disabled" : "Enabled";
		const title = `Required status: ${noun} - ${state}`;

		return document.newElement({
			type: "div",
			class: "tt-crimes-uniques-security-measure",
			attributes: { title },
			children: [
				document.newElement({
					type: "div",
					class: "tt-crimes-uniques-security-measure-icon",
					style: {
						backgroundPositionY: `${-36 * (securityMeasureConfig.amount - 1)}px`,
					},
				}),
				document.newElement({
					type: "div",
					class: "tt-crimes-uniques-security-measure-border",
				}),
				...(securityMeasureConfig.requirement === "off"
					? [
							document.newElement({
								type: "div",
								class: "tt-crimes-uniques-security-measure-off",
							}),
					  ]
					: []),
			],
		});
	}

	function createUniqueItem(uniqueItemConfig, isSubscribed, subscribeChangeFn) {
		return document.newElement({
			type: "div",
			class: "tt-crimes-uniques-unique-item",
			children: [
				...(uniqueItemConfig.skillLevel !== undefined ? [createSkillLevelStarIcon(uniqueItemConfig.skillLevel)] : []),
				...(uniqueItemConfig.securityMeasure1 !== undefined ? [createSecurityMeasureIcon(uniqueItemConfig.securityMeasure1)] : []),
				...(uniqueItemConfig.securityMeasure2 !== undefined ? [createSecurityMeasureIcon(uniqueItemConfig.securityMeasure2)] : []),
				document.newElement({
					type: "div",
					class: ["fa", "fa-bell", "tt-crimes-uniques-notification-icon", ...(isSubscribed ? ["subscribed"] : [])],
					attributes: {
						title: isSubscribed ? "Click to unsubscribe" : "Click to subscribe",
					},
					events: {
						click: () => subscribeChangeFn(!isSubscribed),
					},
				}),
			],
		});
	}

	function createUniquesSection(sectionName, uniqueItemConfigArr) {
		return document.newElement({
			type: "div",
			children: [
				document.newElement({
					type: "div",
					text: sectionName,
					class: "tt-crimes-uniques-section-title",
				}),
				document.newElement({
					type: "div",
					class: "tt-crimes-uniques-section-content",
					children: uniqueItemConfigArr.map((uniqueItemConfig) =>
						createUniqueItem(uniqueItemConfig, false, (isSubscribed) => {
							console.log(isSubscribed);
						})
					),
				}),
			],
		});
	}

	function createCrimesUniquesContainer(root) {
		const { content, container } = createContainer("Uniques", { parentElement: root, spacer: true });
		const config = crimesUniquesConfig["4"];

		for (const [sectionName, uniqueItemConfigArr] of Object.entries(config)) {
			content.appendChild(createUniquesSection(sectionName, uniqueItemConfigArr));
		}

		function dispose() {
			container.remove();
		}

		return { dispose };
	}

	let crimesUniquesContainer;

	async function initialize() {
		const crimeArea = await requireElement(".crime-root > [class^='crimeSlider']");

		crimesUniquesContainer = createCrimesUniquesContainer(crimeArea);
	}

	function teardown() {
		crimesUniquesContainer?.dispose();
		crimesUniquesContainer = undefined;
	}
})();
