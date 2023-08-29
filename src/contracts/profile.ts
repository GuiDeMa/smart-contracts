import { assert } from 'console'
import {
    ByteString,
    HashedMap,
    HashedSet,
    hash256,
    PubKey,
    Sig,
    SigHash,
    SmartContract,
    method,
    prop,
} from 'scrypt-ts'

export class Profile extends SmartContract {
    @prop()
    version: ByteString

    @prop()
    owner: PubKey

    @prop(true)
    settings: HashedMap<ByteString, ByteString>

    constructor(
        version: ByteString,
        owner: PubKey,
        settings: HashedMap<ByteString, ByteString>
    ) {
        super(...arguments)
        this.version = version
        this.owner = owner
        this.settings = settings
    }

    @method(SigHash.SINGLE)
    public updateSettings(key: ByteString, value: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.owner), `checkSig failed`)

        // add data
        this.settings.set(key, value)

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public removeKeySettings(key: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.owner), `checkSig failed`)

        // add data
        this.settings.delete(key)

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public clearSettings(sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.owner), `checkSig failed`)

        // add data
        this.settings.clear()

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }
}
