import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Badge from "@material-ui/core/Badge";
import TokensIcon from "@material-ui/icons/ConfirmationNumber";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogActions from "@material-ui/core/DialogActions";
import ListSubheader from "@material-ui/core/ListSubheader";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
}));

export default function Tokens({ tokens, onSubmitTokens }) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const submitTokens = () => {
    onSubmitTokens();
    handleClose();
  };

  const TokenList = ({ cid, tokens }) => (
    <React.Fragment>
      <ListSubheader>{cid}</ListSubheader>
      {tokens.map((token, i) => (
        <Typography key={i} gutterBottom>
          {token}
        </Typography>
      ))}
    </React.Fragment>
  );

  const TokenDialog = ({ tokensObj }) => (
    <MuiDialogContent dividers className={classes.root}>
      {Object.keys(tokensObj).map((cid, i) => (
        <TokenList cid={cid} tokens={tokensObj[cid]} />
      ))}
    </MuiDialogContent>
  );

  const numTokens = Object.values(tokens).reduce((acc, t) => acc + t.length, 0);

  return (
    <React.Fragment>
      <IconButton color="inherit" onClick={handleClickOpen}>
        <Badge badgeContent={numTokens} color="secondary">
          <TokensIcon />
        </Badge>
      </IconButton>
      <Dialog
        onClose={handleClose}
        aria-labelledby="tokens-dialog-title"
        open={open}
      >
        <MuiDialogTitle disableTypography className={classes.root}>
          <Typography variant="h6">Tokens</Typography>
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
        </MuiDialogTitle>
        <TokenDialog tokensObj={tokens} />
        <MuiDialogActions>
          <Button autoFocus onClick={submitTokens} color="primary">
            Submit tokens
          </Button>
        </MuiDialogActions>
      </Dialog>
    </React.Fragment>
  );
}
