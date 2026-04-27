# AI Providers Guide

This extension is designed to be easily extensible to new AI providers. All API logic is centralized in `background.js` and managed via a normalized request handler.

## How to Add a New Provider

### 1. Update the UI
In `popup.html`:
- Add a new `<option>` to the `#provider` select.
- Add a new `.key-container` div with an input for the provider's API key.

In `popup.js`:
- Add the provider's models to the `PROVIDER_MODELS` object.
- Add the new key input and container to the `keyInputs` and `keyContainers` objects.

### 2. Implement the API Handler
In `background.js`:
- Create a new async function `handle[ProviderName](model, system, messages, apiKey)`.
- Ensure it returns a string (the assistant's response).
- Normalize the provider's specific message format to its API requirements.

### 3. Update the Router
In `background.js`:
- Update the `switch (provider)` block in the `handleRequest` function to include your new provider and call its handler.

## Normalization Patterns

The extension uses a standard `messages` array format internally:
```json
[
  { "role": "user", "content": "..." },
  { "role": "assistant", "content": "..." }
]
```
Ensure your handler converts this format to whatever the provider's API expects (e.g., Gemini uses `parts`, OpenAI uses `role`/`content` in a specific order).
