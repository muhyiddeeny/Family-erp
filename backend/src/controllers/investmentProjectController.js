const InvestmentProject =
  require(
    "../models/InvestmentProject"
  );

const createProject =
  async (req, res) => {
    try {
      const project =
        await InvestmentProject.create(
          req.body
        );

      return res.status(201).json({
        success: true,
        project
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  };

const getProjects =
  async (req, res) => {
    try {
      const projects =
        await InvestmentProject.find()
          .populate(
            "categoryId"
          )
          .sort({
            createdAt: -1
          });

      return res.status(200).json({
        success: true,
        count:
          projects.length,
        projects
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  };

const getProjectById =
  async (req, res) => {
    try {
      const project =
        await InvestmentProject.findById(
          req.params.id
        ).populate(
          "categoryId"
        );

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found"
        });
      }

      return res.status(200).json({
        success: true,
        project
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  };

const updateProject =
  async (req, res) => {
    try {
      const project =
        await InvestmentProject.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      return res.status(200).json({
        success: true,
        project
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  };

const closeProject =
  async (req, res) => {
    try {
      const project =
        await InvestmentProject.findByIdAndUpdate(
          req.params.id,
          {
            status:
              "CLOSED",
            isVisible:
              false
          },
          {
            new: true
          }
        );

      return res.status(200).json({
        success: true,
        project
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  };

const reopenProject =
  async (req, res) => {
    try {
      const project =
        await InvestmentProject.findByIdAndUpdate(
          req.params.id,
          {
            status: "OPEN",
            isVisible:
              true
          },
          {
            new: true
          }
        );

      return res.status(200).json({
        success: true,
        project
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
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  closeProject,
  reopenProject
};