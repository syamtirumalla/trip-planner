import { z } from 'zod';
import { STOP_TYPES, DURATION_LIMITS, PROMPT_LIMITS, ERROR_CODES } from './constants.js';

// Base Stop schema for AI model output validation
export const StopSchema = z.object({
  id: z.string().optional(), // Client generates this; model IDs are never trusted
  name: z.string().trim().min(1, 'Stop name is required'),
  type: z.enum(STOP_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${STOP_TYPES.join(', ')}` }),
  }),
  durationMin: z
    .number()
    .int('Duration must be an integer')
    .min(DURATION_LIMITS.MIN, `Duration must be at least ${DURATION_LIMITS.MIN} minutes`)
    .max(DURATION_LIMITS.MAX, `Duration cannot exceed ${DURATION_LIMITS.MAX} minutes`),
  description: z.string().trim().min(1, 'Description is required'),
  costEstimate: z.string().trim().optional(),
  tip: z.string().trim().optional(),
});

// Single Day schema
export const DaySchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, 'Day label is required'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format')
    .default('09:00'),
  stops: z.array(StopSchema).min(1, 'A day must contain at least one stop'),
});

// Full Itinerary schema
export const ItinerarySchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Trip title is required'),
  summary: z.string().trim().optional(),
  days: z.array(DaySchema).min(1, 'Itinerary must contain at least one day'),
});

// API Request schemas
export const PlanRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(PROMPT_LIMITS.MIN_LENGTH, `Trip prompt must be at least ${PROMPT_LIMITS.MIN_LENGTH} characters`)
    .max(PROMPT_LIMITS.MAX_LENGTH, `Trip prompt cannot exceed ${PROMPT_LIMITS.MAX_LENGTH} characters`),
});

export const RefineRequestSchema = z.object({
  itinerary: ItinerarySchema,
  instruction: z
    .string()
    .trim()
    .min(PROMPT_LIMITS.MIN_LENGTH, `Refinement instruction must be at least ${PROMPT_LIMITS.MIN_LENGTH} characters`)
    .max(500, 'Refinement instruction cannot exceed 500 characters'),
});

// API Error Schema
export const ErrorCodeEnum = z.enum([
  ERROR_CODES.MALFORMED,
  ERROR_CODES.WRONG_SHAPE,
  ERROR_CODES.EMPTY,
  ERROR_CODES.TIMEOUT,
  ERROR_CODES.UPSTREAM,
  ERROR_CODES.RATE_LIMITED,
]);

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeEnum,
    message: z.string(),
  }),
});

// Successful API Response Schema
export const PlanResponseSchema = z.object({
  itinerary: ItinerarySchema,
  warnings: z.array(z.string()).default([]),
});

