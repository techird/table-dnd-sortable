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
export declare type TableDndEventHandler = (context: Partial<TableDndContext>) => void;
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
    onDragStart: TableDndEventHandler;
    /**
     * 判断是否要启动拖动
     */
    onBeforeDragActivate: (evt: MouseEvent, delta: [number, number], context: Partial<TableDndContext>) => boolean;
    /**
     * 当用户在 y 轴方向拖动超过一定距离，会激活拖动逻辑
     */
    onDragActivate: TableDndEventHandler;
    /**
     * 拖动逻辑激活后，用户的拖动操作都会触发 onDragMove
     */
    onDragMove: TableDndEventHandler;
    /**
     * 拖动逻辑激活后，用户的拖放操作会触发 onDrop
     * 此时可利用 sourceIndex 和 targetIndex 来获取调换的结果
     */
    onDrop: TableDndEventHandler;
}
/**
 * 将原生的 DOM 支持到拖动排序的交互
 * @param table 包含 <tr> 的 DOM 容器，可以是 <table> 或者 <tbody>
 * @param options 交互配置
 */
export declare function tableDndSortable(table: HTMLTableElement | HTMLTableSectionElement, options?: Partial<TableDndSortableOptions>): {
    destroy: () => void;
};
