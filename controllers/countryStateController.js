import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import country from '../models/countryModel.js';
import countryStates from '../models/countryStatesModel.js';

const fetchCountryAndStates = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("fetchCountryAndStates post", post);
    if (post.signatureKey === undefined || post.signatureKey === null || post.signatureKey === '')
      return res.status(200).json(genericResponse(false, "Signature Key is missing", []));
    if (post.signatureKey !== process.env.SIGNATURE_KEY) {
      return res.status(200).json(genericResponse(false, "Invalid Signature Key!", []));
    }
    const fetchCS = await countryStates.find().sort({ stateName: 1 });
    const fetchC = await country.find().sort({ countryName: 1 });
    let successResponse = genericResponse(true, "Country/State fetched successfully.", {
      country: fetchC,
      states: fetchCS
    });
    return res.status(200).json(successResponse);

  } catch (error) {
    console.log("error in fetchState  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
})

const fetchState = asyncHandler(async (req, res) => {

  try {
    const fetchCS = await countryStates.find().sort({ stateName: 1 });
    let successResponse = genericResponse(true, "Country/State fetched successfully.", fetchCS);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchState  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
})

const fetchCountry = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const fetchCS = await country.find().sort({ countryName: 1 });
    let successResponse = genericResponse(true, "Country fetched successfully.", fetchCS);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchCountry  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});



export {
  fetchState,
  fetchCountry,
  fetchCountryAndStates,

}