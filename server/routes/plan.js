import express from 'express';
import { PlanRequestSchema } from '../../shared/schema.js';
import { ERROR_CODES } from '../../shared/constants.js';
import { callModel } from '../services/modelClient.js';
import { buildPlanPrompt, buildRepairPrompt } from '../services/promptBuilder.js';
import { extractJson } from '../services/jsonExtractor.js';
import { validateAndSalvage } from '../services/validator.js';
import { getSimulatedModelOutput } from '../services/simulator.js';

const router = express.Router();

function getHttpStatusForError(code) {
  switch (code) {
    case ERROR_CODES.RATE_LIMITED:
      return 429;
    case ERROR_CODES.TIMEOUT:
      return 504;
    case ERROR_CODES.UPSTREAM:
      return 502;
    case ERROR_CODES.EMPTY:
    case ERROR_CODES.MALFORMED:
    case ERROR_CODES.WRONG_SHAPE:
    default:
      return 400;
  }
}

router.post('/', async (req, res) => {
  // 1. Validate request body with Zod 4
  const parsedBody = PlanRequestSchema.safeParse(req.body);
  if (!parsedBody.success) {
    const errorIssue = parsedBody.error.issues?.[0];
    return res.status(400).json({
      error: {
        code: ERROR_CODES.EMPTY,
        message: errorIssue?.message || 'Invalid or missing trip prompt.',
      },
    });
  }

  const { prompt } = parsedBody.data;

  try {
    // 2. Check for dev-only failure simulation (bypasses model when header present and NODE_ENV !== 'production')
    let rawOutput = await getSimulatedModelOutput(req);
    const wasSimulated = Boolean(rawOutput);

    if (!wasSimulated) {
      const planPrompt = buildPlanPrompt(prompt);
      rawOutput = await callModel(planPrompt);
    }

    // 3. Extract JSON and run stop-by-stop salvage pipeline
    let salvageResult;
    try {
      const extracted = extractJson(rawOutput);
      salvageResult = validateAndSalvage(extracted);
    } catch (parseOrValError) {
      // If output was simulated, do not attempt repair (return simulated failure directly)
      if (wasSimulated) {
        throw parseOrValError;
      }

      // 4. One-time repair retry: feed back bad output + validation error to the model
      console.warn(`[Plan Route] Primary attempt failed (${parseOrValError.code}). Initiating repair retry...`);
      try {
        const repairPrompt = buildRepairPrompt(rawOutput, parseOrValError.message);
        const repairedRaw = await callModel(repairPrompt);
        const repairedExtracted = extractJson(repairedRaw);
        salvageResult = validateAndSalvage(repairedExtracted);
        salvageResult.warnings.unshift('Initial AI response had formatting issues and was automatically repaired.');
      } catch (repairError) {
        // If repair still fails, return the typed failure
        const finalError = repairError.code ? repairError : parseOrValError;
        throw finalError;
      }
    }

    return res.json(salvageResult);
  } catch (err) {
    const errorCode = err.code || ERROR_CODES.UPSTREAM;
    const statusCode = err.status || getHttpStatusForError(errorCode);

    return res.status(statusCode).json({
      error: {
        code: errorCode,
        message: err.message || 'An unexpected error occurred during trip planning.',
      },
    });
  }
});

export default router;

