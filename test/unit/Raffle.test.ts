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

          describe('constructor', () => {
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

          describe('enterRaffle', () => {
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

          describe('checkUpkeep', () => {
              it('returns false if people have not sent any ETH', async () => {
                  await network.provider.send('evm_increaseTime', [timeInterval + 1])
                  await network.provider.send('evm_mine', [])

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(upkeepNeeded, false)
              })
              it('returns false if raffle is not open', async () => {
                  await raffle.enterRaffle({ value: validEntranceFee })

                  await network.provider.send('evm_increaseTime', [timeInterval + 1])
                  await network.provider.send('evm_mine', [])

                  await raffle.performUpkeep([])

                  const raffleState = await raffle.getRaffleState()

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])

                  assert.equal(raffleState.toString(), '1')
                  assert.equal(upkeepNeeded, false)
              })
              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: validEntranceFee })

                  await network.provider.send('evm_increaseTime', [timeInterval - 2])
                  await network.provider.request({ method: 'evm_mine', params: [] })

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])

                  assert.equal(upkeepNeeded, false)
              })

              it('returns true if raffle is open, enough time has passed, has players and has ETH balance', async () => {
                  await raffle.enterRaffle({ value: validEntranceFee })

                  await network.provider.send('evm_increaseTime', [timeInterval + 1])
                  await network.provider.send('evm_mine', [])

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])

                  assert.equal(upkeepNeeded, true)
              })
          })

          describe('performUpkeep', () => {
              it('returns an error if checkUpkeep is false', async () => {
                  await raffle.enterRaffle({ value: validEntranceFee })

                  await network.provider.send('evm_increaseTime', [timeInterval - 3])
                  await network.provider.send('evm_mine', [])

                  await expect(raffle.performUpkeep([])).to.be.revertedWithCustomError(
                      raffle,
                      'Raffle_UpkeepNotNeeded'
                  )
              })

              it('can only run if checkUpkeep is true', async () => {
                  await raffle.enterRaffle({ value: validEntranceFee })

                  await network.provider.send('evm_increaseTime', [timeInterval + 1])
                  await network.provider.send('evm_mine', [])

                  //await expect(raffle.performUpkeep([])).emit(raffle, 'RequestRaffleWinner')

                  const tx = await raffle.performUpkeep([])
                  assert(tx)
              })
              it('updates the raffle state, emits and event and calls the vrf coordinator', async () => {
                  await raffle.enterRaffle({ value: validEntranceFee })

                  await network.provider.send('evm_increaseTime', [timeInterval + 1])
                  await network.provider.send('evm_mine', [])

                  const tx = await raffle.performUpkeep([])
                  const txReceipt = await tx.wait(1)
                  const raffleState = await raffle.getRaffleState()

                  //@ts-ignore
                  const requestId = txReceipt.events[1].args.requestId

                  assert(requestId.toNumber() > 0) // event is emited
                  assert(raffleState == 1)
              })
          })
      })
