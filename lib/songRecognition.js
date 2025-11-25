import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function recognizeSongFromFeatures(audioFeatures) {
  try {
    const { tempo, keySignature, likelyChords, vibe, isFingerstyle, energy } = audioFeatures;

    const prompt = `You are a music recognition expert specializing in acoustic guitar covers. Based on these audio features, identify the most likely song(s) being played:

Tempo: ${tempo} BPM
Key: ${keySignature}
Prominent chords detected: ${likelyChords.join(', ')}
Musical characteristics: ${vibe.join(', ')}
Playing style: ${isFingerstyle ? 'Fingerstyle' : 'Strumming'}
Energy level: ${energy > 0.15 ? 'High' : energy > 0.08 ? 'Medium' : 'Low'}

Please provide:
1. Your top 3 most likely song matches (if confident)
2. A confidence score (0-100) for each
3. Brief reasoning for each match
4. A general description of the playing style and vibe

Format your response as JSON:
{
  "recognizedSongs": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "confidence": 85,
      "reasoning": "Why this matches"
    }
  ],
  "styleDescription": "Description of the playing style and overall vibe",
  "genre": "Detected genre",
  "mood": "Detected mood"
}

If you're not confident about specific songs, still provide the style description, genre, and mood.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a music expert specializing in acoustic guitar music recognition. You provide accurate, helpful analysis of guitar performances.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    } else {
      return {
        recognizedSongs: [],
        styleDescription: content,
        genre: audioFeatures.detectedGenre || 'unknown',
        mood: audioFeatures.detectedMood || 'unknown'
      };
    }

  } catch (error) {
    console.error('Error recognizing song:', error);
    return {
      recognizedSongs: [],
      styleDescription: 'Unable to analyze the recording at this time.',
      genre: audioFeatures.detectedGenre || 'acoustic',
      mood: audioFeatures.detectedMood || 'neutral',
      error: error.message
    };
  }
}

export async function generateVibeDescription(audioFeatures) {
  try {
    const { tempo, keySignature, vibe, brightness, energy } = audioFeatures;

    const prompt = `Describe this acoustic guitar performance in 2-3 engaging sentences:

Tempo: ${tempo} BPM
Key: ${keySignature}
Vibe: ${vibe.join(', ')}
Brightness: ${brightness > 2000 ? 'Bright' : brightness < 1500 ? 'Dark' : 'Warm'}
Energy: ${energy > 0.15 ? 'High energy' : energy > 0.08 ? 'Moderate energy' : 'Low energy, gentle'}

Make it sound natural and musical, as if you're describing it to a fellow musician.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a music critic who writes engaging, concise descriptions of acoustic guitar performances.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    return response.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error generating vibe description:', error);
    return `A ${audioFeatures.detectedMood || 'pleasant'} acoustic guitar piece in ${audioFeatures.keySignature} at ${Math.round(audioFeatures.tempo)} BPM.`;
  }
}
