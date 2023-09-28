import { BigNumber } from "bignumber.js";
import { NUMBER_OF_DIGITS } from "./constants";

export function adjustNumberOfDigits(originalNumber: string, numberOfDigits = NUMBER_OF_DIGITS): string {
  const asBigNumber = new BigNumber(originalNumber);

  if (asBigNumber.isInteger()) {
    return asBigNumber.toString(10);
  } else {
    // The call to .replace on this line, removes the trailing zeros
    return asBigNumber.toFormat(numberOfDigits).replace(/(\.[0-9]*[1-9])0+$/, "$1");
  }
}
