
/**
 * 拖动上下文，贯穿拖动排序的整个生命周期
 */
export interface TableDndContext {
	startPosition: [number, number];
	activated: boolean;
	source: HTMLTableRowElement;
	sourceIndex: number;
	sourceHeight: number;
	sourceMidPoint: number;
	target: HTMLTableRowElement;
	targetIndex: number;
	rowSeq: HTMLTableRowElement[];
	bottomSeq: number[];
	movememtSeq: number[];
}

/**
 * Dnd 事件处理函数
 */
export type TableDndEventHandler = (context: Partial<TableDndContext>) => void;

/**
 * Dnd 配置
 */
export interface TableDndSortableOptions {
	/**
	 * 开始拖动之前可以判断是否要开启拖动
	 * 可以用于实现在自定义的 handler 上才进行拖动
	 */
	onBeforeDragStart: (evt: MouseEvent) => boolean;

	/**
	 * 用户企图开始拖动时（mousedown）通知
	 * 此时拖动逻辑尚未激活。
	 * 返回 false 可以阻止开启拖动。
	 */
	onDragStart: TableDndEventHandler,

	/**
	 * 判断是否要启动拖动
	 */
	onBeforeDragActivate: (evt: MouseEvent, delta: [number, number], context: Partial<TableDndContext>) => boolean;

	/**
	 * 当用户在 y 轴方向拖动超过一定距离，会激活拖动逻辑
	 */
	onDragActivate: TableDndEventHandler,

	/**
	 * 拖动逻辑激活后，用户的拖动操作都会触发 onDragMove
	 */
	onDragMove: TableDndEventHandler,

	/**
	 * 拖动逻辑激活后，用户的拖放操作会触发 onDrop
	 * 此时可利用 sourceIndex 和 targetIndex 来获取调换的结果
	 */
	onDrop: TableDndEventHandler,
}

const defaultOptions: TableDndSortableOptions = {
	onBeforeDragStart: () => true,
	onDragStart: () => {},
	onBeforeDragActivate: (e, [dx, dy]) => Math.abs(dy) > 10 && Math.abs(dy / dx) > 2,
	onDragActivate: () => {},
	onDragMove: () => {},
	onDrop: () => {},
}

/**
 * 将原生的 DOM 支持到拖动排序的交互
 * @param table 包含 <tr> 的 DOM 容器，可以是 <table> 或者 <tbody>
 * @param options 交互配置
 */
export function tableDndSortable(
	table: HTMLTableElement | HTMLTableSectionElement,
	options: Partial<TableDndSortableOptions> = {},
) {
	const {
		onBeforeDragStart,
		onDragStart,
		onBeforeDragActivate,
		onDragActivate,
		onDragMove, onDrop
	} = Object.assign({}, defaultOptions, options);

	let mousedownListener = null;
	let mousemoveListener = null;
	let mouseupListener = null;

	// 拖动上下文，贯穿整个拖动的声明周期
	let context: Partial<TableDndContext> = null;

	// 开始拖动
	const start = (source: HTMLTableRowElement, startPosition: [number, number]) => {
		context = {
			activated: false,
			source,
			startPosition,
		};
		onDragStart(context);
	}

	// 启动拖动
	const activate = () => {
		const source = context.source;

		// 来源行的高度
		const sourceHeight = source.getBoundingClientRect().height;

		// 行序列
		const rowSeq = Array.from(table.querySelectorAll('tr'));

		// 计算底线序列
		const heightSeq = rowSeq.map(tr => tr.getBoundingClientRect().height);
		const bottomSeq = [];
		let bottom = 0;
		for (let height of heightSeq) {
			bottomSeq.push(bottom += height);
		}

		// 来源行索引
		const sourceIndex = rowSeq.indexOf(source);

		// 来源行中点位置，用于后续计算变更集
		const sourceMidPoint = bottomSeq[sourceIndex] + sourceHeight / 2;

		// 更新拖动上下文
		Object.assign(context, {
			activated: true,
			sourceIndex,
			sourceHeight,
			sourceMidPoint,
			rowSeq,
			bottomSeq,
		});

		onDragActivate(context);
	}

	// 处理拖动
	const move = (dy: number) => {
		const { source, sourceIndex, sourceHeight, sourceMidPoint, rowSeq, bottomSeq, movememtSeq } = context;

		// 对于每一个底线位置，根据当前拖动位置来决定对应的行需要移动的位移
		const newMovementSeq = bottomSeq.map((bottom, index) => {
			// 来源行直接响应交互位移
			if (index === sourceIndex) {
				return dy;
			}
			// 这个条件比较复杂
			// 看图：https://ask.qcloudimg.com/draft/1000002/nfp070gvoe.jpg
			const matchDirection = () => dy * (index - sourceIndex) > 0;
			const overMidPoint = () => dy * (sourceMidPoint + dy - bottom - (dy < 0 ? sourceHeight : 0)) > 0
			if (matchDirection() && overMidPoint()) {
				return dy > 0 ? -sourceHeight : sourceHeight;
			}
			return 0;
		});

		// 计算需要变更的行，设置样式
		for (let index = 0; index < newMovementSeq.length; index++) {
			const row = rowSeq[index];
			const oldMovement = movememtSeq ? movememtSeq[index] : 0;
			const newMovement = newMovementSeq[index];
			if (oldMovement !== newMovement) {
				row.style.zIndex = index === sourceIndex ? '100' : '0';
				row.style.transition = index === sourceIndex ? 'none' : null;
				row.style.transform = `translate3d(0, ${newMovement}px, 0)`;
			}
		}

		// 记录当前移动集
		context.movememtSeq = newMovementSeq;

		onDragMove(context);
	}

	// 拖放结束
	const drop = () => {
		const { source, sourceIndex, movememtSeq, rowSeq, activated } = context;
		let targetIndex = sourceIndex;
		let target = source;

		if (activated) {
			while (targetIndex > 0 && movememtSeq[targetIndex - 1] > 0) {
				targetIndex--;
			}
			if (targetIndex === sourceIndex) {
				while (targetIndex < movememtSeq.length - 1 && movememtSeq[targetIndex + 1] < 0) {
					targetIndex++;
				}
			}
			for (let tr of Array.from(table.querySelectorAll('tr'))) {
				tr.style.removeProperty('z-index');
				tr.style.transform = 'translate3d(0, 0, 0)'
				tr.style.transition = 'none';
			}
			target = rowSeq[targetIndex];

			Object.assign(context, {
				targetIndex,
				target,
			});
			onDrop(context);
		}
		context = null;
	}

	// 绑定事件
	const setup = () => {
		table.addEventListener('mousedown', mousedownListener = (evt: MouseEvent) => {
			if (onBeforeDragStart(evt) === false) {
				return;
			}
			let source = evt.target as HTMLElement;
			while (source && source.tagName !== 'TR' && source !== evt.currentTarget) {
				source = source.parentElement;
			}
			if (!source || source.tagName !== 'TR') {
				return null;
			}
			const { clientX, clientY } = evt;
			start(source as HTMLTableRowElement, [clientX, clientY]);
		});
		table.addEventListener('mousemove', mousemoveListener = (evt: MouseEvent) => {
			if (!context) {
				return;
			}
			const { clientX: currentX, clientY: currentY } = evt;
			const [startX, startY] = context.startPosition;

			const dx = currentX - startX;
			const dy = currentY - startY;

			// 拖动超过 10 像素再开启拖动
			if (!context.activated && onBeforeDragActivate(evt, [dx, dy], context)) {
				activate();
			}

			// 拖动已开启，执行 move 逻辑
			if (context.activated) {
				evt.preventDefault();
				move(dy);
			}
		});
		window.addEventListener('mouseup', mouseupListener = () => {
			if (context) {
				drop();
			}
		});
	};

	// 清理事件
	const destroy = () => {
		table.removeEventListener('mousedown', mousedownListener);
		table.removeEventListener('mousemove', mousemoveListener);
		window.removeEventListener('mouseup', mouseupListener);
	};

	return setup(), { destroy };
}