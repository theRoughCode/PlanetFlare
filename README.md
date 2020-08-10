# PlanetFlare
<img src="./pfc-spin.png" width="150" height="150" />

Contributors: Raphael Koh, Richard Liu, Jashan Shewakramani

## Description
With the price of storage decreasing at a much more rapid pace than network bandwidth/speed, there is a huge opportunity to leverage this cheap storage to increase page load times. With IPFS, we can reduce the impact that conglomerates have on the CDN market and empower the people to use their storage space as a CDN to earn passive income. The cheaper storage gets, the more attractive and lucrative a decentralized CDN becomes.

Planetflare is a platform that creates this retrieval marketplace by enabling anyone with a computer to serve assets as a CDN and get paid for it. Content publishers (e.g. Netflix) can host their assets on Planetflare and bid for CDN availability by specifying pricing  This open market drives the cost of content distribution down. This also enables CDNs to be more globally distributed as we are no longer limited by data centres. If you want to request a piece of content from Botswana, a provider 2 blocks down could already be caching content for you.

As a publisher, hosting content using Planetflare is as easy as uploading your assets on the Publisher dashboard to a Textile Bucket. A bid (or bounty) in our ERC20 token, PlanetFlare Coin (or PFC), is specified for the distribution of that content and committed to the chain.
Integrating Planetflare into your website is seamless; it's as easy as injecting a custom script into your frontend code! The custom script also handles rewarding the Provider that served your cached assets.

Anyone can serve as a Planetflare Provider by downloading and running the Planetflare Provider node. This low barrier to entry encourages strong competition. The Provider can choose to either query the chain for the most lucrative bounties or choose to listen in on incoming requests from peers. The Provider node allows customization of strategies so that the nodes with the best strategies will most likely be the ones getting rewarded by Publishers. Strategies can become as complex as setting up a machine learning model on AWS that the Provider node can query to decide on their caching strategy!

Credits to [Michelle Liang](https://github.com/michliang) for the amazing Planetflare logo designs!

## How it's made
This project consists of 3 components:

1. Provider (serves assets)
The Provider node is a custom wrapper around IPFS and Libp2p with a dashboard made in React. The backend IPFS node and the dashboard communicate over Socket.io. The node also communicates to the ethereum chain via Metamask and Web3. The Provider node allows the user to create custom caching strategies and listens in on incoming requests from the DHT and Bitswap (via the corresponding libp2p protocols). This allows users to create dynamic strategies that depend on statistics, such as frequency of incoming requested data.

2. Client (queries for assets)
For the Client's webpage to use assets from Planetflare, they just have to install a custom JavaScript script into their webpage. This creates an in-browser IPFS node that queries for IPFS content in the webpage. Additionally, we are using a custom forked version of IPFS in which we are querying the Bitswap ledger to figure out which Provider served us content so we can reward them.

3. Publisher (uploads assets)
The Publisher node is an IPFS node with a dashboard in React.js upload assets via the Publisher dashboard to Textile buckets. Upon uploading to a bucket, the Publisher then creates a bounty for that bucket on-chain. The Publisher also exposes an endpoint to listen in on token submissions by Providers and rewards them accordingly via payment channels.

## Running end-to-end flow
1. Start up local chain: `smart-contract/run-local-node.sh`.
2. Deploy PFC contract: `smart-contract/deploy-contract.sh`.
3. Start Publisher server: `cd publisher && npm start`.
4. Start Publisher UI: `cd publisher-ui && npm start` and go to http://localhost:3000.
5. Upload data to Textile buckets in Publisher UI.
6. Start up Provide node: `cd provider && npm start`.
7. Go to http://localhost:5000 to access Provider UI.
8. Start IPFS node.
9. Open up `publisher/index.html`.
10. In the Provider UI, you should see the receipt of a new token in the top-right.
11. Click on the button and click on "Submit Tokens".
12. Get paid!
