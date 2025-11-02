'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function UsagePage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [copiedSection, setCopiedSection] = useState<string>('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-worker.workers.dev';

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await api.getKeys();
      setKeys(data.keys || []);
      if (data.keys && data.keys.length > 0) {
        setSelectedKey(data.keys[0].id);
      }
    } catch (error) {
      console.error('Failed to load keys:', error);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  const CodeBlock = ({ code, language, section }: { code: string; language: string; section: string }) => (
    <div className="relative">
      <div className="absolute top-2 right-2 flex gap-2">
        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">{language}</span>
        <button
          onClick={() => copyToClipboard(code, section)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
        >
          {copiedSection === section ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-900">How to Use Your Gateway</h1>

      {/* Key Selector */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Gateway Key for Examples:
        </label>
        <select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
        >
          {keys.map((key) => (
            <option key={key.id} value={key.id}>
              {key.name} - {key.id}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Start */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">Quick Start</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>API Endpoint:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{apiUrl}/v1/chat/completions</code></p>
          <p><strong>Authentication:</strong> Use your gateway key as Bearer token</p>
          <p><strong>Compatible with:</strong> OpenAI SDK, AI coding tools, LangChain, LlamaIndex, and more</p>
        </div>
      </div>

      {/* AI Coding Platforms */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">🤖 AI Coding Platforms</h2>

        {/* Cline (Claude Dev) */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cline (VS Code Extension)</h3>
          <p className="text-sm text-gray-600 mb-3">
            In VS Code, open Cline settings (Cmd/Ctrl + Shift + P → "Cline: Open Settings"):
          </p>
          <CodeBlock
            section="cline"
            language="json"
            code={`{
  "cline.apiProvider": "openai-compatible",
  "cline.openaiCompatibleBaseUrl": "${apiUrl}/v1",
  "cline.openaiCompatibleApiKey": "${selectedKey}",
  "cline.openaiCompatibleModel": "gpt-4o-mini"
}`}
          />
        </div>

        {/* Cursor */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cursor IDE</h3>
          <p className="text-sm text-gray-600 mb-3">
            Settings → Models → Add Custom Model:
          </p>
          <CodeBlock
            section="cursor"
            language="config"
            code={`API Provider: OpenAI Compatible
Base URL: ${apiUrl}/v1
API Key: ${selectedKey}
Model: gpt-4o-mini`}
          />
        </div>

        {/* Continue.dev */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Continue.dev</h3>
          <p className="text-sm text-gray-600 mb-3">
            Edit <code>~/.continue/config.json</code>:
          </p>
          <CodeBlock
            section="continue"
            language="json"
            code={`{
  "models": [
    {
      "title": "AI Gateway",
      "provider": "openai",
      "model": "gpt-4o-mini",
      "apiBase": "${apiUrl}/v1",
      "apiKey": "${selectedKey}"
    }
  ]
}`}
          />
        </div>

        {/* Windsurf */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Windsurf (Codeium)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Settings → AI Models → Custom OpenAI Endpoint:
          </p>
          <CodeBlock
            section="windsurf"
            language="config"
            code={`Base URL: ${apiUrl}/v1
API Key: ${selectedKey}
Model: gpt-4o-mini`}
          />
        </div>

        {/* Roo Cline */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Roo Cline</h3>
          <p className="text-sm text-gray-600 mb-3">
            Same as Cline configuration above
          </p>
        </div>

        {/* Bolt.new / StackBlitz */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bolt.new / StackBlitz</h3>
          <p className="text-sm text-gray-600 mb-3">
            Settings → API Keys → Custom OpenAI Endpoint:
          </p>
          <CodeBlock
            section="bolt"
            language="env"
            code={`OPENAI_API_BASE=${apiUrl}/v1
OPENAI_API_KEY=${selectedKey}
OPENAI_MODEL=gpt-4o-mini`}
          />
        </div>

        {/* Aider */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aider (Terminal AI Coding)</h3>
          <CodeBlock
            section="aider"
            language="bash"
            code={`export OPENAI_API_BASE="${apiUrl}/v1"
export OPENAI_API_KEY="${selectedKey}"
aider --model gpt-4o-mini`}
          />
        </div>
      </div>

      {/* Programming Languages */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">💻 Programming Languages</h2>

        {/* Python - OpenAI */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Python (OpenAI SDK)</h3>
          <CodeBlock
            section="python-openai"
            language="python"
            code={`from openai import OpenAI

client = OpenAI(
    api_key="${selectedKey}",
    base_url="${apiUrl}/v1"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
print(f"Cost: {response._gateway_metadata['cost']}")`}
          />
        </div>

        {/* Python - LangChain */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Python (LangChain)</h3>
          <CodeBlock
            section="python-langchain"
            language="python"
            code={`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o-mini",
    openai_api_key="${selectedKey}",
    openai_api_base="${apiUrl}/v1"
)

response = llm.invoke("Tell me a joke")
print(response.content)`}
          />
        </div>

        {/* Python - LlamaIndex */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Python (LlamaIndex)</h3>
          <CodeBlock
            section="python-llamaindex"
            language="python"
            code={`from llama_index.llms.openai_like import OpenAILike

llm = OpenAILike(
    model="gpt-4o-mini",
    api_key="${selectedKey}",
    api_base="${apiUrl}/v1",
    is_chat_model=True
)

response = llm.complete("What is AI?")
print(response.text)`}
          />
        </div>

        {/* JavaScript/Node.js */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">JavaScript / Node.js</h3>
          <CodeBlock
            section="javascript"
            language="javascript"
            code={`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '${selectedKey}',
  baseURL: '${apiUrl}/v1'
});

const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.choices[0].message.content);
console.log('Cost:', response._gateway_metadata.cost);`}
          />
        </div>

        {/* TypeScript */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">TypeScript</h3>
          <CodeBlock
            section="typescript"
            language="typescript"
            code={`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '${selectedKey}',
  baseURL: '${apiUrl}/v1'
});

async function chat(message: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: message }]
  });

  return response.choices[0].message.content || '';
}

const result = await chat('Explain TypeScript');
console.log(result);`}
          />
        </div>

        {/* Go */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Go</h3>
          <CodeBlock
            section="go"
            language="go"
            code={`package main

import (
    "context"
    "fmt"
    openai "github.com/sashabaranov/go-openai"
)

func main() {
    config := openai.DefaultConfig("${selectedKey}")
    config.BaseURL = "${apiUrl}/v1"
    client := openai.NewClientWithConfig(config)
    resp, err := client.CreateChatCompletion(
        context.Background(),
        openai.ChatCompletionRequest{
            Model: "gpt-4o-mini",
            Messages: []openai.ChatCompletionMessage{
                {Role: "user", Content: "Hello!"},
            },
        },
    )
    if err != nil {
        panic(err)
    }
    fmt.Println(resp.Choices[0].Message.Content)
}`}
          />
        </div>

        {/* Java */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Java</h3>
          <CodeBlock
            section="java"
            language="java"
            code={`import com.theokanning.openai.client.OpenAiApi;
import com.theokanning.openai.completion.chat.*;
import retrofit2.Retrofit;

public class AIGatewayExample {
    public static void main(String[] args) {
        OpenAiApi api = new Retrofit.Builder()
            .baseUrl("${apiUrl}/v1/")
            .build()
            .create(OpenAiApi.class);

        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model("gpt-4o-mini")
            .messages(List.of(
                new ChatMessage("user", "Hello!")
            ))
            .build();

        // Add authorization header with key: ${selectedKey}
        ChatCompletionResult result = api.createChatCompletion(request).execute().body();
        System.out.println(result.getChoices().get(0).getMessage().getContent());
    }
}`}
          />
        </div>

        {/* PHP */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">PHP</h3>
          <CodeBlock
            section="php"
            language="php"
            code={`<?php
require 'vendor/autoload.php';

use OpenAI\\Client;

$client = OpenAI::factory()
    ->withApiKey('${selectedKey}')
    ->withBaseUri('${apiUrl}/v1')
    ->make();

$response = $client->chat()->create([
    'model' => 'gpt-4o-mini',
    'messages' => [
        ['role' => 'user', 'content' => 'Hello!']
    ]
]);

echo $response['choices'][0]['message']['content'];
?>`}
          />
        </div>

        {/* Ruby */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ruby</h3>
          <CodeBlock
            section="ruby"
            language="ruby"
            code={`require 'openai'

client = OpenAI::Client.new(
  access_token: "${selectedKey}",
  uri_base: "${apiUrl}/v1"
)

response = client.chat(
  parameters: {
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: "Hello!" }
    ]
  }
)

puts response.dig("choices", 0, "message", "content")`}
          />
        </div>

        {/* C# */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">C# / .NET</h3>
          <CodeBlock
            section="csharp"
            language="csharp"
            code={`using OpenAI;
using OpenAI.Chat;

var client = new OpenAIClient("${selectedKey}", new OpenAIClientOptions {
    Endpoint = new Uri("${apiUrl}/v1")
});

var chatClient = client.GetChatClient("gpt-4o-mini");
var response = await chatClient.CompleteChatAsync(
    new ChatMessage(ChatMessageRole.User, "Hello!")
);

Console.WriteLine(response.Content[0].Text);`}
          />
        </div>

        {/* Rust */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Rust</h3>
          <CodeBlock
            section="rust"
            language="rust"
            code={`use async_openai::{Client, types::{CreateChatCompletionRequestArgs, ChatCompletionRequestMessage}};

#[tokio::main]
async fn main() {
    let client = Client::new()
        .with_api_key("${selectedKey}")
        .with_api_base("${apiUrl}/v1");

    let request = CreateChatCompletionRequestArgs::default()
        .model("gpt-4o-mini")
        .messages(vec![
            ChatCompletionRequestMessage::User("Hello!".into())
        ])
        .build()
        .unwrap();

    let response = client.chat().create(request).await.unwrap();
    println!("{}", response.choices[0].message.content);
}`}
          />
        </div>
      </div>

      {/* cURL */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔧 cURL / HTTP</h2>
        <CodeBlock
          section="curl"
          language="bash"
          code={`curl -X POST ${apiUrl}/v1/chat/completions \\
  -H "Authorization: Bearer ${selectedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'`}
        />
      </div>

      {/* Environment Variables */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔐 Environment Variables</h2>
        <p className="text-sm text-gray-600 mb-3">
          Set these in your <code>.env</code> file:
        </p>
        <CodeBlock
          section="env"
          language="bash"
          code={`# AI Gateway Configuration
OPENAI_API_KEY=${selectedKey}
OPENAI_API_BASE=${apiUrl}/v1
OPENAI_MODEL=gpt-4o-mini

# Alternative names for different tools
ANTHROPIC_API_KEY=${selectedKey}
ANTHROPIC_BASE_URL=${apiUrl}/v1`}
        />
      </div>

      {/* Response Format */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">📊 Response Format</h2>
        <p className="text-sm text-gray-600 mb-3">
          The gateway returns OpenAI-compatible responses with additional metadata:
        </p>
        <CodeBlock
          section="response"
          language="json"
          code={`{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o-mini",
  "choices": [...],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  },
  "_gateway_metadata": {
    "cost": 0.000015,
    "provider": "OpenAI",
    "latency_ms": 1234,
    "is_failover": false,
    "attempted_providers": ["OpenAI"]
  }
}`}
        />
      </div>
    </div>
  );
}
