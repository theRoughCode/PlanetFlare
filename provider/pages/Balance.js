import React, { useEffect, useState } from "react";
import Link from "@material-ui/core/Link";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Popover from "@material-ui/core/Popover";
import Title from "./Title";

const useStyles = makeStyles((theme) => ({
  depositContext: {
    flex: 1,
  },
  typography: {
    padding: theme.spacing(2),
  },
}));

const getDate = () =>
  new Date().toLocaleString("default", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export default function Balance({
  web3,
  pfcAbi,
  pfcContractAddress,
  walletAddress,
}) {
  const classes = useStyles();
  const pollInterval = 1000;
  const [anchorEl, setAnchorEl] = useState(null);
  const [balance, setBalance] = useState(0);
  const [date, setDate] = useState("15 March, 2019 13:25:11");

  // Poll for updated account balance
  useEffect(() => {
    if (
      web3 == null ||
      pfcAbi == null ||
      pfcContractAddress == null ||
      walletAddress == null
    )
      return;
    const interval = setInterval(async () => {
      try {
        const pfcContract = new web3.eth.Contract(pfcAbi, pfcContractAddress);
        const newBalance =
          (await pfcContract.methods.balanceOf(walletAddress).call()) || 0;
        setBalance(newBalance);
      } catch (error) {
        console.error("Failed to retrieve account balance.", error);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [web3, pfcAbi, pfcContractAddress, walletAddress]);

  useEffect(() => setDate(getDate()), [walletAddress, balance]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "balance-popover" : undefined;

  return (
    <React.Fragment>
      <Title>Current Balance</Title>
      <Typography component="p" variant="h4">
        {`${balance} PFC`}
      </Typography>
      <Typography color="textSecondary" className={classes.depositContext}>
        on {date}
      </Typography>
      {walletAddress != null && (
        <div>
          <Link color="primary" href="#" onClick={handleClick}>
            View account
          </Link>
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            <Typography className={classes.typography}>
              {walletAddress}
            </Typography>
          </Popover>
        </div>
      )}
    </React.Fragment>
  );
}
