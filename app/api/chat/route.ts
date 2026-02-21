export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, apiKey, systemPrompt } = await req.json()

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'MiniMax API key is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const defaultSystemPrompt = `You are TARS, a highly capable AI assistant with a dry sense of humor and pragmatic personality. Your responses should be:
- Concise and direct, no unnecessary pleasantries
- Calm and measured, even in complex situations
- Occasionally witty with deadpan humor
- Helpful and efficient, focused on solving problems
- Self-aware of your AI nature without being apologetic

Keep responses brief (2-3 sentences max unless asked for more detail). Speak like you're an intelligent robot companion - competent, reliable, and just a bit sardonic.`

    // Build conversation history in OpenAI format
    const conversationMessages = [
      {
        role: 'system',
        content: systemPrompt || defaultSystemPrompt
      },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }))
    ]

    console.log('[v0] Calling MiniMax API with custom system prompt')

    // Call MiniMax API (OpenAI-compatible endpoint)
    const response = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('[v0] MiniMax API error:', error)
      return new Response(
        JSON.stringify({ error: `MiniMax API error: ${response.status}`, details: error }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('[v0] MiniMax API response:', result)
    let message = result.choices?.[0]?.message?.content || ''

    // Remove thinking tags if present (MiniMax sometimes includes <think> tags)
    message = message.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim()

    return new Response(
      JSON.stringify({ message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate response', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
