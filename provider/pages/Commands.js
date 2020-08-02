import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
  },
  formControl: {
    margin: theme.spacing(1),
    width: 220,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}));

export default function Commands({
  paymentStrategies,
  paymentStrategyHandler,
  cacheStrategies,
  cacheStrategyHandler,
}) {
  const classes = useStyles();
  const [paymentStrategy, setPaymentStrategy] = React.useState("DEFAULT");
  const [cacheStrategy, setCacheStrategy] = React.useState("DEFAULT");

  const handlePaymentChange = (event) => {
    setPaymentStrategy(event.target.value);
    paymentStrategyHandler(event.target.value);
  };

  const handleCacheChange = (event) => {
    setCacheStrategy(event.target.value);
    cacheStrategyHandler(event.target.value);
  };

  return (
    <div className={classes.container}>
      <FormControl variant="outlined" className={classes.formControl}>
        <InputLabel id="payment-label">Payment Strategy</InputLabel>
        <Select
          labelId="payment-label"
          id="payment"
          value={paymentStrategy}
          onChange={handlePaymentChange}
          label="Payment Strategy"
        >
          {paymentStrategies.map((strat, i) => (
            <MenuItem key={i} value={strat}>
              {strat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl variant="outlined" className={classes.formControl}>
        <InputLabel id="cache-label">Cache Strategy</InputLabel>
        <Select
          labelId="cache-label"
          id="cache"
          value={cacheStrategy}
          onChange={handleCacheChange}
          label="Cache Strategy"
        >
          {cacheStrategies.map((strat, i) => (
            <MenuItem key={i} value={strat}>
              {strat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
