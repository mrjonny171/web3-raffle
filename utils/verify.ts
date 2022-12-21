import { run } from 'hardhat'

const verify = async (contractAddress: string, args: string[]) => {
    console.log('Verifying contract...')

    try {
        //Task:subTask
        await run('verify:verify', {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e: any) {
        if (e.message.toLowerCase().includes('already verified')) {
            console.log('Already Verified')
        } else {
            console.log(e)
        }
    }
}

export default verify
