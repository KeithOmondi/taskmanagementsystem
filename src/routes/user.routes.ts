import { Router } from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  toggleUserStatus,
} from "../controllers/user.controller";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";
// Optional: role-based middleware
// import { authorize } from "../middleware/authorize.middleware"; 
// import { UserRole } from "../models/user.model";

const router = Router();

/* =====================================
   PUBLIC ROUTES
===================================== */
// Example: Public route to fetch some user info (optional)
// router.get("/public", getPublicUsers);

/* =====================================
   PROTECTED ROUTES
===================================== */
router.use(protect); // all routes below require authentication

// Get all users (optionally filter by role)
router.get("/", authorizeRoles("admin", "superadmin"), getUsers);

// Get single user by ID
router.get("/:id", authorizeRoles("admin", "superadmin"), getUser);

// Create a new user (admin/superadmin only if using roles)
// router.post("/", authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), createUser);
router.post("/", authorizeRoles("admin", "superadmin"), createUser);

// Update user
router.put("/:id", authorizeRoles("admin", "superadmin"), updateUser);

// Toggle user active status
router.patch("/:id/toggle-status", authorizeRoles("admin", "superadmin"), toggleUserStatus);

export default router;
