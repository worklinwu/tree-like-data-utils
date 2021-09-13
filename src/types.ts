export type TreeLikeArrayItem = Record<string, any>;
export type TreeLikeArray = TreeLikeArrayItem[];

export type TreeNode = Record<string, any> & { children?: Tree };
export type Tree = TreeNode[] | TreeNode;

export interface TreeNodeFieldAlias {
    idKey?: string;
    parentIdKey?: string;
    childrenKey?: string;
}

export interface TreePathOptions {
    pathSeparator?: string;
    fieldName?: string;
    childrenKey?: string;
}

export type TraverseOptions = {
    some?: boolean;
    every?: boolean;
    returnBoolean?: boolean;
    returnArray?: boolean;
};

export enum TraverseType {
    Depth = 'depth',
    Breath = 'breath'
}
