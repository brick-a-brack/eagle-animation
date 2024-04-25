export const parseRatio = (value) => {
  // String ratio value
  if (`${value}`.includes(':')) {
    const nbs = `${value}`.split(':');
    const v1 = parseFloat(nbs[0]);
    const v2 = parseFloat(nbs[1]);
    if (v1 > 0 && v2 > 0) {
      return {
        userValue: value,
        value: v1 / v2,
      };
    }
  }

  // Number value
  const v = parseFloat(value);
  if (v > 0) {
    return {
      userValue: value,
      value: v,
    };
  }

  // Not usable
  return null;
};
