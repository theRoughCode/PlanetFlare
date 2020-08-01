import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Brightness1Icon from "@material-ui/icons/Brightness1";

const useStyles = makeStyles((theme) => ({
  statusCircle: {
    marginLeft: 10,
    marginTop: 5,
  },
}));

export default function Status({ ipfsReady, peerId, ipfsLocation }) {
  const classes = useStyles();
  const ReadyIcon = ipfsReady ? (
    <Brightness1Icon
      fontSize="small"
      style={{ color: green[500] }}
      className={classes.statusCircle}
    />
  ) : (
    <Brightness1Icon
      fontSize="small"
      color="secondary"
      className={classes.statusCircle}
    />
  );
  return (
    <React.Fragment>
      <Box display="flex" flexDirection="row">
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          IPFS Node Status
        </Typography>
        {ReadyIcon}
      </Box>
      {ipfsReady && (
        <div>
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
        </div>
      )}
    </React.Fragment>
  );
}
