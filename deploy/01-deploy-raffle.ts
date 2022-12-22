import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ethers, network } from 'hardhat'
import { networkConfig } from '../helper-config'
import verify from '../utils/verify'
import { VRFCoordinatorV2Mock } from '../typechain-types'
import { ContractReceipt, ContractTransaction } from 'ethers'

const FUND_AMOUNT = '1000000000000000000000'

const deployRaffle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId!

    let vrfCoordinatorV2Address: string, subscriptionId: string // Address of the contract where the random number is generated

    if (chainId == 31337) {
        const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
            'VRFCoordinatorV2Mock'
        )
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse: ContractTransaction =
            await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt: ContractReceipt = await transactionResponse.wait(1)
        //@ts-ignore
        subscriptionId = transactionReceipt.events[0].args.subId

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2!
        subscriptionId = networkConfig[chainId].subscriptionId!
    }

    const entranceFee = networkConfig[chainId].entranceFee! //Fee to enter in the raffle

    const gasLane = networkConfig[chainId].gasLane! //Maximum gas someone is willing to pay for the request

    const callbackGasLimit = networkConfig[chainId].callbackGasLimit!

    const timeInterval = networkConfig[chainId].timeInterval! // Function time interval

    const args: any[] = [
        // Args to be passed to the constructor of the array
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        timeInterval,
    ]

    const raffle = await deploy('Raffle', {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
    })

    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        log('Verifying contract...')
        await verify(raffle.address, args)
    }

    if (chainId == 31337) {
        const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
            'VRFCoordinatorV2Mock'
        )
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)
        log('adding consumer...')
        log('Consumer added!')
    }
}

export default deployRaffle
deployRaffle.tags = ['all', 'raffle']
