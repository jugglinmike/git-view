var fs = require("fs");
var path = require("path");

var gitDir = "/" + path.join.apply(path, "home/mike/projects/Bocoup.com/.git".split("/"));
var heads = path.join(gitDir, "refs", "heads");
var branches = fs.readdirSync(heads);

function readCommit(sha) {
	var fp = sha.slice(0,2);
	var sp = sha.slice(2);
	return fs.readFileSync(path.join(gitDir, "objects", fp, sp))
}

var Gitteh = require("gitteh");
var _ = require("lodash");

var repo = Gitteh.openRepository(gitDir);
var walker = repo.createWalker();
var refs = repo.listReferences(Gitteh.GIT_REF_OID)
	// We're only concerned with local references for now
	.filter(function(refName) {
		return /^refs\/heads/.test(refName);
	})
	// I would really rather use `bind` here, but it doesn't work for some
	// reason...
	.map(function(refName) {
		return repo.getReference(refName);
	});

var commits = {};

// Build a lookup table of all the commits
refs.forEach(function(ref) {
	var commit, preMergeSha;
	walker.push(ref.target);
	while(commit = walker.next()) {
		commit.branch = ref.name;
		commits[commit.id] = commit;
	}
});

// Assign each commit to a single branch
refs.forEach(function(ref) {
	walker.push(ref.target);
	while(commit = walker.next()) {
		// Naively assume that the commit "belongs" to the current branch
		commit.branch = ref.name;
		if (commit.parents.length > 1) {
			preMergeSha = commit.parents[1];
			var branch = _.find(refs, function(ref) {
				return ref.target === preMergeSha;
			});
			if (branch) {
				console.log(branch);
			}
		}
	}
});
console.log("Commit count: ", Object.keys(commits).length);

_.forEach(commits, function(commit) {
	commit.committer.time = commit.committer.time.getTime();
});

refs.forEach(function(ref) {
	console.log(ref.name, ref.target in commits);
});

console.log(_(commits).toArray().first());

/*
branches = branches.filter(function(branchName) {
	return !fs.statSync(path.join(gitDir, "refs", "heads", branchName))
		.isDirectory();
}).map(function(branchName) {
	var branchFilePath = path.join(gitDir, "refs", "heads", branchName);
	var sha = fs.readFileSync(branchFilePath).toString().trim();
	console.log(branchName, sha);
	return {
		name: branchName,
		sha: sha,
		raw: readCommit(sha)
	};
});

console.log(branches);
*/
