const mongoose = require("mongoose");
const BusinessCategory = require("../models/BusinessCategory");
const InvestmentProject = require("../models/InvestmentProject");

class RefError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Every operations record must belong to a real Category AND a real Project,
// and the project must belong to that category.
const resolveCategoryAndProject = async ({ categoryId, projectId }) => {
  if (!projectId || !mongoose.isValidObjectId(String(projectId))) {
    throw new RefError("Please select a project.");
  }

  const project = await InvestmentProject.findById(projectId).lean();
  if (!project) throw new RefError("The selected project does not exist.", 404);

  const finalCategoryId = categoryId || project.categoryId;
  if (!finalCategoryId || !mongoose.isValidObjectId(String(finalCategoryId))) {
    throw new RefError("Please select a category.");
  }

  const category = await BusinessCategory.findById(finalCategoryId).lean();
  if (!category) throw new RefError("The selected category does not exist.", 404);

  if (project.categoryId && String(project.categoryId) !== String(category._id)) {
    throw new RefError("The selected project does not belong to the selected category.");
  }

  return { categoryId: category._id, projectId: project._id };
};

module.exports = { RefError, resolveCategoryAndProject };
