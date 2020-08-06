import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import UploadIcon from "@material-ui/icons/CloudUpload";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import TextField from "@material-ui/core/TextField";
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

export default function Upload({ onSubmitUpload }) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [bucketId, setBucketId] = React.useState('');

  const handleChange = (event) => {
    setBucketId(event.target.value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setBucketId('');
  };

  const submit = () => {
    onSubmitUpload(bucketId);
    handleClose();
  };

  return (
    <React.Fragment>
      <IconButton color="inherit" onClick={handleClickOpen}>
        <UploadIcon />
      </IconButton>
      <Dialog
        onClose={handleClose}
        aria-labelledby="upload-dialog-title"
        open={open}
      >
        <DialogTitle disableTypography className={classes.root}>
          <Typography variant="h6">Upload/Cache Textile Bucket Contents</Typography>
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className={classes.root}>
          <DialogContentText>
            Input the Textile bucket ID with the contents you want to host!
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="bucket-id"
            label="Bucket ID"
            type="text"
            fullWidth
            onChange={handleChange}
            value={bucketId}
          />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={submit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
