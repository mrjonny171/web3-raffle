import { ethers, network } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const BASE_FEE = ethers.utils.parseEther('0.25')
const GAS_PRICE_LINK = 1e9

const deployMocks: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const args = [BASE_FEE, GAS_PRICE_LINK]

    const chainId = network.config.chainId!

    if (chainId == 31337) {
        log('Local network detected! Deploying mocks...')

        await deploy('VRFCoordinatorV2Mock', {
            from: deployer,
            args: args,
            log: true,
        })

        log('Mocks Deployed!')
        log('--------------------')
    }
}

export default deployMocks
deployMocks.tags = ['all', 'mocks']
