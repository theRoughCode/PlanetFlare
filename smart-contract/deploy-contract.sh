#!/bin/bash
echo $(truffle migrate | grep 'contract address' | tail -1 | sed 's/^.*: //') > contract-address.txt
