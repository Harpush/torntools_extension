"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Specialist Gyms",
		"gym",
		() => settings.pages.gym.specialist,
		undefined,
		startFeature,
		disposeFeature,
		{
			storage: ["settings.pages.gym.specialist"],
		},
		undefined
	);

	const NONE = "none";
	const BATTLE_STAT = {
		DEX: "dex",
		DEF: "def",
		STR: "str",
		SPD: "spd",
	};
	const SPECIAL_GYM = {
		BALBOAS: "balboas",
		FRONLINE: "frontline",
		GYM3000: "gym3000",
		ISOYAMAS: "isoyamas",
		REBOUND: "rebound",
		ELITES: "elites",
	};
	const SPECIAL_GYM_TYPE = {
		SINGLE_STAT: "singleStat",
		TWO_STATS: "twoStats",
	};

	const specialGymDescMap = {
		[SPECIAL_GYM.BALBOAS]: "Balboas Gym (def/dex)",
		[SPECIAL_GYM.FRONLINE]: "Frontline Fitness (str/spd)",
		[SPECIAL_GYM.GYM3000]: "Gym 3000 (str)",
		[SPECIAL_GYM.ISOYAMAS]: "Mr. Isoyamas (def)",
		[SPECIAL_GYM.REBOUND]: "Total Rebound (spd)",
		[SPECIAL_GYM.ELITES]: "Elites (dex)",
	};
	const specialGymInfo = {
		[SPECIAL_GYM.BALBOAS]: {
			type: SPECIAL_GYM_TYPE.TWO_STATS,
			statOneName: BATTLE_STAT.DEF,
			statTwoName: BATTLE_STAT.DEX,
		},
		[SPECIAL_GYM.FRONLINE]: {
			type: SPECIAL_GYM_TYPE.TWO_STATS,
			statOneName: BATTLE_STAT.STR,
			statTwoName: BATTLE_STAT.SPD,
		},
		[SPECIAL_GYM.GYM3000]: {
			type: SPECIAL_GYM_TYPE.SINGLE_STAT,
			statName: BATTLE_STAT.STR,
		},
		[SPECIAL_GYM.ISOYAMAS]: {
			type: SPECIAL_GYM_TYPE.SINGLE_STAT,
			statName: BATTLE_STAT.DEF,
		},
		[SPECIAL_GYM.REBOUND]: {
			type: SPECIAL_GYM_TYPE.SINGLE_STAT,
			statName: BATTLE_STAT.SPD,
		},
		[SPECIAL_GYM.ELITES]: {
			type: SPECIAL_GYM_TYPE.SINGLE_STAT,
			statName: BATTLE_STAT.DEX,
		},
	};

	function calculateSingleStatsGymOffset(stat, highestNotSelfStat) {
		const wantedStat = Math.ceil(highestNotSelfStat * 1.25);

		return stat >= wantedStat ? 0 : wantedStat - stat;
	}

	function calculateTwoStatsGymOffset(statOne, statTwo, otherStatOne, otherStatTwo) {
		const sumWantedStats = (otherStatOne + otherStatTwo) * 1.25;

		if (sumWantedStats <= statOne + statTwo) {
			return { statOneOffset: 0, statTwoOffset: 0 };
		}

		const wantedStat = sumWantedStats / 2;

		return {
			statOneOffset: Math.ceil(statOne >= wantedStat ? 0 : wantedStat - statOne),
			statTwoOffset: Math.ceil(statTwo >= wantedStat ? 0 : wantedStat - statTwo),
		};
	}

	function calculateClosestStats(stats, gymOneConfig, gymTwoConfig) {
		function calculateSingleGymClosestStats(currStats, gymConfig) {
			if (gymConfig.type === SPECIAL_GYM_TYPE.SINGLE_STAT) {
				const highestNotSelfStatName = Object.entries(currStats)
					.filter(([statName]) => statName !== gymConfig.statName)
					.reduce((accum, curr) => (accum[1] > curr[1] ? accum : curr), ["", 0])[0];
				const statOffset = calculateSingleStatsGymOffset(currStats[gymConfig.statName], currStats[highestNotSelfStatName]);

				return {
					type: statOffset === 0 ? "noChange" : "hasChange",
					stats: {
						...currStats,
						[gymConfig.statName]: currStats[gymConfig.statName] + statOffset,
					},
				};
			} else {
				const [otherStatOne, otherStatTwo] = Object.keys(currStats).filter(
					(statName) => statName !== gymConfig.statOneName && statName !== gymConfig.statTwoName
				);
				const { statOneOffset, statTwoOffset } = calculateTwoStatsGymOffset(
					currStats[gymConfig.statOneName],
					currStats[gymConfig.statTwoName],
					currStats[otherStatOne],
					currStats[otherStatTwo]
				);

				return {
					type: statOneOffset === 0 && statTwoOffset === 0 ? "noChange" : "hasChange",
					stats: {
						...currStats,
						[gymConfig.statOneName]: currStats[gymConfig.statOneName] + statOneOffset,
						[gymConfig.statTwoName]: currStats[gymConfig.statTwoName] + statTwoOffset,
					},
				};
			}
		}

		function calculate(currStats) {
			if (!gymOneConfig || !gymTwoConfig) {
				const gymConfig = gymOneConfig || gymTwoConfig;
				const result = calculateSingleGymClosestStats(currStats, gymConfig);

				if (result.type === "noChange") {
					return currStats;
				}

				return calculate(result.stats);
			}

			const gymOneResult = calculateSingleGymClosestStats(currStats, gymOneConfig);
			const gymTwoResult = calculateSingleGymClosestStats(gymOneResult.stats, gymTwoConfig);

			if (gymOneResult.type === "noChange" && gymTwoResult.type === "noChange") {
				return currStats;
			}

			return calculate(gymTwoResult.stats);
		}

		return calculate(stats);
	}

	function calculateSpecialGymsData(stats, selectionOne, selectionTwo) {
		if (selectionOne === NONE && selectionTwo === NONE) {
			return { type: "none" };
		}

		const selectionOneConfig = specialGymInfo[selectionOne];
		const selectionTwoConfig = specialGymInfo[selectionTwo];

		if (selectionOneConfig !== selectionTwoConfig) {
			if (selectionOneConfig?.type === SPECIAL_GYM_TYPE.SINGLE_STAT && selectionTwoConfig?.type === SPECIAL_GYM_TYPE.SINGLE_STAT) {
				return { type: "impossible" };
			}

			if (selectionOneConfig?.type === SPECIAL_GYM_TYPE.TWO_STATS && selectionTwoConfig?.type === SPECIAL_GYM_TYPE.TWO_STATS) {
				return { type: "impossible" };
			}
		}

		const closestStats = calculateClosestStats(stats, selectionOneConfig, selectionTwoConfig);

		// TODO: All stats how much can train in it before lose special gyms

		return {
			type: "success",
			closestStats,
			offsets: Object.entries(closestStats).reduce((accum, [statsName, stat]) => {
				accum[statsName] = stat - stats[statsName];
				return accum;
			}, {}),
		};
	}

	function createStatsWatcher() {
		let onChangeCallback;

		const strengthValElem = document.querySelector("#strength-val");
		const defenseValElem = document.querySelector("#defense-val");
		const speedValElem = document.querySelector("#speed-val");
		const dexterityValElem = document.querySelector("#dexterity-val");

		const observer = new MutationObserver(() => {
			if (onChangeCallback) {
				onChangeCallback();
			}
		});

		function readStats() {
			const toNumber = (commaStr) => +commaStr.replace(/,/g, "");
			const stats = {
				[BATTLE_STAT.STR]: toNumber(strengthValElem.textContent),
				[BATTLE_STAT.DEF]: toNumber(defenseValElem.textContent),
				[BATTLE_STAT.SPD]: toNumber(speedValElem.textContent),
				[BATTLE_STAT.DEX]: toNumber(dexterityValElem.textContent),
			};

			return stats;
		}

		function onChange(cb) {
			onChangeCallback = cb;
		}

		function dispose() {
			observer.disconnect();
		}

		observer.observe(strengthValElem, { characterData: true, childList: true, subtree: true });
		observer.observe(defenseValElem, { characterData: true, childList: true, subtree: true });
		observer.observe(speedValElem, { characterData: true, childList: true, subtree: true });
		observer.observe(dexterityValElem, { characterData: true, childList: true, subtree: true });

		return {
			readStats,
			onChange,
			dispose,
		};
	}

	function createSpecialistGymsBoxElement(prevElement) {
		const { content, container } = createContainer("Specialist Gyms", { class: "tt-specialist-gym", compact: true, previousElement: prevElement });

		const specialGymOptions = [
			{
				value: NONE,
				description: "none",
			},
			...Object.values(SPECIAL_GYM).map((specialGym) => ({
				value: specialGym,
				description: specialGymDescMap[specialGym],
			})),
		];

		const specialGymSelectOne = createSelect(specialGymOptions);
		specialGymSelectOne.setSelected(filters.gym.specialist1);

		const specialGymSelectTwo = createSelect(specialGymOptions);
		specialGymSelectTwo.setSelected(filters.gym.specialist2);

		const selectsContainer = document.newElement({
			type: "div",
			class: "tt-specialist-gym-selects-container",
			children: [specialGymSelectOne.element, specialGymSelectTwo.element],
		});

		const statsInfo = document.newElement({
			type: "div",
			class: "tt-specialist-gym-info-container",
		});

		content.appendChild(selectsContainer);
		content.appendChild(statsInfo);

		function updateStatsInfo(specialGymOne, specialGymTwo, stats) {
			statsInfo.innerHTML = "";

			const result = calculateSpecialGymsData(stats, specialGymOne, specialGymTwo);

			if (result.type === "none") {
				const resultDesc = document.newElement({
					type: "div",
					text: "No special gyms were selected.",
				});
				statsInfo.appendChild(resultDesc);
			} else if (result.type === "impossible") {
				const resultDesc = document.newElement({
					type: "div",
					text: "Those special gyms combination is impossible.",
				});
				statsInfo.appendChild(resultDesc);
			} else {
				const explanationLine = document.newElement({
					type: "div",
					text: "Closest stats to unlock selected special gyms:",
				});
				statsInfo.appendChild(explanationLine);

				function createStatText(gymName, statName) {
					const parenText = result.offsets[statName] > 0 ? `${result.offsets[statName].toLocaleString()} missing` : `Achieved!`;
					return `${gymName}: ${result.closestStats[statName].toLocaleString()} ${statName} (${parenText})`;
				}

				function createGymTextLines(gymName) {
					if (specialGymInfo[gymName].type === SPECIAL_GYM_TYPE.SINGLE_STAT) {
						return [createStatText(gymName, specialGymInfo[gymName].statName)];
					} else {
						return [createStatText(gymName, specialGymInfo[gymName].statOneName), createStatText(gymName, specialGymInfo[gymName].statTwoName)];
					}
				}

				if (specialGymOne !== NONE) {
					createGymTextLines(specialGymOne)
						.map((lineText) =>
							document.newElement({
								type: "div",
								text: lineText,
							})
						)
						.forEach((elem) => statsInfo.appendChild(elem));
				}

				if (specialGymTwo !== NONE && specialGymOne !== specialGymTwo) {
					createGymTextLines(specialGymTwo)
						.map((lineText) =>
							document.newElement({
								type: "div",
								text: lineText,
							})
						)
						.forEach((elem) => statsInfo.appendChild(elem));
				}
			}
		}

		const statsWatcher = createStatsWatcher();

		let specialGymOne = specialGymSelectOne.getSelected();
		let specialGymTwo = specialGymSelectTwo.getSelected();
		let stats = statsWatcher.readStats();

		updateStatsInfo(specialGymOne, specialGymTwo, stats);

		specialGymSelectOne.onChange(() => {
			const specialGym = specialGymSelectOne.getSelected();
			ttStorage.change({ filters: { gym: { specialist1: specialGym } } });

			specialGymOne = specialGym;
			updateStatsInfo(specialGymOne, specialGymTwo, stats);
		});
		specialGymSelectTwo.onChange(() => {
			const specialGym = specialGymSelectTwo.getSelected();
			ttStorage.change({ filters: { gym: { specialist2: specialGym } } });

			specialGymTwo = specialGym;
			updateStatsInfo(specialGymOne, specialGymTwo, stats);
		});
		statsWatcher.onChange(() => {
			stats = statsWatcher.readStats();
			updateStatsInfo(specialGymOne, specialGymTwo, stats);
		});

		function dispose() {
			specialGymSelectOne.dispose();
			specialGymSelectTwo.dispose();
			statsWatcher.dispose();
			container.remove();
		}

		return {
			dispose,
		};
	}

	let specialGyms;

	async function startFeature() {
		await requireElement('[class^="gymContent"] > [class^="properties"]');

		specialGyms = createSpecialistGymsBoxElement(document.querySelector("#gymroot"));
	}

	function disposeFeature() {
		specialGyms.dispose();
		specialGyms = undefined;
	}
})();
