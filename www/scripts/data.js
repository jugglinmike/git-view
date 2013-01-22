var data = {
	commits: {
		"a0": { parent: null, time: 0, branch: "master" },
		"a1": { parent: "a0", time: 1, branch: "master" },
		"a2": { parent: "a1", time: 2, branch: "master" },
		"b0": { parent: "a1", time: 3, branch: "dev" },
		"b1": { parent: "b0", time: 4, branch: "dev" },
		"a3": { parent: ["a2", "b1" ], time: 6, branch: "master" },
		"c0": { parent: "b0", time: 4.5, branch: "hotfix-1" }
	}
};
