import { spawn } from 'child_process';
import path from 'path';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

export async function analyzeAudioFeatures(audioFilePath) {
  // Check if we should use Python service (production) or local Python (development)
  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;

  if (pythonServiceUrl) {
    // Use Python service (Railway)
    return await analyzeViaService(audioFilePath, pythonServiceUrl);
  } else {
    // Use local Python script (development)
    return await analyzeViaLocalPython(audioFilePath);
  }
}

async function analyzeViaService(audioFilePath, serviceUrl) {
  try {
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFilePath));

    const response = await fetch(`${serviceUrl}/analyze`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Python service error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling Python service:', error);
    throw new Error(`Failed to analyze audio via service: ${error.message}`);
  }
}

async function analyzeViaLocalPython(audioFilePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'acoustid_fingerprint.py');

    // Local dev: use conda environment python directly with proper PATH
    const pythonPath = 'C:\\Users\\jasom\\anaconda3\\envs\\strumsense\\python.exe';
    const condaEnvPath = 'C:\\Users\\jasom\\anaconda3\\envs\\strumsense';
    const condaBinPath = 'C:\\Users\\jasom\\anaconda3\\envs\\strumsense\\Library\\bin';
    const condaScriptsPath = 'C:\\Users\\jasom\\anaconda3\\envs\\strumsense\\Scripts';

    // Add conda environment paths to PATH to find ffmpeg and other binaries
    const env = {
      ...process.env,
      PATH: `${condaBinPath};${condaScriptsPath};${condaEnvPath};${process.env.PATH}`
    };

    const pythonProcess = spawn(pythonPath, [pythonScript, audioFilePath], { env });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('=== Python script error ===');
        console.error('Exit code:', code);
        console.error('Audio file path:', audioFilePath);
        console.error('Python script:', pythonScript);
        console.error('STDERR:', stderr);
        console.error('STDOUT:', stdout);
        console.error('=========================');
        reject(new Error(`Analysis failed: ${stderr || stdout || 'Unknown error'}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (!result.success) {
          reject(new Error(result.error || 'Analysis failed'));
        } else {
          resolve(result);
        }
      } catch (error) {
        console.error('Failed to parse Python output:', stdout);
        reject(new Error(`Failed to parse Python output: ${error.message}. Output was: ${stdout}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
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
