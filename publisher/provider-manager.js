class ProviderManager {
    /**
     * Keeps track of providers who served us data.
     * this.providers = {
     *  [cid: string]: {
     *    [peerId: string]: [numBlocksServed: number]
     *  }
     * }
     */
    constructor() {
        this.providers = {};
        this.MAX_SIZE = 100;
        this.numInQueue = 0;
        this.queue = [];
    }

    add(peerId, cid) {
        if (!this.providers.hasOwnProperty(cid)) {
            this.providers[cid] = {};
            this.queue.push(cid);
            if (this.numInQueue === this.MAX_SIZE) {
                const oldest = this.queue.shift();
                delete this.providers[oldest];
            }
        }

        if (!this.providers[cid].hasOwnProperty(peerId)) {
            this.providers[cid][peerId] = 0;
        }
        this.providers[cid][peerId]++;
    }

    get(cid) {
        return this.providers[cid];
    }

    remove(cid) {
        if (!this.providers.hasOwnProperty(cid)) return;
        delete this.providers[cid];
        this.numInQueue--;
        this.queue = this.queue.filter((val) => val !== cid);
    }
}