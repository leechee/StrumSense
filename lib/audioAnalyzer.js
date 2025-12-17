import { spawn } from 'child_process';
import path from 'path';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

export async function analyzeAudioFeatures(audioFilePath) {
  // Check if we should use Python service (production) or local Python (development)
  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

  // Use async service for analysis
  return await analyzeViaServiceAsync(audioFilePath, pythonServiceUrl);
}

async function analyzeViaServiceAsync(audioFilePath, serviceUrl) {
  try {
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFilePath));

    // Start async job
    const response = await fetch(`${serviceUrl}/analyze-async`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Python service error: ${response.status} - ${error}`);
    }

    const { job_id } = await response.json();

    // Return job ID for polling
    return {
      success: true,
      jobId: job_id,
      status: 'processing'
    };
  } catch (error) {
    console.error('Error calling Python service:', error);
    throw new Error(`Failed to analyze audio via service: ${error.message}`);
  }
}

export async function checkJobStatus(jobId) {
  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

  try {
    const response = await fetch(`${pythonServiceUrl}/job-status/${jobId}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get job status: ${response.status} - ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking job status:', error);
    throw new Error(`Failed to check job status: ${error.message}`);
  }
}


export function extractMusicMetadata(audioFeatures) {
  const { tempo, key, mode, vibe, brightness, energy, isFingerstyle } = audioFeatures;

  let difficulty = 'beginner';
  if (tempo > 130 || isFingerstyle) {
    difficulty = 'intermediate';
  }
  if (tempo > 150 || energy > 0.2) {
    difficulty = 'advanced';
  }

  let detectedGenre = 'folk';
  if (vibe.includes('energetic') && vibe.includes('bright')) {
    detectedGenre = 'pop-rock';
  } else if (vibe.includes('dark') || mode === 'minor') {
    detectedGenre = 'blues';
  } else if (vibe.includes('fingerstyle')) {
    detectedGenre = 'folk';
  } else if (vibe.includes('upbeat')) {
    detectedGenre = 'indie-folk';
  }

  let detectedMood = 'chill';
  if (vibe.includes('energetic')) {
    detectedMood = 'energetic';
  } else if (vibe.includes('melancholic') || mode === 'minor') {
    detectedMood = 'sad';
  } else if (vibe.includes('happy') && vibe.includes('bright')) {
    detectedMood = 'happy';
  }

  return {
    ...audioFeatures,
    estimatedDifficulty: difficulty,
    detectedGenre,
    detectedMood,
  };
}
