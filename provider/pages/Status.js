import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import Brightness1Icon from "@material-ui/icons/Brightness1";
import Commands from "./Commands";

const useStyles = makeStyles((theme) => ({
  statusCircle: {
    marginLeft: 10,
    marginTop: 5,
  },
  divider: {
    margin: 10,
  },
  shutdownBtnDiv: {
    margin: 5,
  },
}));

export default function Status({
  ipfsReady,
  peerId,
  ipfsLocation,
  paymentStrategies,
  paymentStrategyHandler,
  cacheStrategies,
  cacheStrategyHandler,
  startHandler,
  shutdownHandler,
}) {
  const classes = useStyles();

  if (!ipfsReady)
    return (
      <React.Fragment>
        <Box display="flex" flexDirection="row">
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            IPFS Node Status
          </Typography>
          <Brightness1Icon
            fontSize="small"
            color="secondary"
            className={classes.statusCircle}
          />
        </Box>
        <div className={classes.shutdownBtnDiv}>
          <Button
            onClick={startHandler}
            variant="contained"
            color="primary"
          >
            Start
          </Button>
        </div>
      </React.Fragment>
    );

  return (
    <React.Fragment>
      <Box display="flex" flexDirection="row">
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          IPFS Node Status
        </Typography>
        <Brightness1Icon
          fontSize="small"
          style={{ color: green[500] }}
          className={classes.statusCircle}
        />
      </Box>
      <Typography
        component="p"
        variant="body1"
        color="inherit"
        noWrap
        className={classes.title}
      >
        <b>Peer ID:</b> {peerId}
      </Typography>
      <Typography
        component="p"
        variant="body1"
        color="inherit"
        noWrap
        className={classes.title}
      >
        <b>Location:</b> {ipfsLocation}
      </Typography>
      <Divider className={classes.divider} />
      <Commands
        paymentStrategies={paymentStrategies}
        paymentStrategyHandler={paymentStrategyHandler}
        cacheStrategies={cacheStrategies}
        cacheStrategyHandler={cacheStrategyHandler}
      />
      <div className={classes.shutdownBtnDiv}>
        <Button onClick={shutdownHandler} variant="contained" color="secondary">
          Shutdown
        </Button>
      </div>
    </React.Fragment>
  );
}
