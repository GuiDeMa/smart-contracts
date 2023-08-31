import { assert } from 'console'
import {
    HashedMap,
    PubKey,
    SigHash,
    Sig,
    SmartContract,
    method,
    prop,
    hash256,
    ByteString,
    Utils,
    hash160,
} from 'scrypt-ts'

type OwnerMap = HashedMap<bigint, PubKey> // tokenIndex, OwnerPubKey
type PriceMap = HashedMap<bigint, bigint> // tokenIndex, tokenPrice

export class Hour extends SmartContract {
    @prop()
    supply: bigint

    @prop()
    entryPrice: bigint

    @prop()
    creator: PubKey

    @prop(true)
    owners: OwnerMap

    @prop(true)
    prices: PriceMap

    constructor(creator: PubKey, owners: OwnerMap, prices: PriceMap) {
        super(...arguments)
        this.creator = creator
        this.owners = owners
        this.prices = prices
        this.supply = 218n
        this.entryPrice = 3000000n // in satoshis
    }

    @method()
    getPriceForTokenIndex(tokenId: bigint) {
        if (tokenId < 1n) {
            return this.entryPrice
        } else {
            return this.entryPrice * (tokenId * 5n)
        }
    }

    // mint a new token to receiver
    @method(SigHash.SINGLE)
    public mint(tokenId: bigint, mintTo: PubKey, minterSig: Sig) {
        // require token was not minted before
        assert(!this.owners.has(tokenId), 'token was already minted before')

        // require token is not minted out
        assert(this.owners.size <= this.supply, 'token is minted out')

        // require the minter to provide a signature before minting
        assert(
            this.checkSig(minterSig, mintTo),
            'minter signature check failed'
        )

        // set token belongs to the receiver
        this.owners.set(tokenId, mintTo)

        // ensure seller receives the asking price
        let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)
        outputs += Utils.buildPublicKeyHashOutput(
            hash160(mintTo),
            this.getPriceForTokenIndex(tokenId)
        )
        if (this.changeAmount > 0n) {
            outputs += this.buildChangeOutput()
        }

        // validate hashOutputs
        assert(
            this.ctx.hashOutputs == hash256(outputs),
            'hashOutputs check failed'
        )
    }

    // burn a token
    @method(SigHash.SINGLE)
    public burn(tokenId: bigint, sender: PubKey, sig: Sig) {
        // verify ownership
        assert(
            this.owners.canGet(tokenId, sender),
            "sender doesn't have the token"
        )

        // verify sender's signature
        assert(this.checkSig(sig, sender), 'sender signature check failed')

        // remove token from owners
        assert(this.owners.delete(tokenId), 'token burn failed')

        // remove price from prices
        assert(this.prices.delete(tokenId), 'token burn failed')

        // validate hashOutputs
        assert(
            this.ctx.hashOutputs ==
                hash256(this.buildStateOutput(this.ctx.utxo.value)),
            'hashOutputs check failed'
        )
    }

    @method()
    public buy(tokenId: bigint, buyer: PubKey, buyerSig: Sig) {
        // if token price = 0, item is not for sale
        assert(this.prices.get(tokenId) > 0, 'Item is not listed for sale')

        // require the buyer to provide a signature before buying
        assert(this.checkSig(buyerSig, buyer), 'minter signature check failed')

        const seller = this.owners.get(tokenId)
        const price = this.prices.get(tokenId)

        // assign ownership to buyer
        this.owners.set(tokenId, buyer)

        // unlist bought token
        this.prices.set(tokenId, 0n)

        // ensure seller receives the asking price
        let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)
        outputs += Utils.buildPublicKeyHashOutput(hash160(seller), price)
        if (this.changeAmount > 0n) {
            outputs += this.buildChangeOutput()
        }

        // validate hashOutputs
        assert(
            this.ctx.hashOutputs == hash256(outputs),
            'hashOutputs check failed'
        )
    }

    @method()
    public list(tokenId: bigint, price: bigint, lister: PubKey, sig: Sig) {
        // ensure price is not negative
        assert(price >= 0, 'price cannot be negative')

        // ensure ownership
        assert(
            this.owners.canGet(tokenId, lister),
            'lister does not own the token'
        )

        // verify lister's signature
        assert(this.checkSig(sig, lister), 'lister signature check failed')

        // list token to new price (0 means unlist)
        this.prices.set(tokenId, price)

        // validate hashOutputs
        assert(
            this.ctx.hashOutputs ==
                hash256(this.buildStateOutput(this.ctx.utxo.value)),
            'hashOutputs check failed'
        )
    }

    // transfer a token from sender to receiver
    @method(SigHash.SINGLE)
    public transferFrom(
        tokenId: bigint,
        sender: PubKey,
        sig: Sig,
        receiver: PubKey
    ) {
        // verify ownership
        assert(
            this.owners.canGet(tokenId, sender),
            "sender doesn't have the token"
        )

        // verify token has price
        assert(
            this.prices.has(tokenId),
            'token has no pricing, there is something wrong'
        )

        // verify sender's signature
        assert(this.checkSig(sig, sender), 'sender signature check failed')

        // unlist token from market
        this.prices.set(tokenId, 0n)

        // change token owner
        this.owners.set(tokenId, receiver)

        // validate hashOutputs
        assert(
            this.ctx.hashOutputs ==
                hash256(this.buildStateOutput(this.ctx.utxo.value)),
            'hashOutputs check failed'
        )
    }
}
