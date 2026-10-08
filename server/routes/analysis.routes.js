import express from 'express';
import {
  getProfileAnalysis,
  compareProfiles,
  evaluateInterview,
} from '../controllers/analysis.controller.js';

const router = express.Router();

router.get('/analysis/:username', getProfileAnalysis);
router.get('/compare', compareProfiles);
router.post('/interview/evaluate', evaluateInterview);

export default router;
