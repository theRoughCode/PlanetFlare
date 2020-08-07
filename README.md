# PlanetFlare
<img src="./pfc-spin.png" width="150" height="150" />

Contributors: Raphael Koh, Richard Liu, Jashan Shewakramani

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
