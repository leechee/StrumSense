import { spawn } from 'child_process';
import path from 'path';

export async function analyzeAudioFeatures(audioFilePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'audio_analyzer.py');

    // Detect environment: use conda for local dev, python for production/Vercel
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';

    let pythonProcess;
    if (isProduction) {
      // On Vercel, use Python directly (will be installed via requirements.txt)
      pythonProcess = spawn('python3', [pythonScript, audioFilePath]);
    } else {
      // Local dev: use conda environment
      const condaPath = 'C:\\Users\\jasom\\anaconda3\\Scripts\\conda.exe';
      pythonProcess = spawn(condaPath, ['run', '-n', 'strumsense', 'python', pythonScript, audioFilePath]);
    }

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
        console.error('Python script error:', stderr);
        console.error('Python stdout:', stdout);
        console.error('Python exit code:', code);
        reject(new Error(`Python script failed with code ${code}: ${stderr || 'No error output'}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          reject(new Error(result.error));
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
