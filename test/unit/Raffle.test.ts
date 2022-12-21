import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert, expect } from 'chai'
import { deployments, ethers, network } from 'hardhat'
import { developmentChains, networkConfig } from '../../helper-config'
import { Raffle, VRFCoordinatorV2Interface } from '../../typechain-types'

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('Raffle Unit Tests', async () => {
          let raffle: Raffle
          let deployer: SignerWithAddress
          let vrfV2Coordinator: VRFCoordinatorV2Interface
          const chainId = network.config.chainId!
          let validEntranceFee: string
          let timeInterval: number

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(['all'])

              raffle = await ethers.getContract('Raffle', deployer)

              vrfV2Coordinator = await ethers.getContract('VRFCoordinatorV2Mock', deployer)

              validEntranceFee = await (await raffle.getEntranceFee()).toString()

              timeInterval = (await raffle.getTimeInterval()).toNumber()
          })

          describe('constructor', async () => {
              it('sets the vrfCoordinatorV2Interface address correctly', async () => {
                  const vrfV2CoordinatorAddress = await raffle.getVRFCoordinatorV2InterfaceAddress()
                  const entranceFee = await raffle.getEntranceFee()
                  const raffleState = await raffle.getRaffleState()

                  assert.equal(vrfV2CoordinatorAddress, vrfV2Coordinator.address)
                  assert.equal(entranceFee.toString(), networkConfig[chainId].entranceFee)
                  assert.equal(raffleState.toString(), '0')
                  assert.equal(timeInterval.toString(), timeInterval.toString())
              })
          })

          describe('enterRaffle', async () => {
              it('entrance fee is not enough', async () => {
                  await expect(
                      raffle.enterRaffle({
                          from: deployer.address,
                          value: ethers.utils.parseEther('0.009'),
                      })
                  ).to.be.revertedWithCustomError(raffle, 'Raffle__NotEnoughETHEntered')
              })

              it('records players when they enter in the raffle', async () => {
                  await raffle.enterRaffle({
                      from: deployer.address,
                      value: validEntranceFee,
                  })
                  const player = await raffle.getPlayer(0)

                  assert.equal(player, deployer.address)
              })

              it('emits event on enter', async () => {
                  await expect(
                      raffle.enterRaffle({ from: deployer.address, value: validEntranceFee })
                  ).to.emit(raffle, 'RaffleEnter')
              })

              it('it does not allow entrance when raffle is calculating', async () => {
                  const accounts = await ethers.getSigners()
                  const player = accounts[1]

                  await raffle.enterRaffle({ from: deployer.address, value: validEntranceFee })
                  await network.provider.send('evm_increaseTime', [timeInterval + 1])
                  await network.provider.send('evm_mine', [])

                  await raffle.performUpkeep([]) //calculating state, can not enter in the raffle

                  await expect(
                      raffle.enterRaffle({ value: validEntranceFee })
                  ).to.be.revertedWithCustomError(raffle, 'Raffle__NotOpen')
              })
          })
      })
