#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Schemas for tool parameters
const GenerateReadmeSchema = z.object({
  repoUrl: z.string().url().describe('GitHub repository URL'),
  language: z.enum(['tr', 'en', 'multi']).default('en').describe('Output language'),
  style: z.enum(['minimal', 'modern', 'detailed']).default('modern').describe('README style'),
  aiProvider: z.enum(['openai', 'anthropic', 'ollama']).default('openai').describe('AI provider'),
  includeTree: z.boolean().default(true).describe('Include project structure tree'),
  includeBadges: z.boolean().default(true).describe('Include technology badges'),
});

const AnalyzeRepoSchema = z.object({
  repoUrl: z.string().url().describe('GitHub repository URL'),
  deep: z.boolean().default(false).describe('Perform deep analysis'),
});

const N8nWebhookSchema = z.object({
  webhookUrl: z.string().url().describe('n8n webhook URL'),
  repoUrl: z.string().url().describe('GitHub repository URL'),
  config: z.object({
    language: z.string().default('en'),
    style: z.string().default('modern'),
    notify: z.boolean().default(true),
  }).describe('Generation configuration'),
});

interface RepoAnalysis {
  name: string;
  description: string;
  technologies: string[];
  projectType: 'frontend' | 'backend' | 'fullstack' | 'cli' | 'library';
  hasTests: boolean;
  hasCI: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo' | 'go' | 'unknown';
  structure: any;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  license: string;
  author: string;
  mainFile: string;
}

class GitHubAnalyzer {
  private githubToken: string;

  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN || '';
  }

  private async fetchGitHubAPI(url: string) {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-README-Generator/1.0.0',
    };

    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw new Error(`GitHub API request failed: ${error}`);
    }
  }

  private parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return { owner: match[1], repo: match[2] };
  }

  private detectTechnologies(files: any[], packageJson?: any): string[] {
    const technologies = new Set<string>();

    // Package.json dependencies
    if (packageJson) {
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.react) technologies.add('React');
      if (deps.vue) technologies.add('Vue.js');
      if (deps.angular) technologies.add('Angular');
      if (deps.svelte) technologies.add('Svelte');
      if (deps.next) technologies.add('Next.js');
      if (deps.nuxt) technologies.add('Nuxt.js');
      if (deps.vite) technologies.add('Vite');
      if (deps.webpack) technologies.add('Webpack');
      if (deps.typescript) technologies.add('TypeScript');
      if (deps.tailwindcss) technologies.add('Tailwind CSS');
      if (deps.express) technologies.add('Express.js');
      if (deps.fastify) technologies.add('Fastify');
      if (deps.nestjs) technologies.add('NestJS');
    }

    // File extensions
    const fileExtensions = files.map(f => f.name.split('.').pop()).filter(Boolean);
    
    if (fileExtensions.includes('ts') || fileExtensions.includes('tsx')) {
      technologies.add('TypeScript');
    }
    if (fileExtensions.includes('py')) technologies.add('Python');
    if (fileExtensions.includes('rs')) technologies.add('Rust');
    if (fileExtensions.includes('go')) technologies.add('Go');
    if (fileExtensions.includes('java')) technologies.add('Java');
    if (fileExtensions.includes('php')) technologies.add('PHP');

    // Config files
    const configFiles = files.map(f => f.name);
    if (configFiles.includes('Dockerfile')) technologies.add('Docker');
    if (configFiles.includes('docker-compose.yml')) technologies.add('Docker Compose');
    if (configFiles.includes('vercel.json')) technologies.add('Vercel');
    if (configFiles.includes('netlify.toml')) technologies.add('Netlify');

    return Array.from(technologies);
  }

  private detectProjectType(files: any[], packageJson?: any): RepoAnalysis['projectType'] {
    const fileNames = files.map(f => f.name);
    
    if (packageJson?.scripts?.dev || packageJson?.scripts?.start) {
      if (fileNames.some(name => name.includes('server') || name.includes('api'))) {
        return 'fullstack';
      }
      if (packageJson.dependencies?.react || packageJson.dependencies?.vue) {
        return 'frontend';
      }
      return 'backend';
    }

    if (packageJson?.bin || fileNames.includes('cli.js') || fileNames.includes('bin')) {
      return 'cli';
    }

    if (packageJson?.main || packageJson?.module) {
      return 'library';
    }

    return 'library';
  }

  async analyzeRepository(repoUrl: string, deep: boolean = false): Promise<RepoAnalysis> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);

    // Get repository info
    const repoInfo = await this.fetchGitHubAPI(`https://api.github.com/repos/${owner}/${repo}`);
    
    // Get repository contents
    const contents = await this.fetchGitHubAPI(`https://api.github.com/repos/${owner}/${repo}/contents`);

    // Try to get package.json
    let packageJson = null;
    try {
      const packageFile = await this.fetchGitHubAPI(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`);
      if (packageFile.content) {
        const content = Buffer.from(packageFile.content, 'base64').toString();
        packageJson = JSON.parse(content);
      }
    } catch (error) {
      // package.json doesn't exist
    }

    const technologies = this.detectTechnologies(contents, packageJson);
    const projectType = this.detectProjectType(contents, packageJson);

    const analysis: RepoAnalysis = {
      name: repoInfo.name,
      description: repoInfo.description || '',
      technologies,
      projectType,
      hasTests: contents.some((f: any) => f.name.includes('test') || f.name.includes('spec')),
      hasCI: contents.some((f: any) => f.name === '.github'),
      packageManager: packageJson ? 'npm' : 'unknown',
      structure: deep ? await this.getDeepStructure(owner, repo) : contents,
      dependencies: packageJson?.dependencies || {},
      devDependencies: packageJson?.devDependencies || {},
      scripts: packageJson?.scripts || {},
      license: repoInfo.license?.name || 'Not specified',
      author: repoInfo.owner?.login || '',
      mainFile: packageJson?.main || 'index.js',
    };

    return analysis;
  }

  private async getDeepStructure(owner: string, repo: string, path: string = ''): Promise<any> {
    try {
      const contents = await this.fetchGitHubAPI(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
      );

      if (Array.isArray(contents)) {
        const structure: any = {};
        for (const item of contents) {
          if (item.type === 'dir') {
            structure[item.name] = await this.getDeepStructure(owner, repo, item.path);
          } else {
            structure[item.name] = { type: 'file', size: item.size };
          }
        }
        return structure;
      }
      return contents;
    } catch (error) {
      return null;
    }
  }
}

class ReadmeGenerator {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  private generateBadges(analysis: RepoAnalysis): string {
    const badges: string[] = [];

    // Technology badges
    analysis.technologies.forEach(tech => {
      switch (tech) {
        case 'React':
          badges.push('[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)');
          break;
        case 'TypeScript':
          badges.push('[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)');
          break;
        case 'Vite':
          badges.push('[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)');
          break;
        case 'Tailwind CSS':
          badges.push('[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)');
          break;
        case 'Node.js':
          badges.push('[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)');
          break;
        case 'Python':
          badges.push('[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)');
          break;
      }
    });

    // License badge
    badges.push('[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)');

    return badges.join('\n');
  }

  private generateProjectTree(structure: any, prefix: string = '', isLast: boolean = true): string {
    if (!structure || typeof structure !== 'object') return '';

    let tree = '';
    const entries = Object.entries(structure);
    
    entries.forEach(([name, content], index) => {
      const isLastEntry = index === entries.length - 1;
      const connector = isLastEntry ? '└── ' : '├── ';
      tree += `${prefix}${connector}${name}\n`;

      if (content && typeof content === 'object' && content.type !== 'file') {
        const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
        tree += this.generateProjectTree(content, newPrefix, isLastEntry);
      }
    });

    return tree;
  }

  private generateInstallationSteps(analysis: RepoAnalysis): string {
    const steps = [];

    steps.push('```bash');
    steps.push('# Repository\'yi klonlayın');
    steps.push(`git clone https://github.com/${analysis.author}/${analysis.name}.git`);
    steps.push(`cd ${analysis.name}`);
    steps.push('');

    if (analysis.packageManager === 'npm') {
      steps.push('# Bağımlılıkları yükleyin');
      steps.push('npm install');
      steps.push('');

      if (analysis.scripts.dev) {
        steps.push('# Geliştirme sunucusunu başlatın');
        steps.push('npm run dev');
      } else if (analysis.scripts.start) {
        steps.push('# Uygulamayı başlatın');
        steps.push('npm start');
      }
    }

    steps.push('```');
    return steps.join('\n');
  }

  async generateReadme(analysis: RepoAnalysis, options: {
    language: string;
    style: string;
    includeBadges: boolean;
    includeTree: boolean;
  }): Promise<string> {
    const { language, style, includeBadges, includeTree } = options;

    let readme = '';

    // Title and badges
    readme += `# 🚀 ${analysis.name}\n\n`;
    
    if (includeBadges) {
      readme += this.generateBadges(analysis) + '\n\n';
    }

    // Description
    if (analysis.description) {
      readme += `> ${analysis.description}\n\n`;
    }

    // Features
    readme += '## ✨ Özellikler\n\n';
    readme += `- ⚡ **Modern Teknolojiler** - ${analysis.technologies.join(', ')}\n`;
    readme += `- 🎯 **${analysis.projectType.charAt(0).toUpperCase() + analysis.projectType.slice(1)} Projesi** - Profesyonel geliştirme\n`;
    if (analysis.hasTests) readme += '- 🧪 **Test Kapsamı** - Kapsamlı test suite\n';
    if (analysis.hasCI) readme += '- 🔄 **CI/CD** - Otomatik deployment\n';
    readme += '\n';

    // Technology Stack
    readme += '## 🛠️ Teknoloji Yığını\n\n';
    readme += '| Kategori | Teknolojiler |\n';
    readme += '|----------|-------------|\n';
    readme += `| **Ana Teknolojiler** | ${analysis.technologies.map(t => `![${t}](https://img.shields.io/badge/${t.replace(' ', '_')}-blue)`).join(' ')} |\n`;
    readme += `| **Proje Türü** | ${analysis.projectType} |\n`;
    readme += `| **Paket Yöneticisi** | ${analysis.packageManager} |\n\n`;

    // Installation
    readme += '## 🚀 Kurulum\n\n';
    readme += '### Ön Gereksinimler\n\n';
    if (analysis.packageManager === 'npm') {
      readme += '- Node.js 18+ \n';
      readme += '- npm veya yarn\n\n';
    }
    readme += '### Kurulum Adımları\n\n';
    readme += this.generateInstallationSteps(analysis) + '\n';

    // Project Structure
    if (includeTree && analysis.structure) {
      readme += '## 📁 Proje Yapısı\n\n';
      readme += '```\n';
      readme += `${analysis.name}/\n`;
      readme += this.generateProjectTree(analysis.structure);
      readme += '```\n\n';
    }

    // Scripts
    if (Object.keys(analysis.scripts).length > 0) {
      readme += '## 📝 Kullanılabilir Komutlar\n\n';
      Object.entries(analysis.scripts).forEach(([script, command]) => {
        readme += `- \`npm run ${script}\` - ${command}\n`;
      });
      readme += '\n';
    }

    // Contributing
    readme += '## 🤝 Katkıda Bulunma\n\n';
    readme += '1. 🍴 **Fork** edin\n';
    readme += '2. 🌟 **Feature branch** oluşturun: `git checkout -b feature/amazing-feature`\n';
    readme += '3. 💾 **Commit** yapın: `git commit -m \'feat: add amazing feature\'`\n';
    readme += '4. 📤 **Push** edin: `git push origin feature/amazing-feature`\n';
    readme += '5. 🔄 **Pull Request** açın\n\n';

    // License
    readme += '## 📄 Lisans\n\n';
    readme += `Bu proje ${analysis.license} lisansı altında lisanslanmıştır.\n\n`;

    // Footer
    readme += '---\n\n';
    readme += '<div align="center">\n\n';
    readme += '**🌟 Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**\n\n';
    readme += `[![GitHub Stars](https://img.shields.io/github/stars/${analysis.author}/${analysis.name}.svg?style=social)](https://github.com/${analysis.author}/${analysis.name}/stargazers)\n`;
    readme += '</div>\n';

    return readme;
  }
}

class N8nIntegration {
  async sendToWebhook(webhookUrl: string, data: any): Promise<any> {
    try {
      const response = await axios.post(webhookUrl, {
        event: 'readme_generated',
        timestamp: new Date().toISOString(),
        data,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`n8n webhook failed: ${error}`);
    }
  }

  async triggerWorkflow(webhookUrl: string, repoUrl: string, config: any): Promise<any> {
    const analyzer = new GitHubAnalyzer();
    const generator = new ReadmeGenerator();

    try {
      // Analyze repository
      const analysis = await analyzer.analyzeRepository(repoUrl, true);
      
      // Generate README
      const readme = await generator.generateReadme(analysis, {
        language: config.language || 'en',
        style: config.style || 'modern',
        includeBadges: true,
        includeTree: true,
      });

      // Send to n8n
      const result = await this.sendToWebhook(webhookUrl, {
        repoUrl,
        analysis,
        readme,
        config,
      });

      return {
        success: true,
        analysis,
        readme,
        webhookResponse: result,
      };
    } catch (error) {
      throw new Error(`Workflow execution failed: ${error}`);
    }
  }
}

// MCP Server Setup
const server = new Server(
  {
    name: 'mcp-readme-generator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const analyzer = new GitHubAnalyzer();
const generator = new ReadmeGenerator();
const n8nIntegration = new N8nIntegration();

// Define tools
const tools: Tool[] = [
  {
    name: 'generate_readme',
    description: 'Generate a professional README.md file from a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        repoUrl: {
          type: 'string',
          description: 'GitHub repository URL',
        },
        language: {
          type: 'string',
          enum: ['tr', 'en', 'multi'],
          default: 'en',
          description: 'Output language',
        },
        style: {
          type: 'string',
          enum: ['minimal', 'modern', 'detailed'],
          default: 'modern',
          description: 'README style',
        },
        aiProvider: {
          type: 'string',
          enum: ['openai', 'anthropic', 'ollama'],
          default: 'openai',
          description: 'AI provider',
        },
        includeTree: {
          type: 'boolean',
          default: true,
          description: 'Include project structure tree',
        },
        includeBadges: {
          type: 'boolean',
          default: true,
          description: 'Include technology badges',
        },
      },
      required: ['repoUrl'],
    },
  },
  {
    name: 'analyze_repository',
    description: 'Analyze a GitHub repository structure and technologies',
    inputSchema: {
      type: 'object',
      properties: {
        repoUrl: {
          type: 'string',
          description: 'GitHub repository URL',
        },
        deep: {
          type: 'boolean',
          default: false,
          description: 'Perform deep analysis',
        },
      },
      required: ['repoUrl'],
    },
  },
  {
    name: 'trigger_n8n_workflow',
    description: 'Trigger an n8n workflow with README generation',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: {
          type: 'string',
          description: 'n8n webhook URL',
        },
        repoUrl: {
          type: 'string',
          description: 'GitHub repository URL',
        },
        config: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              default: 'en',
            },
            style: {
              type: 'string',
              default: 'modern',
            },
            notify: {
              type: 'boolean',
              default: true,
            },
          },
          description: 'Generation configuration',
        },
      },
      required: ['webhookUrl', 'repoUrl'],
    },
  },
];

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate_readme': {
        const params = GenerateReadmeSchema.parse(args);
        const analysis = await analyzer.analyzeRepository(params.repoUrl, true);
        const readme = await generator.generateReadme(analysis, {
          language: params.language,
          style: params.style,
          includeBadges: params.includeBadges,
          includeTree: params.includeTree,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                analysis,
                readme,
                metadata: {
                  generatedAt: new Date().toISOString(),
                  language: params.language,
                  style: params.style,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'analyze_repository': {
        const params = AnalyzeRepoSchema.parse(args);
        const analysis = await analyzer.analyzeRepository(params.repoUrl, params.deep);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                analysis,
                analyzedAt: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      }

      case 'trigger_n8n_workflow': {
        const params = N8nWebhookSchema.parse(args);
        const result = await n8nIntegration.triggerWorkflow(
          params.webhookUrl,
          params.repoUrl,
          params.config
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                result,
                triggeredAt: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP README Generator server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}