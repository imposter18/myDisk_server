async function recursivDelete(tree) {
	let stack = [];
	stack.push(tree);
	const treeChild = await fileModel.find({
		user: userId,
		parent: tree._id,
	});
	// console.log(treeChild, "treeChild");
	// if (treeChild.length) {

	// }
	treeChild.forEach(async (child) => {
		stack.push(child);
		// console.log(child, "child");
		const childTree = await fileModel.findOne({
			user: userId,
			parent: child._id,
		});
		// console.log(childTree, "childTree");
		if (childTree) {
			// console.log(childTree, "childTree");
			return recursivDelete(childTree);
		}
	});

	return stack;
}
