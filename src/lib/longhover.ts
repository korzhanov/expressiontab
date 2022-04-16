	export function longhover(node:HTMLElement, duration=1500): Record<unknown,unknown>{
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let timer: any | null;

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
		update(newDuration:number):void {
			duration = newDuration;
		},
		destroy():void {
			node.removeEventListener('mouseover', handleMouseover);
			node.removeEventListener('mouseout', handleMouseout);
		}
	};
}