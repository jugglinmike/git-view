(function(window, undefined) {
	var d3 = window.d3;
	var data = window.data;
	var graph = {
		width: 800,
		height: 300,
		padding: {
			y: 0
		},
		branchLabel: {
			width: 150,
			margin: {
				x: 30
			}
		}
	}
	data.commitLookup = data.commits;
	data.commits = _.map(data.commitLookup, function(commit, sha) {
		// TODO: Remove (apparently not necessary)
		commit.sha = sha;
		return commit;
	});
	data.branchLookup = _.groupBy(data.commits, "branch");
	data.branches = _.map(data.branchLookup, function(commits, name) {
		return {
			name: name,
			commits: commits
		};
	});

	// Add in each branch's "base" commit
	_.forEach(data.branches, function(branch) {
		var baseSha = branch.commits[0].parent;
		var baseCommit = data.commitLookup[baseSha];
		if (baseCommit) {
			branch.commits.unshift(baseCommit);
		}
	});
	_.forEach(data.commits, function(commit) {
		var parents = commit.parent;
		if (!_.isArray(parents)) {
			return;
		}
		var parent = data.commitLookup[parents[1]];
		data.branchLookup[parent.branch].push(commit);
	});

	var GitView = d3.chart.extend({

		initialize: function(options) {

			var branchHeight = function() {
				var branchCount = _.size(data.branchLookup);
				return (graph.height - 2*graph.padding.y)/branchCount;
			};
			var branchY = function(branchName) {
				var branchIdx = _.keys(data.branchLookup).indexOf(branchName);
				return branchIdx * branchHeight() + graph.padding.y;
			};
			var commit = {
				x: function(commit) {
					var bl = graph.branchLabel;
					return bl.width + bl.margin.x + commit.time * 100;
				},
				y: function(commit) { return branchY(commit.branch); }
			};
			var line = d3.svg.line()
				.x(commit.x)
				.y(commit.y);
			this.svg = options.svg;

			this.layers.branches = this.svg.append("g")
				.attr("class", "branches")
				.layer({
					insert: function() {
						return this.append("svg:path")
							.attr("class", "branch");
					},
					dataBind: function(branchData) {
						return this.selectAll(".branch")
							.data(branchData, function(branch, idx) {
								return branch.name;
							});
					}
				});
			this.layers.branches
				.attr("transform", "translate(0, " + branchHeight()/2 + ")");
			this.layers.branches.on("enter", function() {
				this.attr("d", function(d) {
						return line(d.commits);
					})
					.attr("fill", "none")
					.attr("stroke", "black");
			});

			this.layers.branchCommits = this.svg.append("g")
				.attr("class", "commits")
				.layer({
					insert: function() {
						return this.append("circle").attr("class", "commit");
					},
					dataBind: function(branchData) {
						return this.selectAll(".branch")
							.data(branchData, function(branch) {
								return branch.name;
							})
							.enter().append("g")
							.selectAll("circle")
							.data(function(data) {
								return data.commits;
							});
					}
				});
			this.layers.branchCommits
				.attr("transform", "translate(0, " + branchHeight()/2 + ")");
			this.layers.branchCommits.on("enter", function() {
				this.attr("r", 7)
					.attr("cx", function(d) {
						return commit.x(d);
					})
					.attr("cy", function(d) {
						return commit.y(d);
					})
					.classed("merge-commit", function(commit) {
						return _.isArray(commit.parent);
					});
			});

			this.layers.branchLabels = svg.append("g")
				.attr("class", "branch-labels")
				.layer({
					insert: function() {
						return this.append("g")
							.attr("class", "branch-label");
					},
					dataBind: function(branchData) {
						return this.selectAll(".branch-label")
							.data(branchData, function(branch, idx) {
								return branch.name;
							});
					}
				});
			this.layers.branchLabels.on("enter", function() {
				this.attr("transform", function(branch) {
					return "translate(0," + branchY(branch.name) + ")";
				});

				this.append("svg:rect")
					.attr("width", graph.branchLabel.width)
					.attr("height", branchHeight());

				this.append("text").text(function(branch) {
						return branch.name;
					})
					.attr("x", 20)
					.attr("y", function() { return branchHeight()/2; });
			});
		}
	});

	var svg = d3.select("#chart").append("svg:svg");
	svg.attr("width", graph.width)
		.attr("height", graph.height);
	var gitview = new GitView({ svg: svg });

	gitview.draw(data.branches);

}(this));
