import {
    assert,
    ByteString,
    method,
    prop,
    hash160,
    hash256,
    SmartContract,
    PubKey,
    PubKeyHash,
    Sig,
    Utils,
} from 'scrypt-ts'

export class OneHour extends SmartContract {
    @prop()
    version: ByteString

    @prop()
    creator: PubKey

    @prop(true)
    pubKeyHash: PubKeyHash

    @prop(true)
    owner: PubKey

    @prop(true)
    price: bigint

    @prop(true)
    redeemed: boolean

    constructor(version: ByteString, creator: PubKey) {
        super(...arguments)
        this.version = version
        this.creator = creator
        this.pubKeyHash = hash160(creator)
        this.owner = creator
        this.price = 0n
        this.redeemed = false
    }

    @method()
    public list(price: bigint, pubKey: PubKey, sig: Sig) {
        assert(
            this.pubKeyHash === hash160(this.owner),
            'You do not own that Item'
        ) // Am I doing this right?
        assert(this.redeemed === false, 'This item is already redeemed')

        this.price = price

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')

        assert(hash160(pubKey) === this.pubKeyHash)
        assert(
            this.checkSig(sig, pubKey),
            `checkSig failed, pubKeyHash: ${this.pubKeyHash}`
        )
    }

    @method()
    public unlist(pubKey: PubKey, sig: Sig) {
        assert(
            this.pubKeyHash === hash160(this.owner),
            'You do not own that Item'
        )
        assert(this.redeemed === false, 'This item is already redeemed')

        this.price = 0n

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')

        assert(hash160(pubKey) === this.pubKeyHash)
        assert(
            this.checkSig(sig, pubKey),
            `checkSig failed, pubKeyHash: ${this.pubKeyHash}`
        )
    }

    @method()
    public buy(pubKeyHash: PubKeyHash) {
        assert(this.redeemed === false, 'This item is already redeemed')
        assert(this.price > 0, 'Item is not listed for sale')

        const seller = this.pubKeyHash

        //assign ownership to buyer
        this.pubKeyHash = pubKeyHash

        //ensure seller receives the asking price
        let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)
        outputs += Utils.buildPublicKeyHashOutput(seller, this.price)
        outputs += this.buildChangeOutput()
        assert(
            this.ctx.hashOutputs === hash256(outputs),
            'hashOutputs mismatch'
        )
    }

    @method()
    public tranfer(sender: PubKey, sig: Sig, receiver: PubKey) {
        assert(this.redeemed === false, 'This item is already redeemed')
        assert(
            this.pubKeyHash === hash160(this.owner),
            'You do not own that Item'
        )

        //verify sender's signature
        assert(
            this.checkSig(sig, sender),
            `sender signature check failed ${sender}`
        )

        //change token owner
        this.pubKeyHash = hash160(receiver)

        //validate hashOutputs
        assert(
            this.ctx.hashOutputs ==
                hash256(this.buildStateOutput(this.ctx.utxo.value)),
            'hashOutputs check failed'
        )
    }

    @method()
    public redeeem(pubKey: PubKey, sig: Sig) {
        assert(
            this.pubKeyHash === hash160(this.owner),
            'You do not own that Item'
        )
        assert(this.redeemed === false, 'This item is already redeemed')

        this.redeemed = true

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')

        assert(hash160(pubKey) === this.pubKeyHash)
        assert(
            this.checkSig(sig, pubKey),
            `checkSig failed, pubKeyHash: ${this.pubKeyHash}`
        )
    }

    //Future possible use case: if you own multiple hours of a player you can consolidate them into one chunk (multi-redeem)
    /*     @method()
    public consolidateHours(){

    } */

    @method()
    public addMessage(content: ByteString, author: PubKey, sig: Sig) {
        assert(
            author === this.owner || author === this.creator,
            'only token owner and creator are allowed to message'
        )
        assert(this.checkSig(sig, author), `checkSig failed, pubKey:${author}`)

        let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)

        if (this.changeAmount > 0n) {
            outputs += this.buildChangeOutput()
        }

        assert(this.ctx.hashOutputs === hash256(outputs), 'state not preserved')
    }

    @method()
    public dispute(
        author: PubKey,
        target: PubKey,
        reason: ByteString,
        sig: Sig
    ) {
        assert(
            author === this.owner || author === this.creator,
            'only token owner and creator are allowed to dispute'
        )
        assert(this.checkSig(sig, author), `checkSig failed, pubKey:${author}`)

        let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)

        if (this.changeAmount > 0n) {
            outputs += this.buildChangeOutput()
        }

        assert(this.ctx.hashOutputs === hash256(outputs), 'state not preserved')
    }
}
