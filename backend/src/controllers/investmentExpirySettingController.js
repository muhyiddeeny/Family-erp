const InvestmentExpirySetting =
  require(
    "../models/InvestmentExpirySetting"
  );

const saveExpirySetting =
  async (req, res) => {
    try {
      await InvestmentExpirySetting.deleteMany();

      const setting =
        await InvestmentExpirySetting.create(
          {
            expiryDays:
              req.body.expiryDays
          }
        );

      return res.status(201).json({
        success: true,
        setting
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  };

const getExpirySetting =
  async (req, res) => {
    try {
      const setting =
        await InvestmentExpirySetting.findOne();

      return res.status(200).json({
        success: true,
        setting
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  };

module.exports = {
  saveExpirySetting,
  getExpirySetting
};