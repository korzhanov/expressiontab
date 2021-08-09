// export function longhover(node:any) {
	export function longhover(node:HTMLElement, duration=1500) {
	let timer:any;

	const handleMouseover = () => {
		timer = setTimeout(() => {
			node.dispatchEvent(
				new CustomEvent('longhover')
			);
		}, duration);
	};

	const handleMouseout = () => {
		clearTimeout(timer)
	};

	node.addEventListener('mouseover', handleMouseover);
	node.addEventListener('mouseout', handleMouseout);

	return {
		update(newDuration:number) {
			duration = newDuration;
		},
		destroy() {
			node.removeEventListener('mouseover', handleMouseover);
			node.removeEventListener('mouseout', handleMouseout);
			// console.log(node);

		}
	};
}