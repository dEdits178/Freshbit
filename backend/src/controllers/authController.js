const authService = require('../services/authService')
const { success } = require('../utils/response')

const isProduction = process.env.NODE_ENV === 'production'

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
}

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax'
  })
}

class AuthController {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body)
      return success(res, user, 'Registration successful. Please verify your email.', 201)
    } catch (error) {
      return next(error)
    }
  }

  async login(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body)
      setRefreshTokenCookie(res, refreshToken)

      return success(
        res,
        { user, accessToken, refreshToken },
        'Login successful',
        200
      )
    } catch (error) {
      return next(error)
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken
      const accessToken = await authService.refreshAccessToken(refreshToken)
      return success(res, { accessToken }, 'Access token refreshed', 200)
    } catch (error) {
      return next(error)
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken
      await authService.logout(refreshToken)
      clearRefreshTokenCookie(res)
      return success(res, null, 'Logged out successfully', 200)
    } catch (error) {
      return next(error)
    }
  }

  async forgotPassword(req, res, next) {
    try {
      await authService.requestPasswordReset(req.body.email)
      return success(res, null, 'If the account exists, a password reset link has been sent.', 200)
    } catch (error) {
      return next(error)
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body
      await authService.resetPassword(token, newPassword)
      return success(res, null, 'Password reset successful', 200)
    } catch (error) {
      return next(error)
    }
  }

  async verifyEmail(req, res, next) {
    try {
      await authService.verifyEmail(req.body.token)
      return success(res, null, 'Email verified successfully', 200)
    } catch (error) {
      return next(error)
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body
      await authService.changePassword(req.user.id, oldPassword, newPassword)
      clearRefreshTokenCookie(res)
      return success(res, null, 'Password changed successfully. Please login again.', 200)
    } catch (error) {
      return next(error)
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body)
      return success(res, user, 'Profile updated successfully', 200)
    } catch (error) {
      return next(error)
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id)
      return success(res, user, 'User profile fetched successfully', 200)
    } catch (error) {
      return next(error)
    }
  }
}

module.exports = new AuthController()
