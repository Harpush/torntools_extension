"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Crimes Uniques - Shoplifting",
		"crimes2",
		() => settings.pages.crimes2.crimesUniques,
		initialize,
		execute,
		undefined,
		teardown,
		{
			storage: ["settings.pages.crimes2.crimesUniques"],
		},
		undefined
	);

	const SECURITY_TYPE = {
		CAMERAS: "cameras",
		GUARDS: "guards",
		CHECKPOINTS: "checkpoints",
	};
	const SECURITY_TYPE_SINGULAR_DESC_MAP = {
		[SECURITY_TYPE.CAMERAS]: "Camera",
		[SECURITY_TYPE.GUARDS]: "Guard",
		[SECURITY_TYPE.CHECKPOINTS]: "Checkpoint",
	};
	const SECURITY_TYPE_PLURAL_DESC_MAP = {
		[SECURITY_TYPE.CAMERAS]: "Cameras",
		[SECURITY_TYPE.GUARDS]: "Guards",
		[SECURITY_TYPE.CHECKPOINTS]: "Checkpoints",
	};
	const SECURITY_TYPE_BG_POS_MAP = {
		[SECURITY_TYPE.CAMERAS]: 0,
		[SECURITY_TYPE.GUARDS]: 1,
		[SECURITY_TYPE.CHECKPOINTS]: 2,
	};

	function createSecurityMeasureIcon(securityMeasureConfig) {
		const descMap = securityMeasureConfig.amount === 1 ? SECURITY_TYPE_SINGULAR_DESC_MAP : SECURITY_TYPE_PLURAL_DESC_MAP;
		const desc = descMap[securityMeasureConfig.type];
		const state = securityMeasureConfig.disabled ? "Disabled" : "Enabled";
		const title = `Required status: ${desc} - ${state}`;

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
						backgroundPositionX: `${-36 * SECURITY_TYPE_BG_POS_MAP[securityMeasureConfig.type]}px`,
					},
				}),
				document.newElement({
					type: "div",
					class: "tt-crimes-uniques-security-measure-border",
				}),
				...(securityMeasureConfig.disabled
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

	function buildUniqueItemChildren(uniqueOutcomeInfo) {
		return uniqueOutcomeInfo.requirements
			.map((requirement) => {
				if (requirement.type === "skill") {
					return createSkillLevelStarIcon(requirement.min);
				} else if (requirement.type === "state") {
					switch (requirement.id) {
						case "One camera":
							return createSecurityMeasureIcon({
								type: SECURITY_TYPE.CAMERAS,
								amount: 1,
								disabled: requirement.disabled,
							});
						case "Two cameras":
							return createSecurityMeasureIcon({
								type: SECURITY_TYPE.CAMERAS,
								amount: 2,
								disabled: requirement.disabled,
							});
						case "Three cameras":
							return createSecurityMeasureIcon({
								type: SECURITY_TYPE.CAMERAS,
								amount: 3,
								disabled: requirement.disabled,
							});
						case "Four cameras":
							return createSecurityMeasureIcon({
								type: SECURITY_TYPE.CAMERAS,
								amount: 4,
								disabled: requirement.disabled,
							});
						case "One guard":
							return createSecurityMeasureIcon({
								type: SECURITY_TYPE.GUARDS,
								amount: 1,
								disabled: requirement.disabled,
							});
						case "Two guards":
							return createSecurityMeasureIcon({
								type: SECURITY_TYPE.GUARDS,
								amount: 2,
								disabled: requirement.disabled,
							});
						case "Checkpoint":
							return createSecurityMeasureIcon({
								type: SECURITY_TYPE.CHECKPOINTS,
								amount: 1,
								disabled: requirement.disabled,
							});
					}
				}
			})
			.filter((result) => !!result);
	}

	let crimesUniquesContainer;

	function initialize() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CRIMES2_SHOPLIFTING_LOADED].push(() => {
			if (!crimesUniquesContainer) {
				execute();
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CRIMES2_HOME_LOADED].push(() => {
			teardown();
		});
	}

	async function execute() {
		const crimeArea = await requireElement(".crime-root > [class^='crimeSlider']");
		// TODO: Save somewhere and actually add notification logic
		const uniquesSubscriptionMap = { 12529: true };

		crimesUniquesContainer = await createCrimesUniquesContainer(crimeArea, 4, buildUniqueItemChildren, {
			subscriptionsMap: uniquesSubscriptionMap,
			subscribeChangeFn: (uniqueOutcomeId, isSubscribed) => {
				if (isSubscribed) {
					uniquesSubscriptionMap[uniqueOutcomeId] = isSubscribed;
				} else {
					delete uniquesSubscriptionMap[uniqueOutcomeId];
				}
			},
		});
	}

	function teardown() {
		crimesUniquesContainer?.dispose();
		crimesUniquesContainer = undefined;
	}
})();
