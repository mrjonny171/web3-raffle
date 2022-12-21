import { ethers } from 'hardhat'

export interface networkConfigItem {
    vrfCoordinatorV2?: string
    name?: string
    blockConfirmations?: number
    entranceFee?: string
    gasLane?: string
    subscriptionId?: string
    callbackGasLimit?: string
    timeInterval?: string
}

export interface networkConfigInfo {
    [key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
    5: {
        name: 'goerli',
        vrfCoordinatorV2: '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D',
        blockConfirmations: 6,
        entranceFee: ethers.utils.parseEther('0.01').toString(),
        gasLane: '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15',
        subscriptionId: '0',
        callbackGasLimit: '500000',
        timeInterval: '30',
    },
    137: {
        name: 'polygon',
        vrfCoordinatorV2: '0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed',
        blockConfirmations: 6,
        entranceFee: ethers.utils.parseEther('0.01').toString(),
        gasLane: '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f',
        subscriptionId: '',
        callbackGasLimit: '500000',
        timeInterval: '30',
    },
    31337: {
        entranceFee: ethers.utils.parseEther('0.01').toString(),
        gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc', // 30 gwei
        callbackGasLimit: '500000',
        timeInterval: '30',
    },
}

export const developmentChains = ['hardhat', 'localhost']
