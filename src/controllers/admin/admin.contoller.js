import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Admin } from "../../models/admin.model.js";
import { COOKIE_OPTIONS } from "../../constants.js";

const addAdmin = asyncHandler(async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const admin = await Admin.create({
      username: username,
      email: email,
      password: password,
    });

    if (!admin) throw new ApiError(500, "Failed to add admin");

    return res
      .status(201)
      .json(new ApiResponse(201, admin, "Admin created successfully!"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while adding the new admin"
    );
  }
});

const loginAdmin = asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      throw new ApiError(400, "Username or Password not provided.");

    const admin = await Admin.findOne({
      username,
    });

    if (!admin) throw new ApiError(401, "Invalid credentials.");

    const isMatch = await admin.isPasswordCorrect(password);

    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    const accessToken = await admin.generateAccessToken();

    const loggedAdmin = await Admin.findById(admin._id).select("-password");

    return res
      .status(200)
      .cookie("accessToken", accessToken, COOKIE_OPTIONS)
      .json(
        new ApiResponse(
          200,
          {
            admin: loggedAdmin,
            accessToken,
          },
          "Admin Logged in successfully!"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while login the admin"
    );
  }
});

const logoutAdmin = asyncHandler(async (req, res) => {
  try {
    const admin = req.admin?._id;

    if (!admin) {
      throw new ApiError(401, "Not authorized to perform this action!");
    }

    res
      .status(200)
      .clearCookie("accessToken", COOKIE_OPTIONS)
      .json(new ApiResponse(200, {}, "Admin logged out successfully!"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || " Something went wrong while loging out"
    );
  }
});

const checkAuthentication = asyncHandler(async (req, res) => {
  const isAuthenticated = req?.isAuthenticated;

  res.json({ authenticated: isAuthenticated });
});

const updateAdmin = asyncHandler(async (req, res) => {
  try {
    const { username } = req.body;
    const { adminId } = req.params;

    console.log(adminId, username);

    if (!username || !adminId)
      throw new ApiError(400, "Username or email not provided.");

    const admin = await Admin.findById(adminId);

    if (!admin) throw new ApiError(401, "Invalid details.");

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        username,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!updatedAdmin) {
      throw new ApiError(409, "Failed to update the details");
    }

    res
      .status(201)
      .json(new ApiResponse(201, updatedAdmin, "Admin Updated Successfully"));

  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while updating the admin"
    );
  }
});

const getAdminDetails = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(
        new ApiResponse(200, req.admin, "Current Admin fetched successfully!")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while fetching the admin"
    );
  }
});

export {
  addAdmin,
  loginAdmin,
  logoutAdmin,
  checkAuthentication,
  updateAdmin,
  getAdminDetails,
};
