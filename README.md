# tree-like-data-utils

树形结构数据的处理函数集

## 树结构

```js
// 一个树数据的典型结构
// 数组结构
const arr = [
  { id: 1, title: "test1", pid: null },
  { id: 11, title: "test1-1", pid: 1 },
  { id: 2, title: "test2", pid: null },
];

// 转换成树结构
const tree = [
  {
    "id": 1,
    "title": 'test1',
    "pid": null,
    "children": [
      {
        "id": 11,
        "title": 'test1-1',
        "pid": 1
      }
    ]
  },
  {
    "id": 2,
    "title": 'test2',
    "pid": null
  }
]
```

工具函数中, 基本都有 `options` 参数, 包含 `idKey`, `parentIdKey`, `childrenKey`, 可以根据具体的业务来替换关键的几个字段名称

## 提供的函数清单

### 数组类型数据的处理函数

- createTreeFromTreeLikeArray (将List结构的对象数组转化为树形结构)
- filterTreeArray (过滤树数据. 如果子节点有匹配数据, 会连带父节点一起返回)
- closestParentItemInTreeArray (向上查找所有父节点, 返回节点的数组)
- closestParentKeysInTreeArray (向上查找所有父节点 key 值, 返回 key 值的数组)
- findChildrenItemInTreeArray (向下查找所有子节点, 返回节点的数组)
- hasChildrenNode (判断是否有子节点)

### 树类型数据的处理函数

- getTreeNodeByPath (按路径查找目标值)
- getFromTree (模拟 lodash.get, 但是没有默认值的参数)
- setToTree (模拟 lodash.set)
- flattenTree (扁平化树结构)
- traverseTree (深度优先遍历数据)
- someTree (遍历树数据, 如果有一个节点匹配, 则返回 true)
- everyTree (遍历树数据, 所有的节点都匹配, 则返回 true)
- findOneInTree (查找树数据, 所有第一个匹配的节点)
- findAllInTree (查找树数据, 返回所有匹配的数据)
- findParentTreeNode (查找父节点)
- findIndexInSiblingNode (获取目标节点所在兄弟节点中的索引)
- mapTree (遍历树类型数据, 并返回新的对象)
- sortTree (遍历树类型数据)
- replaceTreeNode (替换树节点数据)
- removeEmptyChildrenTreeNode (删除空的 children 节点)
- statisticsTreeNodeChildren (统计所有节点的子节点的数量)
- closestParentItemInTree (向上查找所有父节点)
- filterTree (过滤树类型数据, 保留匹配节点的父级)
- completionTreeNodePid (为没有父节点的树数据添加父节点)
- getRightNode (获取目标节点的右侧节点)
- getAllRightNode (获取目标节点的所有右侧节点)
- getLeftNode (获取目标节点的左侧节点)
- getAllLeftNode (获取目标节点的所有左侧节点)
