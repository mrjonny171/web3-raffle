import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert, expect } from 'chai'
import { BigNumber } from 'ethers'
import { deployments, ethers, network } from 'hardhat'
import { developmentChains, networkConfig } from '../../helper-config'
import { Raffle } from '../../typechain-types'

developmentChains.includes(network.name)
    ? describe.skip
    : describe('Raffle Unit Tests', async () => {
          let raffle: Raffle
          let deployer: SignerWithAddress
          let validEntranceFee: BigNumber

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]

              raffle = await ethers.getContract('Raffle', deployer)

              validEntranceFee = await raffle.getEntranceFee()
          })

          describe('fulfillRandomWords', () => {
              it('Works with live Chainlink Keppers and Chainlink VRF, we get a random winner', async () => {
                  const startingTimeStamp = await raffle.getLatestTimestamp()
                  let winnerStartingBalance: BigNumber

                  await new Promise(async (resolve, reject) => {
                      raffle.once('WinnerPicked', async () => {
                          try {
                              //Add our asserts here when the winner is picked
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await deployer.getBalance()
                              const endingTimeStamp = await raffle.getLatestTimestamp()
                              const endingNumPlayers = await raffle.getNumberOfPlayers()

                              assert(endingNumPlayers.toNumber() == 0)
                              assert(endingTimeStamp > startingTimeStamp)
                              assert(raffleState == 0)
                              assert(recentWinner.toString(), deployer.address)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(validEntranceFee).toString()
                              )
                          } catch (e: any) {
                              reject(e)
                          }
                          resolve([])
                      })

                      await raffle.enterRaffle({ from: deployer.address, value: validEntranceFee })
                      winnerStartingBalance = await deployer.getBalance()
                  })
              })
          })
      })
