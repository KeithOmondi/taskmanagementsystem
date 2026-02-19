import { Router } from 'express';
import { 
  getGoogleAuthUrl,
  googleCallback,
  getGoogleCalendarEvents
} from '../controllers/googleAuth.controller';

import { protect } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roles';

const router = Router();

// 1️⃣ Generate Google Auth URL (Protected)
router.get(
  '/auth/google/url',
  protect,
  authorizeRoles("superadmin"),
  getGoogleAuthUrl
);

// 2️⃣ Google Callback (NOT Protected)
router.get(
  '/auth/google/callback',
  googleCallback
);

// 3️⃣ Fetch Google Calendar Events (Protected)
router.get(
  '/events',
  protect,
  authorizeRoles("superadmin"),
  getGoogleCalendarEvents
);

export default router;
