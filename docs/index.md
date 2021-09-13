# Demo

```jsx
import React from 'react';
import treeLikeDataUtils from '../src/index';

function randomSort() {
    return Math.random() > 0.5 ? -1 : 1;
}

function testMethod(title, fn) {
    console.time(`time`);
    // const start = new Date().getTime();
    const result = fn();
    // const end = new Date().getTime();
    console.log(`%c${title}: `, 'color: blue');
    result && console.log(result);
    // console.log(`%c(${end - start}ms)`, 'color: #999999');
    console.timeEnd(`time`);
}

const testArray = [
    { id: 1, title: 'test1', pId: null },
    { id: 11, title: 'test1-1', pId: 1 },
    { id: 12, title: 'test1-2', pId: 1 },
    { id: 13, title: 'test1-3', pId: 1 },
    { id: 111, title: 'test1-1-1', pId: 11 },
    { id: 112, title: 'test1-1-2', pId: 11 },
    { id: 113, title: 'test1-1-3', pId: 11 },
    { id: 2, title: 'test2', pId: null },
    { id: 21, title: 'test2-1', pId: 2 },
    { id: 3, title: 'test3', pId: null },
    { id: 4, title: 'test4', pId: null },
    { id: 41, title: 'test4-1', pId: 4 },
    { id: 411, title: 'test4-1-1', pId: 41 },
    { id: 4111, title: 'test4-1-1-1', pId: 411 },
    { id: 41111, title: 'test4-1-1-1-1', pId: 4111 },
    { id: 411111, title: 'test4-1-1-1-1-1', pId: 41111 },
    { id: 411112, title: 'test4-1-1-1-1-2', pId: 41111 },
    { id: 4111111, title: 'test4-1-1-1-1-1-1', pId: 411111, children: [] },
    { id: 99, title: 'invalid node', pId: 9, children: [] }
];
const randomArray = [...testArray].sort(randomSort);
const tree = treeLikeDataUtils.createTreeFromTreeLikeArray(testArray);
const randomTree = treeLikeDataUtils.createTreeFromTreeLikeArray(randomArray);

// array test
testMethod('createTreeFromTreeLikeArray', () => treeLikeDataUtils.createTreeFromTreeLikeArray(testArray));
testMethod('createTreeFromTreeLikeArray(乱序)', () => treeLikeDataUtils.createTreeFromTreeLikeArray(randomArray));
testMethod('filterTreeArray:', () =>
    treeLikeDataUtils.filterTreeArray(testArray, item => item.title.indexOf('-1') > -1)
);
testMethod('filterTreeArray(乱序)', () =>
    treeLikeDataUtils.filterTreeArray(randomArray, item => item.title.indexOf('-1') > -1)
);
testMethod('closestParentItemInTreeArray', () =>
    treeLikeDataUtils.closestParentItemInTreeArray(testArray, testArray[3], 2)
);
testMethod('closestParentItemInTreeArray(乱序)', () =>
    treeLikeDataUtils.closestParentItemInTreeArray(randomArray, testArray[3], 2)
);
testMethod('closestParentKeysInTreeArray', () => treeLikeDataUtils.closestParentKeysInTreeArray(testArray, 111, 2));
testMethod('closestParentKeysInTreeArray(乱序)', () =>
    treeLikeDataUtils.closestParentKeysInTreeArray(randomArray, 111, 2)
);
testMethod('hasChildrenNode', () => treeLikeDataUtils.hasChildrenNode(testArray, testArray[5])); // test2

// tree test
testMethod('flattenTree', () => treeLikeDataUtils.flattenTree(tree));
testMethod('flattenTree(keepChildren)', () => treeLikeDataUtils.flattenTree(tree, true));
testMethod('someTree', () => treeLikeDataUtils.someTree(tree, node => node.id === 411111));
testMethod('everyTree', () => treeLikeDataUtils.everyTree(tree, node => node.id === 411111));
testMethod(
    'findOneInTree(breath)',
    () => treeLikeDataUtils.findOneInTree(tree, node => node.title.includes('-1')),
    'breath'
);
testMethod(
    'findOneInTree(depth)',
    () => treeLikeDataUtils.findOneInTree(tree, node => node.title.includes('-1')),
    'depth'
);
testMethod(
    'findAllInTree(breath)',
    () => treeLikeDataUtils.findAllInTree(tree, node => node.title.includes('-1')),
    'breath'
);
testMethod(
    'findAllInTree(depth)',
    () => treeLikeDataUtils.findAllInTree(tree, node => node.title.includes('-1'), 'depth'),
    'breath'
);
testMethod('findParentTreeNode', () => treeLikeDataUtils.findParentTreeNode(tree, testArray[1]));
testMethod('mapTree', () => treeLikeDataUtils.mapTree(tree, node => ({ ...node, custom: 'test' })));
testMethod('replaceTreeNode', () =>
    treeLikeDataUtils.replaceTreeNode(
        tree,
        node => node.title.indexOf('-1') > -1,
        node => ({ ...node, hasTitleWord: '-1' })
    )
);
testMethod('removeEmptyChildrenTreeNode', () => treeLikeDataUtils.removeEmptyChildrenTreeNode(tree));
testMethod('statisticsTreeNodeChildren', () => treeLikeDataUtils.statisticsTreeNodeChildren(tree));
testMethod('statisticsTreeNodeChildren(deep)', () => treeLikeDataUtils.statisticsTreeNodeChildren(tree, true));
testMethod('closestParentItemInTree', () =>
    treeLikeDataUtils.closestParentItemInTree(tree, node => node.title.indexOf('-2') > -1)
);
testMethod('closestParentItemInTree(isContainerTarget)', () =>
    treeLikeDataUtils.closestParentItemInTree(tree, node => node.title.indexOf('-2') > -1, true)
);
testMethod('closestParentItemInTree(flattenTree)', () =>
    treeLikeDataUtils.flattenTree(treeLikeDataUtils.filterTree(tree, node => node.title.indexOf('-2') > -1))
);
testMethod('filterTree', () => treeLikeDataUtils.filterTree(tree, node => node.title.indexOf('-2') > -1));
testMethod('getRightNode', () => treeLikeDataUtils.getRightNode(tree, testArray[1]));
testMethod('getAllRightNode', () => treeLikeDataUtils.getAllRightNode(tree, testArray[1]));
testMethod('getLeftNode', () => treeLikeDataUtils.getLeftNode(tree, testArray[2]));
testMethod('getAllLeftNode', () => treeLikeDataUtils.getAllLeftNode(tree, testArray[2]));
testMethod('sortTree', () => treeLikeDataUtils.sortTree(randomTree, (a, b) => a.id - b.id));
testMethod('getTreeNodeByPath', () => treeLikeDataUtils.getTreeNodeByPath(tree, ''));
testMethod('getTreeNodeByPath', () => treeLikeDataUtils.getTreeNodeByPath(tree[0], 'test1-1[1]'));
testMethod('getFromTree', () => treeLikeDataUtils.getFromTree(tree, '[0].children[0].children[0]'));
testMethod('setToTree', () => treeLikeDataUtils.setToTree(tree, '[5].children[0].test', 'test'));
testMethod('traverseTree(breath)', () =>
    treeLikeDataUtils.traverseTree(tree, node => console.log(node.title), 'breath')
);
testMethod('traverseTree(depth)', () => treeLikeDataUtils.traverseTree(tree, node => console.log(node.title), 'depth'));

export default () => <>打开控制台查看函数调用结果</>;
```
