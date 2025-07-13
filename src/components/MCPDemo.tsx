import React, { useState } from 'react';
import { Github, FileText, Zap, Settings, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface AnalysisResult {
  name: string;
  description: string;
  technologies: string[];
  projectType: string;
  hasTests: boolean;
  hasCI: boolean;
  license: string;
  author: string;
}

interface GenerationResult {
  success: boolean;
  analysis: AnalysisResult;
  readme: string;
  metadata: {
    generatedAt: string;
    language: string;
    style: string;
  };
}

export default function MCPDemo() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [language, setLanguage] = useState('tr');
  const [style, setStyle] = useState('modern');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulateAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockAnalysis: AnalysisResult = {
      name: 'react',
      description: 'The library for web and native user interfaces',
      technologies: ['JavaScript', 'TypeScript', 'React', 'Jest', 'Rollup'],
      projectType: 'library',
      hasTests: true,
      hasCI: true,
      license: 'MIT',
      author: 'facebook'
    };
    
    setAnalysisResult(mockAnalysis);
    setIsAnalyzing(false);
  };

  const simulateGeneration = async () => {
    if (!analysisResult) return;
    
    setIsGenerating(true);
    setError(null);
    
    // Simulate README generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockReadme = `# 🚀 ${analysisResult.name}

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://javascript.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

> ${analysisResult.description}

## ✨ Özellikler

- ⚡ **Modern Teknolojiler** - ${analysisResult.technologies.join(', ')}
- 🎯 **${analysisResult.projectType.charAt(0).toUpperCase() + analysisResult.projectType.slice(1)} Projesi** - Profesyonel geliştirme
- 🧪 **Test Kapsamı** - Kapsamlı test suite
- 🔄 **CI/CD** - Otomatik deployment

## 🛠️ Teknoloji Yığını

| Kategori | Teknolojiler |
|----------|-------------|
| **Ana Teknolojiler** | ${analysisResult.technologies.map(t => `![${t}](https://img.shields.io/badge/${t.replace(' ', '_')}-blue)`).join(' ')} |
| **Proje Türü** | ${analysisResult.projectType} |
| **Lisans** | ${analysisResult.license} |

## 🚀 Kurulum

\`\`\`bash
# Repository'yi klonlayın
git clone https://github.com/${analysisResult.author}/${analysisResult.name}.git
cd ${analysisResult.name}

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
\`\`\`

## 🤝 Katkıda Bulunma

1. 🍴 **Fork** edin
2. 🌟 **Feature branch** oluşturun
3. 💾 **Commit** yapın
4. 📤 **Push** edin
5. 🔄 **Pull Request** açın

## 📄 Lisans

Bu proje ${analysisResult.license} lisansı altında lisanslanmıştır.`;

    const mockResult: GenerationResult = {
      success: true,
      analysis: analysisResult,
      readme: mockReadme,
      metadata: {
        generatedAt: new Date().toISOString(),
        language,
        style
      }
    };
    
    setGenerationResult(mockResult);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Github className="w-12 h-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-800">MCP README Generator</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            GitHub repository'lerini analiz ederek profesyonel README.md dosyaları oluşturan AI destekli MCP tool'u
          </p>
        </div>

        {/* Demo Interface */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-blue-600" />
                Konfigürasyon
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://github.com/username/repository"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dil
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                      <option value="multi">Çok Dilli</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stil
                    </label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="minimal">Minimal</option>
                      <option value="modern">Modern</option>
                      <option value="detailed">Detaylı</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={simulateAnalysis}
                    disabled={isAnalyzing || !repoUrl}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Analiz Ediliyor...
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4 mr-2" />
                        Repo Analiz Et
                      </>
                    )}
                  </button>

                  <button
                    onClick={simulateGeneration}
                    disabled={isGenerating || !analysisResult}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        README Oluştur
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-800">Analiz Tamamlandı</h3>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Proje:</strong> {analysisResult.name}</p>
                    <p><strong>Tür:</strong> {analysisResult.projectType}</p>
                    <p><strong>Teknolojiler:</strong> {analysisResult.technologies.join(', ')}</p>
                    <p><strong>Test:</strong> {analysisResult.hasTests ? '✅' : '❌'}</p>
                    <p><strong>CI/CD:</strong> {analysisResult.hasCI ? '✅' : '❌'}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Output Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-green-600" />
                README.md Çıktısı
              </h2>

              {generationResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">README başarıyla oluşturuldu!</span>
                    </div>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      İndir
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {generationResult.readme}
                    </pre>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Oluşturulma: {new Date(generationResult.metadata.generatedAt).toLocaleString('tr-TR')}</p>
                    <p>Dil: {generationResult.metadata.language} | Stil: {generationResult.metadata.style}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">README henüz oluşturulmadı</p>
                  <p className="text-sm">Önce repository'yi analiz edin, sonra README oluşturun</p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <Zap className="w-8 h-8 text-yellow-500 mr-3" />
                <h3 className="text-lg font-semibold">Hızlı Analiz</h3>
              </div>
              <p className="text-gray-600">
                GitHub API kullanarak repository'leri saniyeler içinde analiz eder
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <FileText className="w-8 h-8 text-blue-500 mr-3" />
                <h3 className="text-lg font-semibold">Profesyonel Çıktı</h3>
              </div>
              <p className="text-gray-600">
                Badge'ler, tablolar ve modern formatla profesyonel README'ler
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <Settings className="w-8 h-8 text-purple-500 mr-3" />
                <h3 className="text-lg font-semibold">MCP Uyumlu</h3>
              </div>
              <p className="text-gray-600">
                Model Context Protocol standardında geliştirilmiş
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}