import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { success, error } from '../utils/response.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return error(res, 'Email already in use', 400);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
    
    const token = generateToken(user.id);
    return success(res, { user, token }, 201);
  } catch (err) {
    if (err.name === 'ZodError') {
      return error(res, err.errors[0].message, 400);
    }
    console.error('Register error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }
    
    const isMatch = await bcrypt.compare(validatedData.password, user.password);
    
    if (!isMatch) {
      return error(res, 'Invalid credentials', 401);
    }
    
    const token = generateToken(user.id);
    
    // Exclude password from response
    const { password, ...userWithoutPassword } = user;
    
    return success(res, { user: userWithoutPassword, token });
  } catch (err) {
    if (err.name === 'ZodError') {
      return error(res, err.errors[0].message, 400);
    }
    console.error('Login error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return error(res, 'User not found', 404);
    }
    
    return success(res, { user });
  } catch (err) {
    console.error('Get me error:', err);
    return error(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/auth/invite/:token
 * Validate an invitation token and return pre-fill data (public endpoint)
 */
export const getInviteDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        project: { select: { name: true } },
        invitedBy: { select: { name: true } }
      }
    });

    if (!invitation) {
      return error(res, 'Invitation not found or invalid', 404);
    }

    if (invitation.status === 'ACCEPTED') {
      return error(res, 'This invitation has already been accepted', 400);
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      return error(res, 'This invitation has expired', 400);
    }

    return success(res, {
      email: invitation.email,
      projectName: invitation.project.name,
      invitedBy: invitation.invitedBy.name
    });
  } catch (err) {
    console.error('Get invite details error:', err);
    return error(res, 'Internal server error', 500);
  }
};

/**
 * POST /api/auth/register-invite
 * Register a new user via an invitation token (public endpoint)
 */
export const registerViaInvite = async (req, res) => {
  try {
    const { token, name, password, confirmPassword } = req.body;

    if (!token || !name || !password || !confirmPassword) {
      return error(res, 'All fields are required', 400);
    }

    if (password !== confirmPassword) {
      return error(res, 'Passwords do not match', 400);
    }

    if (password.length < 8) {
      return error(res, 'Password must be at least 8 characters', 400);
    }

    // Find and validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      return error(res, 'Invalid invitation token', 404);
    }

    if (invitation.status !== 'PENDING') {
      return error(res, 'This invitation has already been used or expired', 400);
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      return error(res, 'This invitation has expired', 400);
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {
      return error(res, 'An account with this email already exists. Please log in instead.', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Use transaction: create user + add to project + accept invitation
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: invitation.email,
          password: hashedPassword
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      });

      await tx.projectMember.create({
        data: {
          userId: user.id,
          projectId: invitation.projectId,
          role: 'MEMBER'
        }
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });

      return user;
    });

    const jwtToken = generateToken(result.id);

    return success(res, { 
      user: result, 
      token: jwtToken,
      projectId: invitation.projectId
    }, 201);
  } catch (err) {
    console.error('Register via invite error:', err);
    return error(res, 'Internal server error', 500);
  }
};
