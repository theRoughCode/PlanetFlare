#!/bin/bash
echo "Compiling contract..."
truffle compile
echo "Copying build to publisher..."
cp -r ./build ../publisher
echo "Copying build to provider..."
cp -r ./build ../provider
echo "Deploying contract onto local node..."
echo $(truffle migrate | grep 'contract address' | tail -1 | sed 's/^.*: //') > contract-address.txt
echo "Deployed contract!"
echo "Copying contract address to publisher..."
cp ./contract-address.txt ../publisher/contract-address.txt
echo "Copying contract address to provider..."
cp ./contract-address.txt ../provider/contract-address.txt
