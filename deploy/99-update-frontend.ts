import { ethers, network } from 'hardhat'
import fs from 'fs'

const FRONTEND_ADDRESSES_FILE = '../raffle-frontend/constants/contractAddresses.json'

const updateFrontend = async function () {
    if (process.env.UPDATE_FRONTEND) {
        updateContractAddresses()
    }
}

async function updateContractAddresses() {
    const raffle = await ethers.getContract('Raffle')
    const currentAddresses = JSON.parse(fs.readFileSync(FRONTEND_ADDRESSES_FILE, 'utf8'))
    const chainId = network.config.chainId!.toString()
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.address)) {
            currentAddresses[chainId].push(raffle.address)
        }
    } else {
        currentAddresses[chainId] = [raffle.address]
    }

    fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

export default updateFrontend
updateFrontend.tags = ['all', 'frontend']
