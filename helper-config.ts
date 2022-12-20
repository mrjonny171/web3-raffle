export interface networkConfigItem {
    vrfCoordinatorV2?: string
    name?: string
    blockConfirmations?: number
}

export interface networkConfigInfo {
    [key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
    5: {
        name: 'goerli',
        vrfCoordinatorV2: '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D',
        blockConfirmations: 6,
    },
    137: {
        name: 'polygon',
        vrfCoordinatorV2: '0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed',
        blockConfirmations: 6,
    },
    31337: {},
}

export const developmentChains = ['hardhat', 'localhost']
