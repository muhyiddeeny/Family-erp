const verifyPayment =
  async (
    reference
  ) => {
    if (
      !reference
    ) {
      return false;
    }

    return true;
  };

module.exports =
  verifyPayment;