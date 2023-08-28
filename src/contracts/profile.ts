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
    xpub: PubKey

    @prop(true)
    name: ByteString

    @prop(true)
    bio: ByteString

    @prop(true)
    avatar: ByteString

    @prop(true)
    cover: ByteString

    @prop(true)
    socials: HashedMap<ByteString, ByteString> // key/value pair (ex: "twitter", "https://twitter.com/1aristot3lis")

    @prop(true)
    links: HashedSet<ByteString>

    constructor(
        version: ByteString,
        xpub: PubKey,
        name: ByteString,
        bio: ByteString,
        avatar: ByteString,
        cover: ByteString,
        socials: HashedMap<ByteString, ByteString>,
        links: HashedSet<ByteString>
    ) {
        super(...arguments)
        this.version = version
        this.xpub = xpub
        this.name = name
        this.bio = bio
        this.avatar = avatar
        this.cover = cover
        this.socials = socials
        this.links = links
    }

    @method(SigHash.SINGLE)
    public udptateName(newName: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)
        // update data
        this.name = newName
        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public udptateBio(newBio: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)
        // update data
        this.bio = newBio
        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public udptateAvatar(newAvatar: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)
        // update data
        this.avatar = newAvatar
        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public updateCover(newCover: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)
        // update data
        this.cover = newCover
        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public updateSocials(key: ByteString, value: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)

        // add data
        this.socials.set(key, value)

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public removeKeySocial(key: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)

        // add data
        this.socials.delete(key)

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public deleteSocials(sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)

        // add data
        this.socials.clear()

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public addLink(link: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)

        // add data
        this.links.add(link)

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public removeLink(link: ByteString, sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)

        // add data
        this.links.delete(link)

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }

    @method(SigHash.SINGLE)
    public clearLinks(sig: Sig) {
        // check signature
        assert(this.checkSig(sig, this.xpub), `checkSig failed`)

        // add data
        this.links.clear()

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        const output: ByteString = this.buildStateOutput(amount)
        // verify current tx has this single output
        assert(this.ctx.hashOutputs === hash256(output), 'hashOutputs mismatch')
    }
}
