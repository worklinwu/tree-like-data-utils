/* eslint-disable no-unused-vars */
import { cloneDeep } from 'lodash-es';
import type { TreeLikeArray, TreeLikeArrayItem, TreeNodeFieldAlias } from './types';

/**
 * 将List结构的对象数组转化为树形结构
 * @param array {Array<TreeLikeArrayItem>} 源数据
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function createTreeFromTreeLikeArray(array: TreeLikeArray, options?: TreeNodeFieldAlias): TreeLikeArray {
    const { idKey = 'id', parentIdKey = 'pId' } = options || {};
    const _idMap = Object.create(null);
    const cloneData: typeof array = cloneDeep(array);
    cloneData.forEach((row: TreeLikeArrayItem): void => {
        _idMap[row[idKey]] = row;
    });
    const result: TreeLikeArray = [];
    cloneData.forEach((row: TreeLikeArrayItem): void => {
        const parent = _idMap[row[parentIdKey]];
        if (parent) {
            const v = parent.children || (parent.children = []);
            v.push(row);
        } else {
            result.push(row);
        }
    });
    return result;
}

/**
 * 过滤树数据. 如果子节点有匹配数据, 会连带父节点一起返回
 * @param array 要过滤的数组数据
 * @param predicate 过滤函数
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function filterTreeArray(
    array: TreeLikeArray,
    predicate: (item: TreeLikeArrayItem) => boolean,
    options?: TreeNodeFieldAlias
): TreeLikeArray {
    const { idKey = 'id', parentIdKey = 'pId' } = options || {};
    const result: TreeLikeArray = array.filter(predicate);
    const needCheekPidArr = [...result];
    // 查找父级
    while (needCheekPidArr.length) {
        // 从末尾截取一个节点, (从末尾是因为 array 大概率是排序过的数据, 从末尾查找速度快)
        const currentItemTemp: TreeLikeArrayItem = needCheekPidArr.splice(needCheekPidArr.length - 1, 1);
        const currentItem = currentItemTemp && currentItemTemp.length && currentItemTemp[0];
        if (currentItem[parentIdKey]) {
            // 判断是否有父节点, 有父节点把父节点找出来添加进结果中
            const parentItem = array.filter(
                (item: TreeLikeArrayItem): boolean => item[idKey] === currentItem[parentIdKey]
            );
            if (
                parentItem.length &&
                !result.some((item: TreeLikeArrayItem): boolean => item[idKey] === parentItem[0][idKey])
            ) {
                result.unshift(parentItem[0]);
                // 重新丢回队列, 去查找父级的父级
                needCheekPidArr.push(parentItem[0]);
            }
        }
    }
    return result;
}

/**
 * 向上查找所有父节点
 * @param array 数组类型数据
 * @param node 要查找的节点
 * @param deep 遍历的深度
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function closestParentItemInTreeArray(
    array: TreeLikeArray,
    node: TreeLikeArrayItem,
    deep: false | number = false,
    options?: TreeNodeFieldAlias
): TreeLikeArray {
    const { idKey = 'id', parentIdKey = 'pId' } = options || {};
    const result: TreeLikeArray = [];
    let currentItem: TreeLikeArrayItem | undefined = node;
    let deepLoopCount = typeof deep === 'number' ? deep : Infinity;
    const findItem: () => TreeLikeArrayItem | undefined = () => {
        const pId = currentItem?.[parentIdKey];
        if (pId) {
            return array.find((item: TreeLikeArrayItem) => item[idKey] === pId);
        }
        return undefined;
    };
    do {
        currentItem = findItem();
        if (currentItem) {
            result.unshift(currentItem);
        }
        deepLoopCount -= 1;
    } while (currentItem && currentItem[parentIdKey] && deepLoopCount > 0);
    return result;
}

/**
 * 向上查找所有父节点 key 值
 * @param array 数组类型数据
 * @param key 要查找的节点
 * @param deep 遍历的深度
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function closestParentKeysInTreeArray(
    array: TreeLikeArray,
    key: keyof any,
    deep: false | number = false,
    options?: TreeNodeFieldAlias
): string[] {
    const { idKey = 'id', parentIdKey = 'pId' } = options || {};
    const result: string[] = [];
    let currentItem: TreeLikeArrayItem | undefined = array.find((item: TreeLikeArrayItem) => item[idKey] === key);
    let deepLoopCount: number = typeof deep === 'number' ? deep : Infinity;
    if (!currentItem) {
        return result;
    }
    const findItem: () => TreeLikeArrayItem | undefined = () => {
        const pId = currentItem?.[parentIdKey];
        if (pId) {
            return array.find((item: TreeLikeArrayItem) => item[idKey] === pId);
        }
        return undefined;
    };
    do {
        currentItem = findItem();
        if (currentItem) {
            result.unshift(currentItem[idKey]);
        }
        deepLoopCount -= 1;
    } while (currentItem && currentItem[parentIdKey] && deepLoopCount > 0);
    return result;
}

/**
 * 向下查找所有子节点
 * @param array 数组类型数据
 * @param targetNode 要查找的节点
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function findChildrenItemInTreeArray(
    array: TreeLikeArray,
    targetNode: TreeLikeArrayItem,
    options?: TreeNodeFieldAlias
): TreeLikeArray {
    const { idKey = 'id', parentIdKey = 'pId' } = options || {};
    const result: TreeLikeArray = [];
    const findChildren = (pId: keyof any) => array.filter((item: TreeLikeArrayItem) => item[parentIdKey] === pId);
    let queue: TreeLikeArray = findChildren(targetNode[idKey]);
    while (queue.length) {
        const currentItem: TreeLikeArrayItem | undefined = queue.shift();
        if (currentItem) {
            const children = findChildren(currentItem[idKey]);
            result.push(currentItem);
            queue = queue.concat(children);
        }
    }
    return result;
}

/**
 * 向下查找所有子节点
 * @param array 数组类型数据
 * @param targetNode 要查找的节点
 * @param options 别名配置, 默认值为 { idKey: 'id', childrenKey: 'children' }
 */
export function hasChildrenNode(
    array: TreeLikeArray,
    targetNode: TreeLikeArrayItem,
    options?: TreeNodeFieldAlias
): boolean {
    const { idKey = 'id', parentIdKey = 'pId' } = options || {};
    return array.some((item: TreeLikeArrayItem) => item[parentIdKey] === targetNode[idKey]);
}
