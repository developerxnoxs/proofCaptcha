import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Code2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Framework = "html" | "react" | "nextjs" | "vue" | "php" | "python" | "nodejs";
type ChallengeType = "random" | "checkbox" | "slider" | "grid" | "jigsaw" | "gesture" | "upside_down";
type Theme = "light" | "dark" | "auto";

export default function IntegrationHelper() {
  const { t } = useTranslation();
  const [framework, setFramework] = useState<Framework>("html");
  const [challengeType, setChallengeType] = useState<ChallengeType>("random");
  const [theme, setTheme] = useState<Theme>("light");
  const [apiKey, setApiKey] = useState("YOUR_PUBLIC_KEY");
  const [secretKey, setSecretKey] = useState("YOUR_SECRET_KEY");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const { toast } = useToast();

  const generateCode = () => {
    switch (framework) {
      case "html":
        return {
          frontend: `<!DOCTYPE html>
<html>
<head>
  <title>ProofCaptcha Integration</title>
</head>
<body>
  <form id="myForm" action="/submit" method="POST">
    <input type="text" name="username" placeholder="Username" required>
    <input type="email" name="email" placeholder="Email" required>
    
    <!-- ProofCaptcha Widget -->
    <div class="proof-captcha" 
         data-sitekey="${apiKey}"
         data-type="${challengeType}"
         data-theme="${theme}"
         data-callback="onCaptchaSuccess"
         data-error-callback="onCaptchaError">
    </div>
    
    <!-- Hidden field for CAPTCHA token -->
    <input type="hidden" name="captcha_token" id="captcha_token" value="">
    
    <button type="submit" id="submitBtn" disabled>Submit Form</button>
  </form>

  <script>
    function onCaptchaSuccess(token) {
      console.log('CAPTCHA verified! Token:', token);
      // Set token to hidden input
      document.getElementById('captcha_token').value = token;
      // Enable submit button
      document.getElementById('submitBtn').disabled = false;
    }
    
    function onCaptchaError(error) {
      console.error('CAPTCHA error:', error);
      alert('CAPTCHA verification failed. Please try again.');
    }
  </script>
  
  <!-- Load ProofCaptcha API -->
  <script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>
</body>
</html>`,
          backend: `// Backend (Node.js/Express)
// Dependencies: npm install express node-fetch@2

const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.urlencoded({ extended: true }));

app.post('/submit', async (req, res) => {
  // For form-encoded data, use snake_case
  const captchaToken = req.body.captcha_token;
  
  // Validate CAPTCHA token
  const verifyResponse = await fetch(
    'https://your-domain.com/api/captcha/verify-token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer ${secretKey}\`
      },
      body: JSON.stringify({ token: captchaToken })
    }
  );
  
  const result = await verifyResponse.json();
  
  if (!result.success) {
    return res.status(400).send('CAPTCHA verification failed');
  }
  
  // Process your form here
  const { username, email } = req.body;
  console.log('Form submitted:', { username, email });
  
  res.send('Form submitted successfully!');
});

app.listen(3000, () => console.log('Server running on port 3000'));`
        };

      case "react":
        return {
          frontend: `import { useEffect, useRef, useState, type FormEvent } from 'react';

// Declare ProofCaptcha on window
declare global {
  interface Window {
    ProofCaptcha?: any;
  }
}

function CaptchaForm() {
  const captchaRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Load ProofCaptcha script
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/proofCaptcha/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.ProofCaptcha && captchaRef.current) {
        window.ProofCaptcha.render(captchaRef.current, {
          sitekey: '${apiKey}',
          type: '${challengeType}',
          theme: '${theme}',
          callback: (token: string) => {
            console.log('CAPTCHA verified!', token);
            setToken(token);
          },
          'error-callback': (error: any) => {
            console.error('CAPTCHA error:', error);
            alert('CAPTCHA verification failed');
          }
        });
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!token) {
      alert('Please complete the CAPTCHA');
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.get('username'),
        email: formData.get('email'),
        captchaToken: token
      })
    });
    
    if (response.ok) {
      alert('Form submitted successfully!');
    } else {
      alert('Submission failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="username" placeholder="Username" required />
      <input type="email" name="email" placeholder="Email" required />
      
      <div ref={captchaRef}></div>
      
      <button type="submit">Submit</button>
    </form>
  );
}

export default CaptchaForm;`,
          backend: `// Backend (Express.js API server)
// Dependencies: npm install express node-fetch@2 cors

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/submit', async (req, res) => {
  const captchaToken = req.body.captchaToken;
  
  // Validate CAPTCHA token
  const verifyResponse = await fetch(
    'https://your-domain.com/api/captcha/verify-token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer ${secretKey}\`
      },
      body: JSON.stringify({ token: captchaToken })
    }
  );
  
  const result = await verifyResponse.json();
  
  if (!result.success) {
    return res.status(400).json({ 
      error: 'CAPTCHA verification failed' 
    });
  }
  
  // Process your form here
  const { username, email } = req.body;
  
  res.json({ success: true, message: 'Form submitted!' });
});

app.listen(3001, () => console.log('API server on port 3001'));`
        };

      case "nextjs":
        return {
          frontend: `'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

// Declare ProofCaptcha on window
declare global {
  interface Window {
    ProofCaptcha?: any;
  }
}

export default function ContactForm() {
  const captchaRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/proofCaptcha/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.ProofCaptcha && captchaRef.current) {
        window.ProofCaptcha.render(captchaRef.current, {
          sitekey: '${apiKey}',
          type: '${challengeType}',
          theme: '${theme}',
          callback: setToken,
        });
      }
    };
    
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!token) {
      alert('Please complete the CAPTCHA');
      return;
    }
    
    const formData = new FormData(e.target as HTMLFormElement);
    
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.get('username'),
        email: formData.get('email'),
        captchaToken: token
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Form submitted successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="username" placeholder="Username" required />
      <input type="email" name="email" placeholder="Email" required />
      <div ref={captchaRef}></div>
      <button type="submit">Submit</button>
    </form>
  );
}`,
          backend: `// app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const captchaToken = body.captchaToken;
  
  // Validate CAPTCHA token
  const verifyResponse = await fetch(
    'https://your-domain.com/api/captcha/verify-token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer ${secretKey}\`
      },
      body: JSON.stringify({ token: captchaToken })
    }
  );
  
  const result = await verifyResponse.json();
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'CAPTCHA verification failed' },
      { status: 400 }
    );
  }
  
  // Process form
  const { username, email } = body;
  
  return NextResponse.json({ 
    success: true, 
    message: 'Form submitted!' 
  });
}`
        };

      case "vue":
        return {
          frontend: `<template>
  <form @submit.prevent="handleSubmit">
    <input 
      v-model="formData.username" 
      type="text" 
      placeholder="Username" 
      required 
    />
    <input 
      v-model="formData.email" 
      type="email" 
      placeholder="Email" 
      required 
    />
    
    <div ref="captchaRef"></div>
    
    <button type="submit">Submit</button>
  </form>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const captchaRef = ref(null);
const token = ref('');
const formData = ref({
  username: '',
  email: ''
});

let scriptElement = null;

onMounted(() => {
  scriptElement = document.createElement('script');
  scriptElement.src = 'https://your-domain.com/proofCaptcha/api.js';
  scriptElement.async = true;
  scriptElement.defer = true;
  
  scriptElement.onload = () => {
    if (window.ProofCaptcha && captchaRef.value) {
      window.ProofCaptcha.render(captchaRef.value, {
        sitekey: '${apiKey}',
        type: '${challengeType}',
        theme: '${theme}',
        callback: (t) => { token.value = t; }
      });
    }
  };
  
  document.body.appendChild(scriptElement);
});

onUnmounted(() => {
  if (scriptElement) {
    document.body.removeChild(scriptElement);
  }
});

const handleSubmit = async () => {
  if (!token.value) {
    alert('Please complete the CAPTCHA');
    return;
  }
  
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData.value,
      captchaToken: token.value
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert('Form submitted successfully!');
  }
};
</script>`,
          backend: `// Backend API (Node.js/Express)
// Dependencies: npm install express node-fetch@2 body-parser

const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/submit', async (req, res) => {
  const captchaToken = req.body.captchaToken;
  
  const verifyResponse = await fetch(
    'https://your-domain.com/api/captcha/verify-token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer ${secretKey}\`
      },
      body: JSON.stringify({ token: captchaToken })
    }
  );
  
  const result = await verifyResponse.json();
  
  if (!result.success) {
    return res.status(400).json({ error: 'CAPTCHA failed' });
  }
  
  // Process form
  const { username, email } = req.body;
  
  res.json({ success: true, message: 'Form submitted!' });
});

app.listen(3000, () => console.log('Server running on port 3000'));`
        };

      case "php":
        return {
          frontend: `<!DOCTYPE html>
<html>
<head>
  <title>ProofCaptcha PHP Integration</title>
</head>
<body>
  <form action="submit.php" method="POST">
    <input type="text" name="username" placeholder="Username" required>
    <input type="email" name="email" placeholder="Email" required>
    
    <div class="proof-captcha" 
         data-sitekey="${apiKey}"
         data-type="${challengeType}"
         data-theme="${theme}"
         data-callback="onCaptchaSuccess">
    </div>
    
    <!-- Hidden field for CAPTCHA token -->
    <input type="hidden" name="captcha_token" id="captcha_token">
    
    <button type="submit" id="submitBtn" disabled>Submit</button>
  </form>
  
  <script>
    function onCaptchaSuccess(token) {
      document.getElementById('captcha_token').value = token;
      document.getElementById('submitBtn').disabled = false;
    }
  </script>
  <script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>
</body>
</html>`,
          backend: `<?php
// submit.php

function validateCaptcha($token, $secretKey) {
    $url = 'https://your-domain.com/api/captcha/verify-token';
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'token' => $token
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $secretKey
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return false;
    }
    
    $result = json_decode($response, true);
    return $result['success'] ?? false;
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $captchaToken = $_POST['captcha_token'] ?? '';
    $secretKey = '${secretKey}';
    
    if (!validateCaptcha($captchaToken, $secretKey)) {
        die('CAPTCHA verification failed');
    }
    
    // Process form
    $username = $_POST['username'] ?? '';
    $email = $_POST['email'] ?? '';
    
    // Save to database, send email, etc.
    
    echo 'Form submitted successfully!';
}
?>`
        };

      case "python":
        return {
          frontend: `<!-- templates/form.html -->
<!DOCTYPE html>
<html>
<head>
  <title>ProofCaptcha Flask Integration</title>
</head>
<body>
  <form id="myForm">
    <input type="text" name="username" placeholder="Username" required>
    <input type="email" name="email" placeholder="Email" required>
    
    <div class="proof-captcha" 
         data-sitekey="${apiKey}"
         data-type="${challengeType}"
         data-theme="${theme}"
         data-callback="onCaptchaSuccess">
    </div>
    
    <button type="submit" id="submitBtn" disabled>Submit</button>
  </form>
  
  <script>
    let captchaToken = null;
    
    function onCaptchaSuccess(token) {
      captchaToken = token;
      document.getElementById('submitBtn').disabled = false;
    }
    
    document.getElementById('myForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const response = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.get('username'),
          email: formData.get('email'),
          captchaToken: captchaToken
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Form submitted successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    });
  </script>
  <script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>
</body>
</html>`,
          backend: `# app.py
# Dependencies: pip install flask requests

from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__)

# Set your secret key
SECRET_KEY = '${secretKey}'  # Replace with your actual secret key

def validate_captcha(token):
    """Validate CAPTCHA token with ProofCaptcha server"""
    url = 'https://your-domain.com/api/captcha/verify-token'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SECRET_KEY}'
    }
    data = {'token': token}
    
    try:
        response = requests.post(url, json=data, headers=headers, timeout=5)
        result = response.json()
        return result.get('success', False)
    except Exception as e:
        print(f'CAPTCHA validation error: {e}')
        return False

@app.route('/')
def index():
    return render_template('form.html')

@app.route('/submit', methods=['POST'])
def submit_form():
    data = request.get_json()
    captcha_token = data.get('captchaToken', '')
    
    if not validate_captcha(captcha_token):
        return jsonify({'error': 'CAPTCHA verification failed'}), 400
    
    # Process form
    username = data.get('username')
    email = data.get('email')
    
    # Save to database, send email, etc.
    
    return jsonify({'success': True, 'message': 'Form submitted!'})

if __name__ == '__main__':
    app.run(debug=True)`
        };

      case "nodejs":
        return {
          frontend: `<!-- Frontend HTML -->
<!DOCTYPE html>
<html>
<head><title>ProofCaptcha Node.js</title></head>
<body>
  <form action="/submit" method="POST">
    <input type="text" name="username" required>
    <input type="email" name="email" required>
    <div class="proof-captcha" 
         data-sitekey="${apiKey}" 
         data-type="${challengeType}"
         data-theme="${theme}"
         data-callback="onCaptchaSuccess">
    </div>
    <input type="hidden" name="captcha_token" id="captcha_token">
    <button type="submit" id="submitBtn" disabled>Submit</button>
  </form>
  <script>
    function onCaptchaSuccess(token) {
      document.getElementById('captcha_token').value = token;
      document.getElementById('submitBtn').disabled = false;
    }
  </script>
  <script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>
</body>
</html>`,
          backend: `// Backend (Node.js/Express)
// Dependencies: npm install express node-fetch@2

const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function validateCaptcha(token) {
  const response = await fetch(
    'https://your-domain.com/api/captcha/verify-token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer ${secretKey}\`
      },
      body: JSON.stringify({ token })
    }
  );
  
  const result = await response.json();
  return result.success;
}

app.post('/submit', async (req, res) => {
  // For form-encoded data, use snake_case
  const captchaToken = req.body.captcha_token;
  
  const isValid = await validateCaptcha(captchaToken);
  
  if (!isValid) {
    return res.status(400).json({ error: 'CAPTCHA failed' });
  }
  
  // Process form
  const { username, email } = req.body;
  
  res.json({ success: true, message: 'Submitted!' });
});

app.listen(3000, () => console.log('Server on port 3000'));`
        };

      default:
        return { frontend: "", backend: "" };
    }
  };

  const code = generateCode();

  const getLanguage = (type: 'frontend' | 'backend'): string => {
    if (type === 'backend') {
      switch (framework) {
        case 'php':
          return 'php';
        case 'python':
          return 'python';
        case 'nextjs':
          return 'typescript';
        default:
          return 'javascript';
      }
    }
    
    // Frontend language
    switch (framework) {
      case 'react':
      case 'nextjs':
        return 'typescript'; // Changed from 'tsx' to 'typescript'
      case 'vue':
        return 'javascript'; // Changed from 'vue' to 'javascript' (Vue SFC)
      case 'php':
      case 'python':
      case 'nodejs':
      case 'html':
      default:
        return 'html';
    }
  };

  const copyToClipboard = async (text: string, tab: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    toast({
      title: t('toast.success'),
      description: t('integration.toast.codeCopied'),
    });
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 sm:w-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{t('integration.title')}</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground ml-9 sm:ml-11">
            {t('integration.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="shadow-lg hover:shadow-xl transition-all card-3d">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t('integration.configuration.title')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('integration.configuration.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="framework" className="text-xs sm:text-sm">{t('integration.selectFramework')}</Label>
                <Select value={framework} onValueChange={(v) => setFramework(v as Framework)}>
                  <SelectTrigger id="framework" data-testid="select-framework" className="h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">{t('integration.frameworks.html')}</SelectItem>
                    <SelectItem value="react">{t('integration.frameworks.react')}</SelectItem>
                    <SelectItem value="nextjs">{t('integration.frameworks.nextjs')}</SelectItem>
                    <SelectItem value="vue">{t('integration.frameworks.vue')}</SelectItem>
                    <SelectItem value="php">{t('integration.frameworks.php')}</SelectItem>
                    <SelectItem value="python">{t('integration.frameworks.python')}</SelectItem>
                    <SelectItem value="nodejs">{t('integration.frameworks.nodejs')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="challenge-type" className="text-xs sm:text-sm">{t('integration.challengeType')}</Label>
                <Select value={challengeType} onValueChange={(v) => setChallengeType(v as ChallengeType)}>
                  <SelectTrigger id="challenge-type" data-testid="select-challenge-type" className="h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">{t('integration.challenges.random')}</SelectItem>
                    <SelectItem value="checkbox">{t('integration.challenges.checkbox')}</SelectItem>
                    <SelectItem value="slider">{t('integration.challenges.slider')}</SelectItem>
                    <SelectItem value="grid">{t('integration.challenges.grid')}</SelectItem>
                    <SelectItem value="jigsaw">{t('integration.challenges.jigsaw')}</SelectItem>
                    <SelectItem value="gesture">{t('integration.challenges.gesture')}</SelectItem>
                    <SelectItem value="upside_down">{t('integration.challenges.upside_down')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`integration.challengeDescriptions.${challengeType}`)}
                </p>
              </div>

              <div>
                <Label htmlFor="theme" className="text-xs sm:text-sm">{t('integration.theme')}</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                  <SelectTrigger id="theme" data-testid="select-theme" className="h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('integration.themes.light')}</SelectItem>
                    <SelectItem value="dark">{t('integration.themes.dark')}</SelectItem>
                    <SelectItem value="auto">{t('integration.themes.auto')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-3 sm:pt-4 border-t">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  {t('integration.replacePlaceholder')}
                </p>
                <div className="space-y-1.5 sm:space-y-2 text-xs">
                  <div className="p-1.5 sm:p-2 bg-muted rounded">
                    <code className="text-[10px] sm:text-xs">YOUR_PUBLIC_KEY</code>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-muted rounded">
                    <code className="text-[10px] sm:text-xs">YOUR_SECRET_KEY</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-lg hover:shadow-xl transition-all card-3d">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <CardTitle className="text-base sm:text-lg">{t('integration.generatedCode.title')}</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">{t('integration.generatedCode.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="frontend" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="frontend" data-testid="tab-frontend" className="text-xs sm:text-sm">{t('integration.generatedCode.frontend')}</TabsTrigger>
                  <TabsTrigger value="backend" data-testid="tab-backend" className="text-xs sm:text-sm">{t('integration.generatedCode.backend')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="frontend" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  <div className="relative rounded-md overflow-hidden">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10 text-xs h-7 sm:h-8"
                      onClick={() => copyToClipboard(code.frontend, "frontend")}
                      data-testid="button-copy-frontend"
                    >
                      {copiedTab === "frontend" ? (
                        <><Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> <span className="hidden sm:inline">{t('integration.generatedCode.copied')}</span><span className="sm:hidden">OK</span></>
                      ) : (
                        <><Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> <span className="hidden sm:inline">{t('integration.generatedCode.copy')}</span><span className="sm:hidden">Copy</span></>
                      )}
                    </Button>
                    <div className="overflow-auto max-h-[400px] w-full">
                      <SyntaxHighlighter
                        language={getLanguage('frontend')}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.375rem',
                          fontSize: window.innerWidth < 640 ? '0.65rem' : '0.75rem',
                          lineHeight: '1.5',
                          minWidth: '100%',
                          width: 'max-content',
                          overflow: 'visible'
                        }}
                        showLineNumbers
                        wrapLines={false}
                        wrapLongLines={false}
                      >
                        {code.frontend}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="backend" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  <div className="relative rounded-md overflow-hidden">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10 text-xs h-7 sm:h-8"
                      onClick={() => copyToClipboard(code.backend, "backend")}
                      data-testid="button-copy-backend"
                    >
                      {copiedTab === "backend" ? (
                        <><Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> <span className="hidden sm:inline">{t('integration.generatedCode.copied')}</span><span className="sm:hidden">OK</span></>
                      ) : (
                        <><Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> <span className="hidden sm:inline">{t('integration.generatedCode.copy')}</span><span className="sm:hidden">Copy</span></>
                      )}
                    </Button>
                    <div className="overflow-auto max-h-[400px] w-full">
                      <SyntaxHighlighter
                        language={getLanguage('backend')}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.375rem',
                          fontSize: window.innerWidth < 640 ? '0.65rem' : '0.75rem',
                          lineHeight: '1.5',
                          minWidth: '100%',
                          width: 'max-content',
                          overflow: 'visible'
                        }}
                        showLineNumbers
                        wrapLines={false}
                        wrapLongLines={false}
                      >
                        {code.backend}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  {t('integration.quickStart.title')}
                </h4>
                <ol className="text-xs sm:text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>{t('integration.quickStart.step1Text')} <a href="/dashboard/api-keys" className="text-primary hover:underline">{t('integration.quickStart.step1Link')}</a></li>
                  <li>{t('integration.quickStart.step2')} <code className="bg-white dark:bg-gray-900 px-1 rounded text-[10px] sm:text-xs">YOUR_PUBLIC_KEY</code> {t('integration.quickStart.step2And')} <code className="bg-white dark:bg-gray-900 px-1 rounded text-[10px] sm:text-xs">YOUR_SECRET_KEY</code></li>
                  <li>{t('integration.quickStart.step3')} <code className="bg-white dark:bg-gray-900 px-1 rounded text-[10px] sm:text-xs">your-domain.com</code> {t('integration.quickStart.step3To')}</li>
                  <li>{t('integration.quickStart.step4')}</li>
                  <li>{t('integration.quickStart.step5')}</li>
                  <li>{t('integration.quickStart.step6Text')} <a href="/api-docs" className="text-primary hover:underline">{t('integration.quickStart.step6Link')}</a></li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
