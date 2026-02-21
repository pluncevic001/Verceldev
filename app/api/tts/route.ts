export const maxDuration = 30

// ElevenLabs text-to-speech API
export async function POST(req: Request) {
  try {
    const { text, apiKey } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const voiceId = 'JBFqnCBsd6RMkjVDRZzb'

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] ElevenLabs API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate speech' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream the audio back to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('[v0] TTS API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate speech' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
