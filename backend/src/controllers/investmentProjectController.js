// const InvestmentProject =
//   require(
//     "../models/InvestmentProject"
//   );

// const createProject =
//   async (req, res) => {
//     try {
//       const project =
//         await InvestmentProject.create(
//           req.body
//         );

//       return res.status(201).json({
//         success: true,
//         project
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message:
//           error.message
//       });
//     }
//   };

// const getProjects =
//   async (req, res) => {
//     try {
//       const projects =
//         await InvestmentProject.find()
//           .populate(
//             "categoryId"
//           )
//           .sort({
//             createdAt: -1
//           });

//       return res.status(200).json({
//         success: true,
//         count:
//           projects.length,
//         projects
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message:
//           error.message
//       });
//     }
//   };

// const getProjectById =
//   async (req, res) => {
//     try {
//       const project =
//         await InvestmentProject.findById(
//           req.params.id
//         ).populate(
//           "categoryId"
//         );

//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Project not found"
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         project
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message:
//           error.message
//       });
//     }
//   };

// const updateProject =
//   async (req, res) => {
//     try {
//       const project =
//         await InvestmentProject.findByIdAndUpdate(
//           req.params.id,
//           req.body,
//           {
//             new: true,
//             runValidators: true
//           }
//         );

//       return res.status(200).json({
//         success: true,
//         project
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message:
//           error.message
//       });
//     }
//   };

// const closeProject =
//   async (req, res) => {
//     try {
//       const project =
//         await InvestmentProject.findByIdAndUpdate(
//           req.params.id,
//           {
//             status:
//               "CLOSED",
//             isVisible:
//               false
//           },
//           {
//             new: true
//           }
//         );

//       return res.status(200).json({
//         success: true,
//         project
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message:
//           error.message
//       });
//     }
//   };

// const reopenProject =
//   async (req, res) => {
//     try {
//       const project =
//         await InvestmentProject.findByIdAndUpdate(
//           req.params.id,
//           {
//             status: "OPEN",
//             isVisible:
//               true
//           },
//           {
//             new: true
//           }
//         );

//       return res.status(200).json({
//         success: true,
//         project
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message:
//           error.message
//       });
//     }
//   };

// module.exports = {
//   createProject,
//   getProjects,
//   getProjectById,
//   updateProject,
//   closeProject,
//   reopenProject
// };const InvestmentProject = require( "../models/InvestmentProject" ); 

const createProject = async (req, res) => { 
  try { 
    // FIXED MATRIX ALIGNMENT: Intercepts incoming frontend fields and maps them to standard schema variables
    const formTitle = req.body.title || req.body.projectName || req.body.name || "";
    const formDesc = req.body.description || req.body.summary || req.body.purpose || "";
    const formTarget = Number(req.body.targetAmount || req.body.requiredCapital || req.body.investmentGoal || 0);
    const formYield = Number(req.body.yieldPercentage || req.body.estimatedReturn || req.body.roi || 0);

    const mappedPayload = {
      // String descriptor property mappings
      projectName: formTitle,
      title: formTitle,
      name: formTitle,

      description: formDesc,
      summary: formDesc,

      // Numeric allocation budget variables
      targetAmount: formTarget,
      requiredCapital: formTarget,
      investmentGoal: formTarget,
      minimumAmount: Number(req.body.minimumAmount || 50000),

      // Yield metric percentage mappings
      yieldPercentage: formYield,
      roi: formYield,
      estimatedReturn: formYield,

      // Relational database categories reference keys (safely handles object drops)
      categoryId: req.body.categoryId || req.body.category || null,
      
      // Default baseline system state parameters
      status: req.body.status || "OPEN",
      isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true
    };

    // Safely write the aligned object straight into your MongoDB engine registers
    const project = await InvestmentProject.create(mappedPayload); 
    return res.status(201).json({ success: true, project }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const getProjects = async (req, res) => { 
  try { 
    const projects = await InvestmentProject.find() 
      .populate( "categoryId" ) 
      .sort({ createdAt: -1 }); 
    return res.status(200).json({ success: true, count: projects.length, projects }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const getProjectById = async (req, res) => { 
  try { 
    const project = await InvestmentProject.findById( req.params.id ).populate( "categoryId" ); 
    if (!project) { 
      return res.status(404).json({ success: false, message: "Project not found" }); 
    } 
    return res.status(200).json({ success: true, project }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const updateProject = async (req, res) => { 
  try { 
    const project = await InvestmentProject.findByIdAndUpdate( 
      req.params.id, 
      req.body, 
      { new: true, runValidators: true } 
    ); 
    return res.status(200).json({ success: true, project }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const closeProject = async (req, res) => { 
  try { 
    const project = await InvestmentProject.findByIdAndUpdate( 
      req.params.id, 
      { status: "CLOSED", isVisible: false }, 
      { new: true } 
    ); 
    return res.status(200).json({ success: true, project }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

const reopenProject = async (req, res) => { 
  try { 
    const project = await InvestmentProject.findByIdAndUpdate( 
      req.params.id, 
      { status: "OPEN", isVisible: true }, 
      { new: true } 
    ); 
    return res.status(200).json({ success: true, project }); 
  } catch (error) { 
    return res.status(500).json({ success: false, message: error.message }); 
  } 
}; 

module.exports = { createProject, getProjects, getProjectById, updateProject, closeProject, reopenProject };

