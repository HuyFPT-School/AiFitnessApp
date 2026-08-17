import { Router } from 'express';
import {
  analyzeWorkout,
  scanFood,
  streamGoogleTTS,
  streamNeuralTTS,
  generateWorkoutRoutine
} from '../controllers/aiController';

const router = Router();

router.post('/analyze-workout', analyzeWorkout);
router.post('/scan-food', scanFood);
router.post('/generate-routine', generateWorkoutRoutine);
router.get('/tts', streamGoogleTTS);
router.get('/tts-neural', streamNeuralTTS);

export default router;
