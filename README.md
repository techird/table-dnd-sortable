Table Dnd Sortable
==================

Implement table row sorting via drag & drop.

## Usage

Basic usage, enable dnd sort effects on table rows.

```js
import tableDndSortable from 'table-dnd-sortable';

const dndSorter = tableDndSortable(document.querySelector('table#my-table'), {
  onDrop({ sourceIndex, targetIndex }) {
    // Implement your data movement / table re-render here, via sourceIndex and targetIndex
    console.log(`Move row ${sourceIndex} to ${targetIndex}`);
  }
});

// rememeber to clean up when you don't need it...
dndSorter.destroy();
```

You can narrow down the dnd handler to a specific dom via `onBeforeDrag`.

```js
const dndSorter = tableDndSortable(document.querySelector('table#my-table'), {
  onBeforeDragStart: (evt) => {
    return evt.target.classList.contains('dnd-sorter');
  },
});
```

## API

Please checkout the [typescript declarations](dist/table-dnd-sortable.d.ts).

## LICENSE

MIT