import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import jwt from "jsonwebtoken";
import { COOKIE_OPTIONS } from "../../constants.js";
import sendEmail from "../../utils/SendMail.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || " Something went wrong while generating tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    let {
      username,
      firstName,
      lastName,
      phoneNumber,
      email,
      address,
      country,
      city,
      state,
      pincode,
      password,
    } = req.body;

    if (
      [
        username,
        firstName,
        lastName,
        phoneNumber,
        email,
        address,
        country,
        city,
        state,
        pincode,
        password,
      ].some((field) => field?.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ApiError(409, "Username or email is already exist");
    }

    const user = await User.create({
      username: username.toLowerCase(),
      firstName,
      lastName,
      phoneNumber,
      email,
      address,
      city,
      country,
      state,
      pincode,
      password,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdUser,
          "User registered Successfully!, Please login to continue."
        )
      );
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!(email || username)) {
      throw new ApiError(400, "Username or email is required");
    }

    if (!password) {
      throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    res
      .status(200)
      .cookie("accessToken", accessToken, COOKIE_OPTIONS)
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedUser,
            accessToken,
            refreshToken,
          },
          "User Logged in successfully!"
        )
      );
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user?._id;

    if (!user) {
      throw new ApiError(401, "Not authorized to perform this action!");
    }

    await User.findByIdAndUpdate(
      user,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    res
      .status(200)
      .clearCookie("accessToken", COOKIE_OPTIONS)
      .clearCookie("refreshToken", COOKIE_OPTIONS)
      .json(new ApiResponse(200, {}, "User logged out successfully!"));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      city,
      state,
      country,
      pincode,
    } = req.body;

    if (
      !(
        firstName ||
        lastName ||
        email ||
        phoneNumber ||
        address ||
        city ||
        state ||
        country ||
        pincode
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "No user found");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        lastName,
        phoneNumber,
        address,
        city,
        state,
        country,
        pincode,
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      throw new ApiError(500, "something went wrong while updating");
    }

    res
      .status(200)
      .json(
        new ApiResponse(201, updatedUser, "User details updated successfully!")
      );
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
});

const getUserById = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId) || !userId) {
      throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user || user === null) {
      throw new ApiError(404, "user not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully."));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(
        new ApiResponse(200, req.user, "Current User fetched successfully!")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || " Something went wrong while fetching current user"
    );
  }
});

const checkAuthentication = asyncHandler(async (req, res) => {
  const isAuthenticated = req?.isAuthenticated;

  res.json({ authenticated: isAuthenticated });
});

const changeUserPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new ApiError(
        400,
        "Please provide both the old password and new password to proceed."
      );
    }

    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "You are not logged in!");
    }

    const user = await User.findById(userId);

    const isCorrect = user.isPasswordCorrect(oldPassword);

    if (!isCorrect) {
      throw new ApiError(400, "Invalid Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Password has been updated Successfully.")
      );
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
});

const sendAuthMail = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Please provide an email!");
    }

    const user = await User.find({
      email: email,
    });

    if (user.length === 0) {
      throw new ApiError(401, "Invalid email address!");
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    user[0].otp = otp;

    await user[0].save();

    const orderMessage = `
    <h2>Forgot Password</h2>
    <br/>
       <p>Your Otp for changing password: <span style="font-weight:bold;font-size:20px">${otp}</span></p>
    
    <br/>
    <p>use the otp to change your password</p>
    `;

    const emailData = {
      to: user[0].email,
      subject: `OTP for changing password`,
      html: orderMessage,
    };

    const mailSent = await sendEmail(emailData);

    if (!mailSent.success) throw new Error("Failed to send email");

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Email sent successfully!"));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
});

const checkOtp = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      throw new ApiError(400, "Please provide an email!");
    }

    if (!otp) {
      throw new ApiError(400, "Please provide an otp!");
    }

    const user = await User.find({
      email: email,
      otp: otp,
    });

    if (!user) {
      throw new ApiError(401, "Invalid email address or invalid otp");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Otp Validation successful"));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { newPassword, email } = req.body;

    if (!newPassword || !email) {
      throw new ApiError(400, "Please provide new password to proceed.");
    }

    const user = await User.find({
      email: email,
    });

    if (user.length === 0) {
      throw new ApiError(401, "Invalid email address!");
    }

    user[0].password = newPassword;

    await user[0].save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Password has been changed Successfully.")
      );
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  getUserById,
  getCurrentUser,
  checkAuthentication,
  changeUserPassword,
  sendAuthMail,
  checkOtp,
  forgotPassword,
};
