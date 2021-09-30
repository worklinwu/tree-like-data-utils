/* eslint-disable no-unused-vars */
import { cloneDeep } from 'lodash-es';
import { TraverseOptions, TraverseType, Tree, TreeNode, TreeNodeFieldAlias, TreePathOptions } from './types';

function _normalizeObjectPath(path: string | string[]): string[] {
    if (path instanceof Array) return path;
    return path
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter((p) => p !== '');
}

function _normalizeTreePath(path: string | string[], pathSeparator: string, childrenKey: string): string[] {
    if (path instanceof Array) return path;
    const fullChildren = new RegExp(childrenKey, 'gi');
    return path
        .replace(fullChildren, '')
        .replace(/\[(\d+)\]/g, '.$1')
        .split(pathSeparator)
        .filter((p) => p !== '');
}

/**
 * 按路径查找目标值
 * @param {object} tree
 * @param {string|string[]} path
 * @param {TreePathOptions} [options]
 * @returns {*}
 *
 * @example
 *   path = ''                 return treeRoot
 *   path = 'child1'           return treeRoot.children[title === 'child1']
 *   path = 'children[1]'      return treeRoot.children[1]
 *   path = 'child1.child11'   return treeRoot.children[title === 'child1'].children[title === 'child11']
 *   path = 'child1[0]'        return treeRoot.children[title === 'child1'].children[0]
 */
export function getTreeNodeByPath(tree: TreeNode, path: string, options: TreePathOptions = {}): unknown {
    const { pathSeparator = '.', fieldName = 'title', childrenKey = 'children' } = options || {};

    const pathNodes = _normalizeTreePath(path, pathSeparator, childrenKey);
    return pathNodes.reduce((branch, pathPart) => {
        if (!branch) return branch;
        const children = branch[childrenKey] || [];
        const childIndex = isFinite(Number(pathPart))
            ? pathPart
            : children.findIndex((node: TreeNode) => node[fieldName] === pathPart);
        return children[childIndex];
    }, tree);
}

/**
 * 模拟 lodash.get, 但是没有默认值的参数
 * @param tree 树数据
 * @param path 路径
 */
export function getFromTree(tree: Tree, path: string | string[]): unknown {
    const pathArray = _normalizeObjectPath(path);
    return pathArray.reduce((node: TreeNode, pathPart: string | number) => {
        if (!node) return node;
        return node[pathPart];
    }, tree);
}

/**
 * 模拟 lodash.set
 * @param tree 树数据
 * @param path 路径
 * @param value 要设置的值
 */
export function setToTree(tree: Tree, path: string | string[], value: unknown): Tree {
    const pathArray = _normalizeObjectPath(path);
    pathArray.reduce((node: TreeNode, pathPart: string | number, index: number, arr: Tree) => {
        if (index + 1 === arr.length) {
            node[pathPart] = value;
            return;
        }
        if (node[pathPart]) return node[pathPart];
        return (node[pathPart] = isFinite(Number((arr as TreeNode[])[index + 1])) ? [] : {});
    }, cloneDeep(tree));
    return tree;
}

/**
 * 扁平化树结构
 * @param tree 树结构数据
 * @param keepChildrenField 是否保留 children 字段
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function flattenTree(tree: Tree, keepChildrenField = false, options?: TreeNodeFieldAlias): TreeNode[] {
    const treeDataClone = tree ? cloneDeep(tree) : null;
    const { childrenKey = 'children' } = options || {};
    const result: TreeNode[] = [];
    const deep = (data: TreeNode[]) => {
        for (let i = 0; i < data.length; i += 1) {
            const node = data[i];
            result.push(node);
            if (node[childrenKey]) {
                deep(node[childrenKey]);
                if (!keepChildrenField) {
                    delete node[childrenKey];
                }
            }
        }
    };
    if (tree instanceof Array) {
        deep(treeDataClone as TreeNode[]);
    } else if (treeDataClone) {
        deep([treeDataClone]);
    }
    return result;
}

/**
 * 遍历树数据的方法
 * @param tree 树数据
 * @param fn 遍历函数
 * @param queueMethod shift: 深度优先 | unshift: 广度优先
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
function _traverse(
    tree: Tree,
    fn: (node: TreeNode, options?: TraverseOptions & TreePathOptions) => boolean | undefined | void,
    queueMethod: 'push' | 'unshift',
    options?: TraverseOptions & TreePathOptions
): Tree | TreeNode | TreeNode[] | boolean | void {
    const { some, every, returnBoolean, returnArray, childrenKey = 'children' } = options || {};
    const queue: TreeNode[] = tree instanceof Array ? [...tree] : [{ ...tree }];
    const results: Tree = [];
    let didBreak = false;
    let lastResult: boolean | undefined;
    while (queue.length) {
        const node = queue.shift();
        if (!node) {
            continue;
        }
        if (node[childrenKey] && node[childrenKey].length) {
            // 广度优先还是深度优先
            queue[queueMethod](...node[childrenKey]);
        }
        if (some || every) {
            const result = fn(node, options);
            if (returnArray) {
                if (result) {
                    results.push(node);
                }
            } else if ((every && !result) || (some && result)) {
                didBreak = true;
                lastResult = result || undefined;
                break;
            }
        } else if (fn(node, options) === false) {
            break;
        }
    }
    if (every) {
        if (returnBoolean) {
            return !didBreak;
        }
        if (returnArray) {
            return results;
        }
    } else if (some) {
        if (returnBoolean) {
            return Boolean(lastResult);
        }
        if (returnArray) {
            return results;
        }
    }
}

/**
 * 遍历树数据
 * @param tree 树数据
 * @param callbackFn 遍历函数
 * @param traverseType 遍历方式, 默认是广度优先
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function traverseTree(
    tree: Tree,
    callbackFn: (node: TreeNode) => void,
    traverseType: TraverseType | string = TraverseType.Breath,
    options?: TreePathOptions
): void {
    _traverse(tree, callbackFn, traverseType === TraverseType.Depth ? 'unshift' : 'push', options);
}

/**
 * 遍历树数据, 如果有一个节点匹配, 则返回 true
 * @param tree 树数据
 * @param predicate 遍历函数
 * @param traverseType 遍历方式
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function someTree(
    tree: Tree,
    predicate: (node: TreeNode) => boolean,
    traverseType: TraverseType | string = TraverseType.Breath,
    options?: TreePathOptions
): boolean {
    return _traverse(tree, predicate, traverseType === TraverseType.Depth ? 'unshift' : 'push', {
        ...options,
        some: true,
        returnBoolean: true
    }) as boolean;
}

/**
 * 遍历树数据, 所有的节点都匹配, 则返回 true
 * @param tree 树数据
 * @param predicate 遍历函数
 * @param traverseType 遍历方式
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function everyTree(
    tree: Tree,
    predicate: (node: TreeNode) => boolean,
    traverseType: TraverseType | string = TraverseType.Breath,
    options?: TreePathOptions
): boolean {
    return _traverse(tree, predicate, traverseType === TraverseType.Depth ? 'unshift' : 'push', {
        ...options,
        every: true,
        returnBoolean: true
    }) as boolean;
}

/**
 * 查找树数据, 所有第一个匹配的节点
 * @param tree 树数据
 * @param predicate 遍历函数
 * @param traverseType 遍历方式 breath|depth, 默认 breath (广度优先)
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function findOneInTree(
    tree: Tree,
    predicate: (node: TreeNode) => boolean,
    traverseType: TraverseType | string = TraverseType.Breath,
    options?: TreePathOptions
): TreeNode | null {
    return (
        (
            _traverse(tree, predicate, traverseType === TraverseType.Depth ? 'unshift' : 'push', {
                ...options,
                some: true,
                returnArray: true
            }) as TreeNode[]
        )?.[0] ?? null
    );
}

/**
 * 查找树数据, 返回所有匹配的数据
 * @param tree 树数据
 * @param predicate 遍历函数
 * @param traverseType 遍历方式 breath|depth, 默认 breath (广度优先)
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function findAllInTree(
    tree: Tree,
    predicate: (node: TreeNode) => boolean,
    traverseType: TraverseType = TraverseType.Breath,
    options?: TreePathOptions
): TreeNode[] {
    return (
        (_traverse(tree, predicate, traverseType === TraverseType.Depth ? 'unshift' : 'push', {
            ...options,
            every: true,
            returnArray: true
        }) as TreeNode[]) ?? []
    );
}

/**
 * 查找父节点
 * @param tree 树结构数据
 * @param targetNode 目标节点
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function findParentTreeNode(tree: Tree, targetNode: TreeNode, options?: TreeNodeFieldAlias): TreeNode | null {
    const { idKey = 'id', parentIdKey = 'pId' } = options || {};
    if (targetNode[parentIdKey]) {
        return findOneInTree(
            tree,
            (node: TreeNode) => node[idKey] === targetNode[parentIdKey],
            TraverseType.Breath,
            options
        );
    }
    return null;
}

/**
 * 获取目标节点所在兄弟节点中的索引
 * @param tree 树数据
 * @param targetNode 目标节点
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function findIndexInSiblingNode(tree: Tree, targetNode: TreeNode, options?: TreeNodeFieldAlias): number {
    const { idKey = 'id', childrenKey = 'children' } = options || {};
    const parentNode = findParentTreeNode(tree, targetNode, options);
    if (parentNode) {
        return parentNode
            ? parentNode[childrenKey].findIndex((node: TreeNode) => node[idKey] === targetNode[idKey])
            : -1;
    }
    return 0;
}

/**
 * 遍历树类型数据, 并返回新的对象
 * @param tree 树数据
 * @param callbackFn 遍历函数
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function mapTree(tree: Tree, callbackFn: (node: TreeNode) => TreeNode, options?: TreeNodeFieldAlias): Tree {
    const { childrenKey = 'children' } = options || {};
    const treeClone = tree instanceof Array ? cloneDeep(tree) : [cloneDeep(tree)];
    return treeClone.map((item: TreeNode) => {
        if (item[childrenKey]) {
            item[childrenKey] = mapTree(item[childrenKey], callbackFn);
        }
        return callbackFn(item);
    });
}

/**
 * 遍历树类型数据
 * @param tree
 * @param compareFn
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function sortTree(
    tree: Tree,
    compareFn: (a: TreeNode, b: TreeNode) => number,
    options?: TreeNodeFieldAlias
): Tree {
    const { childrenKey = 'children' } = options || {};
    let treeClone = tree instanceof Array ? cloneDeep(tree) : [cloneDeep(tree)];
    treeClone = treeClone.map((item: TreeNode) => {
        if (item[childrenKey]) {
            item[childrenKey] = sortTree(item[childrenKey], compareFn);
        }
        return item;
    });
    return treeClone.sort(compareFn);
}

/**
 * 统计所有节点的子节点的数量
 * @param tree 树类型数据
 * @param deep 是否统计所有子节点
 * @param statisticsKey 统计好的数字保存在哪个字段
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function statisticsTreeNodeChildren(
    tree: Tree,
    deep = false,
    statisticsKey = 'statistics',
    options?: TreeNodeFieldAlias
): Tree {
    const { childrenKey = 'children' } = options || {};
    return mapTree(tree, (node) => {
        if (node[childrenKey] && node[childrenKey].length) {
            if (deep) {
                node[statisticsKey] = node[childrenKey].reduce((prev: number, child: TreeNode) => {
                    return prev + child[statisticsKey] || 0;
                }, 0);
                node[statisticsKey] += node[childrenKey].length;
            } else {
                node[statisticsKey] = node[childrenKey].length;
            }
        }
        return node;
    });
}

/**
 * 向上查找所有父节点
 * @param tree 树数据
 * @param predicate 查找的节点的方法
 * @param isContainerTarget 是否包含匹配的节点
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function closestParentItemInTree(
    tree: Tree,
    predicate: (node: TreeNode) => boolean,
    isContainerTarget = false,
    options?: TreeNodeFieldAlias
): TreeNode[] {
    const { childrenKey = 'children' } = options || {};
    const result: TreeNode[] = [];
    const traverseFn: (node: TreeNode) => boolean = (node) => {
        let hasExist = false;
        if (node[childrenKey] && node[childrenKey].length) {
            hasExist = node[childrenKey].filter((childrenNode: TreeNode) => traverseFn(childrenNode)).length > 0;
        }
        if (hasExist) {
            result.unshift(node);
            return true;
        } else {
            const matchResult = predicate(node);
            if (matchResult && isContainerTarget) {
                result.unshift(node);
            }
            return matchResult;
        }
    };
    if (tree instanceof Array) {
        tree.forEach((item) => traverseFn(item));
    } else {
        traverseFn(tree);
    }
    return result;
}

/**
 * 替换树节点数据
 * @param tree 树类型数据
 * @param predicate 匹配的方法
 * @param replaceNode 要替换的值
 * @returns {[]}
 */
export function replaceTreeNode(
    tree: Tree,
    predicate: (node: TreeNode) => boolean,
    replaceNode: ((node: TreeNode) => TreeNode) | TreeNode
): Tree {
    return mapTree(tree, (node) => {
        if (predicate(node)) {
            if (replaceNode instanceof Function) {
                return replaceNode(node);
            }
            return replaceNode;
        }
        return node;
    });
}

/**
 * 树节点数据
 * @param tree 树类型数据
 * @param predicate 匹配的方法
 * @param updateProps 要替换的值
 * @returns {[]}
 */
export function updateTreeNode(tree: Tree, predicate: (node: TreeNode) => boolean, updateProps: TreeNode): Tree {
    return mapTree(tree, (node) => {
        if (predicate(node)) {
            return { ...node, ...updateProps };
        }
        return node;
    });
}

/**
 * 更新目标节点及子节点的数据
 * TODO: 可以优化
 * @param tree 树类型数据
 * @param fieldName
 * @param fieldValue
 * @param updateProps 更新的属性
 * @param options
 */
export function updateTreeNodeAndAllChildrenNode(
    tree: Tree = [],
    fieldName: string,
    fieldValue: any,
    updateProps = {},
    options?: TreeNodeFieldAlias
): Tree {
    const { childrenKey = 'children' } = options || {};
    return cloneDeep(tree).map((item: TreeNode) => {
        let result = { ...item };
        const children = result[childrenKey];
        if (item[fieldName] === fieldValue) {
            result = { ...result, ...updateProps };
            if (Array.isArray(children) && children.length) {
                result[childrenKey] = mapTree(children, (data: TreeNode) => ({ ...data, ...updateProps }));
            }
        } else if (Array.isArray(children) && children.length) {
            result[childrenKey] = updateTreeNodeAndAllChildrenNode(children, fieldName, fieldValue, updateProps);
        }
        return result;
    });
}

/**
 * 替换目标节点及父节点
 * TODO: 可以优化
 * @param tree
 * @param fieldName
 * @param fieldValue
 * @param updateProps
 * @param options
 */
export function updateTreeNodeAndAllParentNode(
    tree: Tree = [],
    fieldName: string,
    fieldValue: any,
    updateProps: Record<string, any>,
    options?: TreeNodeFieldAlias
): Tree {
    const { idKey = 'id' } = options || {};
    const parentPathArray = closestParentItemInTree(
        tree,
        (item: TreeNode) => item[fieldName] === fieldValue,
        true,
        options
    );
    let result = cloneDeep(tree);
    parentPathArray.forEach((item: TreeNode) => {
        result = updateTreeNode(result, (node: TreeNode) => node[idKey] === item[idKey], updateProps);
    });
    return result;
}

/**
 * 删除空的 children 节点
 * @param tree 树类型数据
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function removeEmptyChildrenTreeNode(tree: Tree, options?: TreeNodeFieldAlias): Tree {
    const { childrenKey = 'children' } = options || {};
    return mapTree(tree, (node) => {
        if (Array.isArray(node[childrenKey]) && node[childrenKey].length) {
            node[childrenKey] = removeEmptyChildrenTreeNode(node[childrenKey]);
        } else if (node[childrenKey]) {
            delete node[childrenKey];
        }
        return node;
    });
}

/**
 * 过滤树类型数据, 保留匹配节点的父级
 * @param tree 树数据
 * @param predicate 匹配的方法
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 * @returns {*}
 */
export function filterTree(tree: Tree, predicate: (node: TreeNode) => boolean, options?: TreeNodeFieldAlias): Tree {
    const { childrenKey = 'children' } = options || {};
    return cloneDeep(tree).filter((child: TreeNode) => {
        if (child[childrenKey]) {
            child[childrenKey] = filterTree(child[childrenKey], predicate);
            // 如果子节点有匹配的结果, 就直接返回父节点
            if (child[childrenKey] && child[childrenKey].length) {
                return child;
            }
        }
        return predicate(child);
    });
}

/**
 * 为没有父节点的树数据添加父节点
 * @param tree
 * @param options 别名配置, 默认值为 { idKey: 'id', parentIdKey: 'pId', childrenKey: 'children' }
 */
export function completionTreeNodePid(tree: Tree, options?: TreeNodeFieldAlias): Tree {
    const { idKey = 'id', parentIdKey = 'pId', childrenKey = 'children' } = options || {};
    const treeDataClone = cloneDeep(tree) as TreeNode[];
    for (let i = 0; i < treeDataClone.length; i += 1) {
        treeDataClone[i][childrenKey] = completionTreeNodePid(
            treeDataClone[i][childrenKey] &&
                treeDataClone[i][childrenKey].length &&
                treeDataClone[i][childrenKey].map((item: TreeNode) => {
                    return {
                        ...item,
                        [parentIdKey]: item[parentIdKey] || treeDataClone[i][idKey]
                    };
                })
        );
    }
    return treeDataClone;
}

/**
 * 获取目标节点的右侧节点
 * @param tree 树数据
 * @param targetNode 目标节点
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function getRightNode(tree: Tree, targetNode: TreeNode, options?: TreeNodeFieldAlias): TreeNode | null {
    const { idKey = 'id', childrenKey = 'children' } = options || {};
    const parentNode = findParentTreeNode(tree, targetNode, options);
    if (parentNode) {
        const targetIndex = parentNode
            ? parentNode[childrenKey].findIndex((node: TreeNode) => node[idKey] === targetNode[idKey])
            : -1;
        return parentNode[childrenKey].slice(targetIndex + 1, targetIndex + 2)?.[0];
    }
    return null;
}

/**
 * 获取目标节点的所有右侧节点
 * @param tree 树数据
 * @param targetNode 目标节点
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function getAllRightNode(tree: Tree, targetNode: TreeNode, options?: TreeNodeFieldAlias): TreeNode[] {
    const { idKey = 'id', childrenKey = 'children' } = options || {};
    const parentNode = findParentTreeNode(tree, targetNode, options);
    if (parentNode) {
        const targetIndex = parentNode
            ? parentNode[childrenKey].findIndex((node: TreeNode) => node[idKey] === targetNode[idKey])
            : -1;
        return parentNode[childrenKey].slice(targetIndex + 1);
    }
    return [];
}

/**
 * 获取目标节点的左侧节点
 * @param tree 树数据
 * @param targetNode 目标节点
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function getLeftNode(tree: Tree, targetNode: TreeNode, options?: TreeNodeFieldAlias): TreeNode | null {
    const { idKey = 'id', childrenKey = 'children' } = options || {};
    const parentNode = findParentTreeNode(tree, targetNode, options);
    if (parentNode) {
        const targetIndex = parentNode
            ? parentNode[childrenKey].findIndex((node: TreeNode) => node[idKey] === targetNode[idKey])
            : -1;
        return parentNode[childrenKey].slice(targetIndex - 1, targetIndex - 2)?.[0];
    }
    return null;
}

/**
 * 获取目标节点的所有左侧节点
 * @param tree 树数据
 * @param targetNode 目标节点
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function getAllLeftNode(tree: Tree, targetNode: TreeNode, options?: TreeNodeFieldAlias): TreeNode[] {
    const { idKey = 'id', childrenKey = 'children' } = options || {};
    const parentNode = findParentTreeNode(tree, targetNode, options);
    if (parentNode && parentNode[childrenKey] instanceof Array) {
        const targetIndex = parentNode
            ? parentNode[childrenKey].findIndex((node: TreeNode) => node[idKey] === targetNode[idKey])
            : -1;
        return parentNode[childrenKey].slice(0, targetIndex);
    }
    return [];
}

/**
 * 删除空的 children 节点
 *
 * @export
 * @param tree 树类型数据
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function removeEmptyChildren(tree: Tree = [], options?: TreeNodeFieldAlias): Tree {
    const { childrenKey = 'children' } = options || {};
    return Array.isArray(tree)
        ? cloneDeep(tree).map((item) => {
              const result = { ...item };
              const { children } = result;
              if (Array.isArray(children) && children.length) {
                  result[childrenKey] = removeEmptyChildren(children, options);
              } else {
                  delete result[childrenKey];
              }
              return result;
          })
        : [];
}

/**
 * 获取树的深度
 * @param tree 树类型数据
 * @param options 别名配置, 默认值为 { childrenKey: 'children' }
 */
export function getTreeDepth(tree: Tree, options?: TreeNodeFieldAlias): number {
    const { childrenKey = 'children' } = options || {};
    let deep = 0;
    const fn = (data: Tree, index: number) => {
        data.forEach((elem: TreeNode) => {
            if (index > deep) {
                deep = index;
            }
            if (elem[childrenKey]?.length > 0) {
                fn(elem[childrenKey], deep + 1);
            }
        });
    };
    if (tree instanceof Array) {
        fn(tree, 1);
    } else {
        fn([tree], 0);
    }
    return deep;
}
