
import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import DefaultSetting from '../models/defaultSettingsModel.js'

const fetchDefaultSetting = asyncHandler(async (req, res) => {
  try {
    const { businessUserID } = req.body;
    if (!businessUserID) return res.status(200).json(genericResponse(false, "User Default Setting not fetched!", []));
    const fetchData = await DefaultSetting.find({ businessUserID: mongoose.Types.ObjectId(businessUserID) });
    let successResponse = genericResponse(true, "fetch Data Successfully!", fetchData);
    return res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("error in fetchdefaultSetting ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const updateDefaultSetting = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    let fetch = await DefaultSetting.findOne(query);
    if (fetch) {
      await DefaultSetting.updateOne(query, { $set: post });
      let successResponse = genericResponse(true, "updated successfully.", []);
      res.status(200).json(successResponse);
    } else {
      const insertRow = await new DefaultSetting(post).save();
      if (insertRow._id) {
        let successResponse = genericResponse(true, "fetch Data Successfully!", insertRow);
        return res.status(201).json(successResponse);
      } else {
        let errorRespnse = genericResponse(false, "Something went wrong, Try again!", []);
        return res.status(200).json(errorRespnse);
      }
    }
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});


// Mobile API ------------->

const fetchDefaultSettingsold = asyncHandler(async (req, res) => {
  try {
    const { businessUserID, signatureKey } = req.body;
    console.log("fetchDefaultSettings(post)", businessUserID, signatureKey)
    if (signatureKey !== process.env.SIGNATURE_KEY) {
      res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
      return
    }
    if (!businessUserID) {
      res.status(200).json(genericResponse(false, "User Default Setting not fetched!", []));
      return
    }

    const fetchData = await DefaultSetting.find({ businessUserID: mongoose.Types.ObjectId(businessUserID) });
    console.log("fetchData", fetchData)
    let successResponse = genericResponse(true, "fetch Data Successfully!", fetchData);
    res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("error in fetchdefaultSetting ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const addAndUpdateDefaultSettings = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("addAndUpdateDefaultSettings(post)", post)
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    let fetch = await DefaultSetting.findOne(query);
    console.log("ffetch", fetch)
    if (fetch) {
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "U";
      await DefaultSetting.updateOne(query, { $set: post });
      let successResponse = genericResponse(true, "updated successfully.", []);
      res.status(200).json(successResponse);
      return
    } else {
      const insertRow = await new DefaultSetting(post).save();
      if (insertRow._id) {
        let successResponse = genericResponse(true, "fetch Data Successfully!", insertRow);
        res.status(201).json(successResponse);
      } else {
        let errorRespnse = genericResponse(false, "Something went wrong, Try again!", []);
        return res.status(200).json(errorRespnse);
      }
    }
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

// Bharat APIS

const fetchDefaultSettings = asyncHandler(async (req, res) => {
  try {
    const { businessUserID, signatureKey } = req.body;
    console.log("fetchDefaultSettings(post)", businessUserID, signatureKey);
    if (signatureKey !== process.env.SIGNATURE_KEY) {
      res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
      return
    }
    if (!businessUserID) {
      res.status(200).json(genericResponse(false, "User Default Setting not fetched!", []));
      return
    }
    const fetchData = await DefaultSetting.find({ businessUserID: mongoose.Types.ObjectId(businessUserID) });
    let successResponse = genericResponse(true, "fetch Data Successfully!", fetchData);
    res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("error in fetchdefaultSettings ", error);
    let errorResponse = genericResponse(false, error.message, []);
    res.status(400).json(errorResponse)
  }
});

const addorUpdateDefaultSettings = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    if (post.signatureFilePath) {
      post.signatureUploadedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    }
    if (req.files) {
      let returnedFileName = await uploadImageFile(req, "defaultLogoFileName");
      post.defaultLogoFileName = returnedFileName;
    }

    let fetch = await DefaultSetting.findOne(query);
    if (fetch) {
      await DefaultSetting.updateOne(query, { $set: post });
      let successResponse = genericResponse(true, "updated successfully.", []);
      res.status(200).json(successResponse);
    } else {
      const insertRow = await new DefaultSetting(post).save();
      if (insertRow._id) {
        let successResponse = genericResponse(true, "fetch Data Successfully!", insertRow);
        return res.status(201).json(successResponse);
      } else {
        let errorRespnse = genericResponse(false, "Something went wrong, Try again!", []);
        return res.status(200).json(errorRespnse);
      }
    }
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const uploadBusinessUserSignature = asyncHandler(async (req, res) => {
  const post = req.body;
  try {

    if (!post.businessUserID) {
      return res.status(200).json(genericResponse(false, "businessUser ID is missing.", []));
    }
    const imageData = req.body.imageData;
    const base64Data = imageData.replace(/^data:image\/jpg;base64,/, '');

    const filename = `Signature_${Date.now()}.jpg`;
    const subFolder = 'Signature/' + post.businessUserID.toString();
    const uploadDir = path.join(process.env.LOCATION_PATH, subFolder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFile(path.join(uploadDir, filename), base64Data, 'base64', async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json(genericResponse(false, err, []));
      }
      let returnedFileName = subFolder + '/' + filename;
      console.log('Signature saved successfully in fs', returnedFileName);

      return res.status(200).json(genericResponse(true, "Signature saved successfully. Please Click to Save for Configure the Setting", { signatureFilePath: returnedFileName }));
    });

  } catch (error) {
    console.log("Error in UpdateBusinessUserSignature:", error.message);
    return res.status(400).json(genericResponse(false, error.message, []));
  }
});

const viewUploadedBusinessUserSignature = asyncHandler(async (req, res) => {
  try {
    let fileName = req.query.fileName;
    let options = {
      root: process.env.LOCATION_PATH,
      dotfiles: 'deny',
      headers: { 'x-timestamp': Date.now(), 'x-sent': true },
      status: genericResponse(true, "File viewed successfully.", [])
    }
    res.sendFile(fileName, options, function (error) {
      try {
        if (error) {
          let errorRespnse = genericResponse(false, error.message, []);
          return res.status(400).json(errorRespnse);
        }
      } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        return res.status(400).json(errorRespnse);
      }
    })
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    return res.status(505).json(errorRespnse);
  }
});

const deleteBusinessUserSignature = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    if (!post.businessUserID) {
      return res.status(200).json(genericResponse(false, "User ID is missing.", []));
    }
    let updateQuotation = await DefaultSetting.updateOne({ businessUserID: mongoose.Types.ObjectId(post.businessUserID) },

      {
        $unset: {
          signatureFilePath: "",
          signatureUploadedDate: "",

        }
      });

    if (updateQuotation.nModified === 1) {
      return res.status(200).json(genericResponse(true, "Signature deleted successfully.",));
    }
    else {
      return res.status(200).json(genericResponse(false, "Signature not deleted, Please Try Again.", []));
    };

  } catch (error) {
    console.log("Error in UpdateBusinessUserSignature:", error.message);
    return res.status(400).json(genericResponse(false, error.message, []));
  }
});

const updateBusinessUserSignature = asyncHandler(async (req, res) => {
  const post = req.body;
  try {

    if (!post.businessUserID) {
      return res.status(200).json(genericResponse(false, "User ID is missing.", []));
    }
    const imageData = req.body.imageData;
    const base64Data = imageData.replace(/^data:image\/jpg;base64,/, '');

    const filename = `Signature_${Date.now()}.jpg`;
    const subFolder = 'Signature/' + post.businessUserID.toString();
    const uploadDir = path.join(process.env.LOCATION_PATH, subFolder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFile(path.join(uploadDir, filename), base64Data, 'base64', async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json(genericResponse(false, err, []));
      }
      let returnedFileName = subFolder + '/' + filename;
      console.log('Signature saved successfully in fs', returnedFileName);

      return res.status(200).json(genericResponse(true, "Signature saved successfully. Please Click to Save for Configure the Setting", { signatureFilePath: returnedFileName }));
    });

  } catch (error) {
    console.log("Error in UpdateBusinessUserSignature:", error.message);
    return res.status(400).json(genericResponse(false, error.message, []));
  }
});

const updateDefaultSettings = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    if (post.signatureFilePath) {
      post.signatureUploadedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    }
    if (req.files) {
      let returnedFileName = await uploadImageFile(req, "defaultLogoFileName");
      post.defaultLogoFileName = returnedFileName;
    }

    let fetch = await DefaultSetting.findOne(query);
    if (fetch) {
      await DefaultSetting.updateOne(query, { $set: post });
      let successResponse = genericResponse(true, "updated successfully.", []);
      res.status(200).json(successResponse);
    } else {
      const insertRow = await new DefaultSetting(post).save();
      if (insertRow._id) {
        let successResponse = genericResponse(true, "fetch Data Successfully!", insertRow);
        return res.status(201).json(successResponse);
      } else {
        let errorRespnse = genericResponse(false, "Something went wrong, Try again!", []);
        return res.status(200).json(errorRespnse);
      }
    }
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});



export {
  fetchDefaultSetting,
  updateDefaultSetting,
  addAndUpdateDefaultSettings,


  //Bharat Mobile API ------------->

  fetchDefaultSettings,
  addorUpdateDefaultSettings,
  uploadBusinessUserSignature,
  viewUploadedBusinessUserSignature,
  deleteBusinessUserSignature,
  updateDefaultSettings,
  updateBusinessUserSignature

}
